import { NextResponse } from "next/server";
import { getCurrentAdminAccountUser, requireAdminApiAccess } from "@/lib/account/admin";
import {
  createPersonalFileMailBatch,
  getPersonalFileMailBatchFile,
  getPersonalFileMailOverview,
  hasAccountDatabase,
  setPersonalFileMailRecipientStatus,
} from "@/lib/account/db";
import { isSmtpConfigured, sendPersonalFileMail } from "@/lib/account/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

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
    return NextResponse.json(await getPersonalFileMailOverview());
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

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "SMTP_HOST and SMTP_FROM must be configured before sending mail." },
      { status: 503 },
    );
  }

  try {
    const adminUser = await getCurrentAdminAccountUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload file is required." }, { status: 400 });
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: "Upload file must be 20 MB or smaller." },
        { status: 400 },
      );
    }

    const batch = await createPersonalFileMailBatch({
      subject,
      message,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileBytes: Buffer.from(await file.arrayBuffer()),
      createdBy: adminUser?.email ?? null,
    });

    const batchFile = await getPersonalFileMailBatchFile(batch.id);

    for (const recipient of batch.recipients) {
      try {
        await sendPersonalFileMail({
          to: recipient.email,
          name: recipient.name,
          subject: batch.subject,
          message: batch.message,
          attachment: {
            fileName: batchFile.fileName,
            contentType: batchFile.contentType,
            content: batchFile.fileBytes,
          },
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
      overview: await getPersonalFileMailOverview(),
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
