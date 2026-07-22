import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { listFormsForUser } from "@/features/forms/service";
import { getEffectiveStatus, STATUS_META } from "@/features/forms/status";
import { ACCENT_STYLES } from "@/features/forms/components/accents";
import type { AccentValue } from "@/features/forms/schema";
import { cn, formatDate, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Entrance } from "@/components/motion/reveal";
import { IconInbox, IconPlus } from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const forms = await listFormsForUser(user.id);

  const totalResponses = forms.reduce((sum, f) => sum + f.responseCount, 0);
  const openCount = forms.filter(
    (f) => getEffectiveStatus(f, f.responseCount) === "open"
  ).length;

  const firstName = user.name?.split(" ")[0];

  return (
    <div>
      <Entrance>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
              {firstName ? `Good to see you, ${firstName}.` : "Your forms"}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted">
              {forms.length === 0
                ? "Create your first form and start hearing the truth."
                : `${pluralize(forms.length, "form")} · ${pluralize(totalResponses, "response")} collected`}
            </p>
          </div>
          <Link href="/dashboard/forms/new">
            <Button>
              <IconPlus size={16} />
              New form
            </Button>
          </Link>
        </div>
      </Entrance>

      {forms.length > 0 && (
        <Entrance delay={0.08}>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Forms", value: forms.length },
              { label: "Responses", value: totalResponses },
              { label: "Collecting now", value: openCount },
            ].map((stat) => (
              <Card key={stat.label} className="px-5 py-4">
                <p className="tabular font-display text-[28px] font-medium text-ink">
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{stat.label}</p>
              </Card>
            ))}
          </div>
        </Entrance>
      )}

      <div className="mt-8">
        {forms.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconInbox size={22} />}
              title="No forms yet"
              description="A form takes about two minutes to build. Share one link, and honest feedback starts arriving."
              action={
                <Link href="/dashboard/forms/new">
                  <Button>
                    <IconPlus size={16} />
                    Create your first form
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {forms.map((form, i) => {
              const status = getEffectiveStatus(form, form.responseCount);
              const meta = STATUS_META[status];
              const accent =
                ACCENT_STYLES[form.accent as AccentValue] ??
                ACCENT_STYLES.evergreen;
              return (
                <Entrance key={form.id} delay={0.12 + Math.min(i, 6) * 0.05}>
                  <Link href={`/dashboard/forms/${form.id}`} className="block">
                    <Card className="group h-full overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                      {/* Form's theme accent - same color the respondents see */}
                      <div
                        aria-hidden="true"
                        className={cn(
                          "mb-3.5 h-1 w-9 rounded-full transition-all duration-300 group-hover:w-14",
                          accent.solid
                        )}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-display text-lg font-medium leading-snug text-ink">
                          {form.title}
                        </h2>
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </div>
                      {form.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                          {form.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-[13px] text-faint">
                        <span className="tabular font-medium text-ink-soft">
                          {pluralize(form.responseCount, "response")}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Created {formatDate(form.createdAt)}</span>
                        {form.closesAt && status === "open" && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Closes {formatDate(form.closesAt)}</span>
                          </>
                        )}
                      </div>
                    </Card>
                  </Link>
                </Entrance>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
