import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { getFormForCreator } from "@/features/forms/service";
import { FormBuilder } from "@/features/forms/components/form-builder";
import type { AccentValue, QuestionTypeValue } from "@/features/forms/schema";
import { IconArrowLeft } from "@/components/icons";

export const metadata: Metadata = { title: "Edit form" };

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const user = await requireUser();
  const { formId } = await params;
  const form = await getFormForCreator(formId, user.id);
  if (!form) notFound();

  return (
    <div>
      <div className="mx-auto mb-8 max-w-2xl">
        <Link
          href={`/dashboard/forms/${form.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft size={15} />
          Back to form
        </Link>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">
          Edit form
        </h1>
        {form.responseCount > 0 && (
          <p className="mt-1.5 text-[15px] text-muted">
            Responses have arrived, so questions are locked - title,
            description, and settings can still change.
          </p>
        )}
      </div>
      <FormBuilder
        mode="edit"
        formId={form.id}
        questionsLocked={form.responseCount > 0}
        initial={{
          title: form.title,
          description: form.description,
          accent: form.accent as AccentValue,
          opensAt: form.opensAt?.toISOString() ?? null,
          closesAt: form.closesAt?.toISOString() ?? null,
          responseLimit: form.responseLimit,
          questions: form.questions.map((q) => ({
            id: q.id,
            type: q.type as QuestionTypeValue,
            label: q.label,
            required: q.required,
            options: q.options,
          })),
        }}
      />
    </div>
  );
}
