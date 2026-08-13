import { NextResponse } from "next/server";
import { getCurrentAdminAccountUser, requireAdminApiAccess } from "@/lib/account/admin";
import {
  createPersonalFileMailBatch,
  getPersonalFileMailBatchFiles,
  getPersonalFileMailOverview,
  hasAccountDatabase,
  preparePersonalFileMailEventRecipients,
  setPersonalFileMailRecipientStatus,
} from "@/lib/account/db";
import { isSmtpConfigured, sendPersonalFileMail } from "@/lib/account/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;
const DEBUG_PREFIX = "[personal-files-mail]";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function debugLog(message: string, meta?: Record<string, unknown>) {
  console.log(`${DEBUG_PREFIX} ${message}`, meta ?? {});
}

export async function GET(request: Request) {
  debugLog("GET received", {
    url: request.url,
  });

  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) {
    debugLog("GET forbidden");
    return forbiddenResponse;
  }

  if (!hasAccountDatabase()) {
    debugLog("GET missing account database");
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const batchId = new URL(request.url).searchParams.get("batchId");
    const overview = await getPersonalFileMailOverview({ batchId });
    debugLog("GET overview loaded", {
      batchId,
      paidRecipientCount: overview.paidRecipientCount,
      batchCount: overview.batches.length,
    });
    return NextResponse.json(overview);
  } catch (error) {
    console.error("[personal-files-mail] failed to load overview", {
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to load personal file mail overview." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  debugLog("POST received", {
    contentLength: request.headers.get("content-length"),
    contentType: request.headers.get("content-type"),
  });

  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) {
    debugLog("POST forbidden");
    return forbiddenResponse;
  }

  if (!hasAccountDatabase()) {
    debugLog("POST missing account database");
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const adminUser = await getCurrentAdminAccountUser();
    debugLog("POST parsing form data");
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "create-event");
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const recipientFleetIds = formData
      .getAll("recipientFleetIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    debugLog("POST parsed action", {
      action,
      adminEmail: adminUser?.email ?? null,
      subjectLength: subject.length,
      messageLength: message.length,
      recipientFleetIdCount: recipientFleetIds.length,
    });

    if (action === "create-event") {
      const files = formData
        .getAll("files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      const totalBytes = files.reduce((total, file) => total + file.size, 0);

      debugLog("create-event files parsed", {
        fileCount: files.length,
        totalBytes,
        files: files.map((file) => ({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        })),
      });

      if (files.length === 0) {
        debugLog("create-event rejected: no files");
        return NextResponse.json(
          { error: "Upload at least one file." },
          { status: 400 },
        );
      }

      if (files.length > MAX_ATTACHMENT_COUNT) {
        debugLog("create-event rejected: too many files", {
          fileCount: files.length,
        });
        return NextResponse.json(
          { error: "Upload no more than 5 files." },
          { status: 400 },
        );
      }

      if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
        debugLog("create-event rejected: file too large", {
          maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
          files: files.map((file) => ({ name: file.name, size: file.size })),
        });
        return NextResponse.json(
          { error: "Each upload file must be 20 MB or smaller." },
          { status: 400 },
        );
      }

      debugLog("create-event creating DB batch");
      const batch = await createPersonalFileMailBatch({
        subject,
        message,
        files: await Promise.all(
          files.map(async (file) => ({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            fileBytes: Buffer.from(await file.arrayBuffer()),
          })),
        ),
        createdBy: adminUser?.email ?? null,
      });
      debugLog("create-event created", {
        batchId: batch.id,
        fileCount: batch.files.length,
        fileSizeBytes: batch.fileSizeBytes,
      });

      return NextResponse.json({
        batch,
        overview: await getPersonalFileMailOverview({ batchId: batch.id }),
      });
    }

    if (action !== "send-event") {
      debugLog("POST rejected: unknown action", { action });
      return NextResponse.json({ error: "Unknown mail action." }, { status: 400 });
    }

    if (!isSmtpConfigured()) {
      debugLog("send-event rejected: SMTP not configured");
      return NextResponse.json(
        { error: "SMTP_HOST and SMTP_FROM must be configured before sending mail." },
        { status: 503 },
      );
    }

    const batchId = String(formData.get("batchId") ?? "").trim();
    if (!batchId) {
      debugLog("send-event rejected: missing batchId");
      return NextResponse.json({ error: "Select a sending event." }, { status: 400 });
    }

    if (recipientFleetIds.length === 0) {
      debugLog("send-event rejected: no recipients", { batchId });
      return NextResponse.json(
        { error: "Select at least one paid subscriber." },
        { status: 400 },
      );
    }

    debugLog("send-event preparing recipients", {
      batchId,
      recipientFleetIdCount: recipientFleetIds.length,
    });
    const { batch, recipients } = await preparePersonalFileMailEventRecipients({
      batchId,
      recipientFleetIds,
    });
    const batchFiles = await getPersonalFileMailBatchFiles(batch.id);
    debugLog("send-event prepared", {
      batchId,
      recipientCount: recipients.length,
      fileCount: batchFiles.length,
      totalAttachmentBytes: batchFiles.reduce(
        (total, file) => total + file.fileBytes.length,
        0,
      ),
    });

    for (const recipient of recipients) {
      try {
        debugLog("send-event sending recipient", {
          batchId,
          recipientId: recipient.id,
          email: recipient.email,
          attachmentCount: batchFiles.length,
        });
        await sendPersonalFileMail({
          to: recipient.email,
          name: recipient.name,
          subject: batch.subject,
          message: batch.message,
          attachments: batchFiles.map((batchFile) => ({
            fileName: batchFile.fileName,
            contentType: batchFile.contentType,
            content: batchFile.fileBytes,
          })),
        });
        await setPersonalFileMailRecipientStatus({
          recipientId: recipient.id,
          status: "sent",
        });
        debugLog("send-event recipient sent", {
          batchId,
          recipientId: recipient.id,
          email: recipient.email,
        });
      } catch (sendError) {
        debugLog("send-event recipient failed", {
          batchId,
          recipientId: recipient.id,
          email: recipient.email,
          error: getErrorMessage(sendError),
        });
        await setPersonalFileMailRecipientStatus({
          recipientId: recipient.id,
          status: "failed",
          error: getErrorMessage(sendError),
        });
      }
    }

    debugLog("send-event complete", {
      batchId,
      attemptedRecipientCount: recipients.length,
    });
    return NextResponse.json({
      overview: await getPersonalFileMailOverview({ batchId }),
    });
  } catch (error) {
    console.error("[personal-files-mail] failed to send upload", {
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to send personal file mail." },
      { status: 500 },
    );
  }
}
