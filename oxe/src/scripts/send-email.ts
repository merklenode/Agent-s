import { db } from "../lib/db";
import { runWorkflow } from "../lib/workflow";
import { sendMonthlyReportEmail } from "../tools/email.tool";

runWorkflow("send:email", sendMonthlyReportEmail)
  .then(() => { console.log("✓ Email sent"); })
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
