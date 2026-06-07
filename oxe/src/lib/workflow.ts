import { db } from "./db";

export async function runWorkflow<T>(workflow: string, task: () => Promise<T>) {
  const run = await db.workflowRun.create({
    data: {
      workflow,
      status: "running",
    },
  });

  try {
    const result = await task();
    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        finishedAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
    throw error;
  }
}
