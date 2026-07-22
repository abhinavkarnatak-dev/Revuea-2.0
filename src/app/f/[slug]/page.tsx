import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormBySlug } from "@/features/forms/service";
import { getEffectiveStatus } from "@/features/forms/status";
import { formatDateTime } from "@/lib/utils";
import { IconClock, IconMaskOff } from "@/components/icons";
import { FillForm } from "./fill-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await getFormBySlug(slug);
  return {
    title: form && form.status !== "DRAFT" ? form.title : "Form not found",
    robots: { index: false }, // share links should never be indexed
  };
}

function ClosedScreen({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink/5 text-muted">
          {icon}
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
        <p className="mt-10 text-xs text-faint">
          Powered by Revuea - anonymous team feedback
        </p>
      </div>
    </main>
  );
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  // Drafts are private - indistinguishable from nonexistent forms.
  if (!form || form.status === "DRAFT") notFound();

  const status = getEffectiveStatus(form, form.responseCount);

  if (status === "scheduled") {
    return (
      <ClosedScreen
        icon={<IconClock size={26} />}
        title="Not open quite yet"
        message={
          form.opensAt
            ? `This form starts accepting responses ${formatDateTime(form.opensAt)}. Check back then.`
            : "This form isn't accepting responses yet. Check back soon."
        }
      />
    );
  }

  if (status !== "open") {
    return (
      <ClosedScreen
        icon={<IconMaskOff size={26} />}
        title="This form is closed"
        message="The collection window has ended. If you think this is a mistake, ask the person who shared the link."
      />
    );
  }

  return (
    <FillForm
      form={{
        slug: form.slug,
        title: form.title,
        description: form.description,
        accent: form.accent,
        creatorName: form.creatorName,
        questions: form.questions.map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.options,
        })),
      }}
    />
  );
}
