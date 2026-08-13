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

function createTrace(request: Request, method: "GET" | "POST") {
  const traceId =
    request.headers.get("x-personal-mail-trace-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  return {
    id: traceId,
    log(step: string, meta?: Record<string, unknown>) {
      console.log(`${DEBUG_PREFIX} trace`, {
        traceId,
        method,
        step,
        elapsedMs: Date.now() - startedAt,
        ...(meta ?? {}),
      });
    },
    error(step: string, error: unknown, meta?: Record<string, unknown>) {
      console.error(`${DEBUG_PREFIX} trace error`, {
        traceId,
        method,
        step,
        elapsedMs: Date.now() - startedAt,
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...(meta ?? {}),
      });
    },
    json(body: Record<string, unknown>, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      headers.set("x-personal-mail-trace-id", traceId);
      return NextResponse.json({ traceId, ...body }, { ...init, headers });
    },
  };
}

export async function GET(request: Request) {
  const trace = createTrace(request, "GET");
  trace.log("received", {
    url: request.url,
  });

  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) {
    trace.log("forbidden");
    return forbiddenResponse;
  }

  if (!hasAccountDatabase()) {
    trace.log("missing-account-database");
    return trace.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const batchId = new URL(request.url).searchParams.get("batchId");
    const overview = await getPersonalFileMailOverview({ batchId });
    trace.log("overview-loaded", {
      batchId,
      paidRecipientCount: overview.paidRecipientCount,
      batchCount: overview.batches.length,
    });
    return trace.json(overview as unknown as Record<string, unknown>);
  } catch (error) {
    trace.error("overview-load-failed", error);

    return trace.json(
      { error: "Failed to load personal file mail overview." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const trace = createTrace(request, "POST");
  trace.log("received", {
    contentLength: request.headers.get("content-length"),
    contentType: request.headers.get("content-type"),
  });

  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) {
    trace.log("forbidden");
    return forbiddenResponse;
  }

  if (!hasAccountDatabase()) {
    trace.log("missing-account-database");
    return trace.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const adminUser = await getCurrentAdminAccountUser();
    trace.log("form-data-parse-start");
    let formData: FormData;
    try {
      formData = await request.formData();
      trace.log("form-data-parse-complete");
    } catch (formError) {
      trace.error("form-data-parse-failed", formError, {
        contentLength: request.headers.get("content-length"),
        contentType: request.headers.get("content-type"),
      });
      return trace.json(
        { error: `Failed to parse upload form: ${getErrorMessage(formError)}` },
        { status: 400 },
      );
    }
    const action = String(formData.get("action") ?? "create-event");
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const recipientFleetIds = formData
      .getAll("recipientFleetIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    trace.log("action-parsed", {
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

      trace.log("create-event-files-parsed", {
        fileCount: files.length,
        totalBytes,
        files: files.map((file) => ({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        })),
      });

      if (files.length > MAX_ATTACHMENT_COUNT) {
        trace.log("create-event-rejected-too-many-files", {
          fileCount: files.length,
        });
        return trace.json(
          { error: "Upload no more than 5 files." },
          { status: 400 },
        );
      }

      if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
        trace.log("create-event-rejected-file-too-large", {
          maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
          files: files.map((file) => ({ name: file.name, size: file.size })),
        });
        return trace.json(
          { error: "Each upload file must be 20 MB or smaller." },
          { status: 400 },
        );
      }

      trace.log("create-event-db-create-start");
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
      trace.log("create-event-db-create-complete", {
        batchId: batch.id,
        fileCount: batch.files.length,
        fileSizeBytes: batch.fileSizeBytes,
      });

      trace.log("create-event-overview-load-start", { batchId: batch.id });
      const overview = await getPersonalFileMailOverview({ batchId: batch.id });
      trace.log("create-event-complete", { batchId: batch.id });
      return trace.json({
        batch,
        overview,
      });
    }

    if (action !== "send-event") {
      trace.log("unknown-action", { action });
      return trace.json({ error: "Unknown mail action." }, { status: 400 });
    }

    if (!isSmtpConfigured()) {
      trace.log("send-event-rejected-smtp-not-configured");
      return trace.json(
        { error: "SMTP_HOST and SMTP_FROM must be configured before sending mail." },
        { status: 503 },
      );
    }

    const batchId = String(formData.get("batchId") ?? "").trim();
    if (!batchId) {
      trace.log("send-event-rejected-missing-batch-id");
      return trace.json({ error: "Select a sending event." }, { status: 400 });
    }

    if (recipientFleetIds.length === 0) {
      trace.log("send-event-rejected-no-recipients", { batchId });
      return trace.json(
        { error: "Select at least one paid subscriber." },
        { status: 400 },
      );
    }

    trace.log("send-event-prepare-recipients-start", {
      batchId,
      recipientFleetIdCount: recipientFleetIds.length,
    });
    const { batch, recipients } = await preparePersonalFileMailEventRecipients({
      batchId,
      recipientFleetIds,
    });
    trace.log("send-event-prepare-recipients-complete", {
      batchId,
      recipientCount: recipients.length,
    });
    trace.log("send-event-load-files-start", { batchId });
    const batchFiles = await getPersonalFileMailBatchFiles(batch.id);
    trace.log("send-event-load-files-complete", {
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
        trace.log("send-event-recipient-send-start", {
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
        trace.log("send-event-recipient-sent", {
          batchId,
          recipientId: recipient.id,
          email: recipient.email,
        });
      } catch (sendError) {
        trace.error("send-event-recipient-failed", sendError, {
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

    trace.log("send-event-complete", {
      batchId,
      attemptedRecipientCount: recipients.length,
    });
    trace.log("send-event-overview-load-start", { batchId });
    const overview = await getPersonalFileMailOverview({ batchId });
    trace.log("send-event-response-ready", { batchId });
    return trace.json({
      overview,
    });
  } catch (error) {
    trace.error("post-unhandled-error", error);

    return trace.json(
      { error: getErrorMessage(error) || "Failed to send personal file mail." },
      { status: 500 },
    );
  }
}
