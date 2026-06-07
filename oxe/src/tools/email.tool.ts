import fs from "fs";
import nodemailer from "nodemailer";
import { db } from "../lib/db";

export async function sendMonthlyReportEmail() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  const EMAIL_TO = process.env.EMAIL_TO ?? process.env.LETTER_TO;
  if (!SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
    throw new Error("SMTP_USER, SMTP_PASS, and EMAIL_TO must be set in .env");
  }

  const [monthly, resume] = await Promise.all([
    db.monthlyReport.findFirst({ orderBy: { generatedAt: "desc" } }),
    db.resumeVersion.findFirst({ orderBy: { version: "desc" } }),
  ]);

  const subject = monthly
    ? `Monthly Dev Report — ${monthly.year}-${String(monthly.month).padStart(2, "0")}`
    : "Monthly Dev Report";

  const text = monthly?.content ?? "No monthly report available.";

  const attachments =
    resume?.pdfPath && fs.existsSync(resume.pdfPath)
      ? [{ filename: `resume-v${resume.version}.pdf`, path: resume.pdfPath }]
      : [];

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({ from: SMTP_USER, to: EMAIL_TO, subject, text, attachments });
    await db.emailLog.create({ data: { to: EMAIL_TO, subject, status: "sent" } });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await db.emailLog.create({ data: { to: EMAIL_TO, subject, status: "failed", error } });
    throw err;
  }
}
