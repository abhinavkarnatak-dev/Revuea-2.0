import type { Metadata } from "next";
import Link from "next/link";
import { FormBuilder } from "@/features/forms/components/form-builder";
import { IconArrowLeft } from "@/components/icons";

export const metadata: Metadata = { title: "New form" };

export default function NewFormPage() {
  return (
    <div>
      <div className="mx-auto mb-8 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft size={15} />
          Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">
          New feedback form
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          It starts as a private draft - nothing is shared until you open it.
        </p>
      </div>
      <FormBuilder mode="create" />
    </div>
  );
}
