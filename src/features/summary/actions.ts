"use server";

import { requireUser } from "@/features/auth/session";
import { prisma } from "@/lib/prisma";
import { getOrGenerateSummary, type SummaryResult } from "./service";

export async function generateSummaryAction(
  formId: string,
  options: { force?: boolean } = {}
): Promise<SummaryResult> {
  const user = await requireUser();

  // Ownership check - the old app let any logged-in user summarize any form.
  const form = await prisma.form.findFirst({
    where: { id: formId, creatorId: user.id },
    select: { id: true },
  });
  if (!form) return { ok: false, error: "Form not found." };

  return getOrGenerateSummary(formId, options);
}
