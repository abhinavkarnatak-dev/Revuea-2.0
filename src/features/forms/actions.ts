"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { formSchema } from "./schema";
import * as forms from "./service";

export type FormActionResult =
  | { ok: true; formId: string }
  | { ok: false; error: string };

export async function createFormAction(
  input: unknown
): Promise<FormActionResult> {
  const user = await requireUser();
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form for errors.",
    };
  }

  try {
    const result = await forms.createForm(user.id, parsed.data);
    if (!result.ok) {
      return {
        ok: false,
        error: "You already have a form with this title - pick another.",
      };
    }
    revalidatePath("/dashboard");
    return { ok: true, formId: result.form.id };
  } catch (err) {
    console.error("createForm failed:", err);
    return { ok: false, error: "Couldn't create the form. Try again." };
  }
}

export async function updateFormAction(
  formId: string,
  input: unknown
): Promise<FormActionResult> {
  const user = await requireUser();
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form for errors.",
    };
  }

  try {
    const result = await forms.updateForm(formId, user.id, parsed.data);
    if (!result.ok) {
      const messages = {
        "has-responses":
          "Questions can't change once responses exist. You can still edit the title, description, and settings.",
        "title-taken":
          "You already have a form with this title - pick another.",
        "not-found": "Form not found.",
      } as const;
      return { ok: false, error: messages[result.error] };
    }
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/forms/${formId}`);
    return { ok: true, formId };
  } catch (err) {
    console.error("updateForm failed:", err);
    return { ok: false, error: "Couldn't save changes. Try again." };
  }
}

export async function setFormStatusAction(
  formId: string,
  status: "DRAFT" | "OPEN" | "CLOSED"
): Promise<FormActionResult> {
  const user = await requireUser();
  const form = await forms.setFormStatus(formId, user.id, status);
  if (!form) return { ok: false, error: "Form not found." };
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/forms/${formId}`);
  return { ok: true, formId };
}

export async function deleteFormAction(formId: string): Promise<void> {
  const user = await requireUser();
  await forms.deleteForm(formId, user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function duplicateFormAction(
  formId: string
): Promise<FormActionResult> {
  const user = await requireUser();
  const copy = await forms.duplicateForm(formId, user.id);
  if (!copy) return { ok: false, error: "Form not found." };
  revalidatePath("/dashboard");
  return { ok: true, formId: copy.id };
}
