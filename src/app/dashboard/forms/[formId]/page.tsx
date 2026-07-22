import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { getFormForCreator } from "@/features/forms/service";
import { getFormAnalytics } from "@/features/analytics/service";
import { listResponses } from "@/features/responses/service";
import { getEffectiveStatus, STATUS_META } from "@/features/forms/status";
import { env } from "@/lib/env";
import { cn, formatDate, pluralize } from "@/lib/utils";
import { ACCENT_STYLES } from "@/features/forms/components/accents";
import type { AccentValue } from "@/features/forms/schema";
import { Badge } from "@/components/ui/badge";
import { IconArrowLeft } from "@/components/icons";
import { FormActions } from "./form-actions";
import { ShareLink } from "./share-link";
import { FormTabs } from "./form-tabs";

export const metadata: Metadata = { title: "Form" };

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const user = await requireUser();
  const { formId } = await params;

  const form = await getFormForCreator(formId, user.id);
  if (!form) notFound();

  const [analytics, responses] = await Promise.all([
    getFormAnalytics(form.id),
    listResponses(form.id),
  ]);

  const status = getEffectiveStatus(form, form.responseCount);
  const statusMeta = STATUS_META[status];
  const shareUrl = `${env.appUrl}/f/${form.slug}`;

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <IconArrowLeft size={15} />
        Dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "h-7 w-1.5 rounded-full",
                (ACCENT_STYLES[form.accent as AccentValue] ?? ACCENT_STYLES.evergreen).solid
              )}
            />
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              {form.title}
            </h1>
            <Badge tone={statusMeta.tone} dot>
              {statusMeta.label}
            </Badge>
          </div>
          {form.description && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
              {form.description}
            </p>
          )}
          <p className="mt-2 text-[13px] text-faint">
            {pluralize(form.responseCount, "response")} · Created{" "}
            {formatDate(form.createdAt)}
            {form.closesAt && ` · Deadline ${formatDate(form.closesAt)}`}
            {form.responseLimit != null &&
              ` · Capped at ${form.responseLimit} responses`}
          </p>
        </div>
        <FormActions
          formId={form.id}
          status={status}
          hasResponses={form.responseCount > 0}
          accent={form.accent}
        />
      </div>

      {status !== "draft" && (
        <div className="mt-6">
          <ShareLink
            url={shareUrl}
            open={status === "open"}
            accent={form.accent}
          />
        </div>
      )}

      <div className="mt-8">
        <FormTabs
          accent={form.accent}
          form={{
            id: form.id,
            responseCount: form.responseCount,
            questions: form.questions.map((q) => ({
              id: q.id,
              type: q.type,
              label: q.label,
              options: q.options,
            })),
          }}
          analytics={{
            responseCount: analytics.responseCount,
            completionByQuestion: analytics.completionByQuestion,
            timeline: analytics.timeline.map((t) => ({
              bucket: t.bucket.toISOString(),
              count: t.count,
            })),
          }}
          responses={responses.map((r) => ({
            id: r.id,
            submittedAt: r.submittedAt.toISOString(),
            answers: r.answers,
          }))}
        />
      </div>
    </div>
  );
}
