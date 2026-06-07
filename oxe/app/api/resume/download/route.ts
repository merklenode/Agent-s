import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";

export async function GET() {
  const resume = await db.resumeVersion.findFirst({ orderBy: { version: "desc" } });

  if (!resume?.pdfPath) {
    return new NextResponse("No PDF available. Run pnpm generate:resume first.", { status: 404 });
  }

  const absPath = path.resolve(resume.pdfPath);
  if (!fs.existsSync(absPath)) {
    return new NextResponse("PDF file not found on disk.", { status: 404 });
  }

  const buffer = fs.readFileSync(absPath);
  const filename = path.basename(absPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
