"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(80),
});

export async function updateProfileAction(
  input: unknown
): Promise<ProfileActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/dashboard");
  return { ok: true };
}
