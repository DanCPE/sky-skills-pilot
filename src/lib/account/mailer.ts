import nodemailer from "nodemailer";

export interface MailAttachment {
  fileName: string;
  contentType: string;
  content: Buffer;
}

export interface SendPersonalFileMailInput {
  to: string;
  name: string;
  subject: string;
  message: string;
  attachments: MailAttachment[];
}

function getSmtpPort() {
  const value = Number(process.env.SMTP_PORT ?? 587);
  return Number.isFinite(value) && value > 0 ? value : 587;
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getTransport() {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP_HOST and SMTP_FROM are required before sending mail.");
  }

  const user = process.env.SMTP_USER || undefined;
  const pass = process.env.SMTP_PASS || undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: getSmtpPort(),
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined,
  });
}

function getHtmlBody(name: string, message: string) {
  const escapedName = name.replace(/[<>&"]/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
    };
    return entities[char] ?? char;
  });
  const escapedMessage = message
    .replace(/[<>&"]/g, (char) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
      };
      return entities[char] ?? char;
    })
    .replace(/\n/g, "<br />");

  return `
    <div style="font-family: Arial, sans-serif; color: #18181b; line-height: 1.6;">
      <p>Hi ${escapedName},</p>
      <p>${escapedMessage}</p>
      <p>SkySkills Team</p>
    </div>
  `;
}

export async function sendPersonalFileMail(input: SendPersonalFileMailInput) {
  const transport = getTransport();
  const text = `Hi ${input.name},\n\n${input.message}\n\nSkySkills Team`;

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text,
    html: getHtmlBody(input.name, input.message),
    attachments: input.attachments.map((attachment) => ({
      filename: attachment.fileName,
      contentType: attachment.contentType,
      content: attachment.content,
    })),
  });
}
