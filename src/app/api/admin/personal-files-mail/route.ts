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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: Request) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const batchId = new URL(request.url).searchParams.get("batchId");
    return NextResponse.json(await getPersonalFileMailOverview({ batchId }));
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
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const adminUser = await getCurrentAdminAccountUser();
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "create-event");
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const recipientFleetIds = formData
      .getAll("recipientFleetIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (action === "create-event") {
      const files = formData
        .getAll("files")
        .filter((value): value is File => value instanceof File && value.size > 0);

      if (files.length > MAX_ATTACHMENT_COUNT) {
        return NextResponse.json(
          { error: "Upload no more than 5 files." },
          { status: 400 },
        );
      }

      if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
        return NextResponse.json(
          { error: "Each upload file must be 20 MB or smaller." },
          { status: 400 },
        );
      }

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

      return NextResponse.json({
        batch,
        overview: await getPersonalFileMailOverview({ batchId: batch.id }),
      });
    }

    if (action !== "send-event") {
      return NextResponse.json({ error: "Unknown mail action." }, { status: 400 });
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "SMTP_HOST and SMTP_FROM must be configured before sending mail." },
        { status: 503 },
      );
    }

    const batchId = String(formData.get("batchId") ?? "").trim();
    if (!batchId) {
      return NextResponse.json({ error: "Select a sending event." }, { status: 400 });
    }

    if (recipientFleetIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one paid subscriber." },
        { status: 400 },
      );
    }

    const { batch, recipients } = await preparePersonalFileMailEventRecipients({
      batchId,
      recipientFleetIds,
    });
    const batchFiles = await getPersonalFileMailBatchFiles(batch.id);

    for (const recipient of recipients) {
      try {
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
      } catch (sendError) {
        await setPersonalFileMailRecipientStatus({
          recipientId: recipient.id,
          status: "failed",
          error: getErrorMessage(sendError),
        });
      }
    }

    return NextResponse.json({
      overview: await getPersonalFileMailOverview({ batchId }),
    });
  } catch (error) {
    console.error("[personal-files-mail] failed to update mail event", {
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to update mail event." },
      { status: 500 },
    );
  }
}
