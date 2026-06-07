"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { collectGithub } from "../collectors/github.collector";
import { generateMonthlyReport } from "../generators/monthly.generator";
import { generateWeeklyReport } from "../generators/weekly.generator";
import { generateResume } from "../generators/resume.generator";
import { runWorkflow } from "../lib/workflow";
import { sendMonthlyReportEmail } from "../tools/email.tool";

function refreshReportViews() {
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/workflow");
}

export async function generateWeeklyReportAction() {
  await runWorkflow("generate:weekly", generateWeeklyReport);
  refreshReportViews();
  redirect("/reports");
}

export async function generateMonthlyReportAction() {
  await runWorkflow("generate:monthly", generateMonthlyReport);
  refreshReportViews();
  redirect("/reports");
}

export async function collectGithubAction() {
  await runWorkflow("collect:github", collectGithub);
  revalidatePath("/dashboard");
  revalidatePath("/github");
  revalidatePath("/workflow");
  redirect("/workflow");
}

export async function generateResumeAction() {
  await runWorkflow("generate:resume", generateResume);
  revalidatePath("/resume");
  revalidatePath("/workflow");
  redirect("/resume");
}

export async function sendEmailAction() {
  await runWorkflow("send:email", sendMonthlyReportEmail);
  revalidatePath("/workflow");
  redirect("/workflow");
}
