import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Entrance, Reveal } from "@/components/motion/reveal";
import { HeroVisual } from "@/components/marketing/hero-visual";
import {
  IconChart,
  IconClock,
  IconDownload,
  IconLink,
  IconMaskOff,
  IconShield,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

const steps = [
  {
    number: "01",
    title: "Build your form in minutes",
    body: "Open questions, multiple choice, ratings, yes/no - mix them freely. Save as a draft, set a deadline, cap responses.",
  },
  {
    number: "02",
    title: "Share a single link",
    body: "One unguessable link for the whole team. No sign-in for respondents, no app to install, works beautifully on phones.",
  },
  {
    number: "03",
    title: "Hear what people really think",
    body: "Live analytics as responses arrive, plus an AI digest of themes, sentiment, and suggested next steps.",
  },
];

const features = [
  {
    icon: <IconChart size={18} />,
    title: "Analytics that answer questions",
    body: "Option breakdowns, rating averages, response timelines - readable at a glance, not a data-science project.",
  },
  {
    icon: <IconSparkles size={18} />,
    title: "AI-digested feedback",
    body: "Gemini reads every response and surfaces what's working, what needs attention, and what to do next.",
  },
  {
    icon: <IconClock size={18} />,
    title: "Deadlines & response caps",
    body: "Schedule open and close times or cap total responses. Forms close themselves - no babysitting.",
  },
  {
    icon: <IconUsers size={18} />,
    title: "Zero-friction for respondents",
    body: "No accounts, no installs. A calm, focused, one-question-at-a-time flow people actually finish.",
  },
  {
    icon: <IconDownload size={18} />,
    title: "Own your data",
    body: "Export every response to CSV whenever you like - available only to you, never to anyone with the link.",
  },
  {
    icon: <IconLink size={18} />,
    title: "Drafts & duplicates",
    body: "Iterate on drafts privately, duplicate last quarter's form in one click, reopen or close any time.",
  },
];

const anonymityPoints = [
  {
    title: "No identity, ever",
    body: "Responses are stored with no name, email, account, or session attached. There is no join to make.",
  },
  {
    title: "Timestamps are blurred",
    body: "Submission times are rounded to the hour before they're saved - nobody can match a response to who was online.",
  },
  {
    title: "No fingerprints",
    body: "No IP addresses, no device data, no browser fingerprints in the database. Rate limiting happens in memory and is thrown away.",
  },
  {
    title: "Unguessable links",
    body: "Form links use random 12-character slugs - they can't be enumerated or stumbled into.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-2 lg:gap-8">
          <div>
            <Entrance delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium text-ink-soft">
                <IconShield size={14} className="text-ever" />
                Anonymous by architecture
              </span>
            </Entrance>
            <Entrance delay={0.12}>
              <h1 className="mt-5 font-display text-[44px] font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Feedback people are{" "}
                <em className="text-ever not-italic underline decoration-ever/25 decoration-[3px] underline-offset-8">
                  actually honest
                </em>{" "}
                about.
              </h1>
            </Entrance>
            <Entrance delay={0.24}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Revuea gives your team a truly anonymous way to tell you what's
                working - and what isn't. Create a form, share one link, hear
                the truth.
              </p>
            </Entrance>
            <Entrance delay={0.36}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/login">
                  <Button size="lg">Start collecting - it's free</Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg">
                    See how it works
                  </Button>
                </a>
              </div>
            </Entrance>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ever">
              How it works
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              From question to insight in an afternoon.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.12}>
                <div className="border-t-2 border-ever/20 pt-5">
                  <span className="font-display text-sm font-medium text-ever">
                    {step.number}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Anonymity promise (dark) ─────────────────────── */}
      <section className="bg-inkwell">
        <div className="mx-auto w-full max-w-6xl px-5 py-24">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-ever/20 text-ever-bright">
                <IconMaskOff size={20} />
              </span>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ever-bright">
                The trust promise
              </p>
            </div>
            <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-paper-text sm:text-[40px]">
              Anonymous by architecture,
              <br />
              not by promise.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-paper-text-dim">
              Most tools promise anonymity in their privacy policy. Revuea
              enforces it in the database schema - the data needed to
              de-anonymize a response simply never exists.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-line-dark bg-line-dark sm:grid-cols-2">
            {anonymityPoints.map((point, i) => (
              <Reveal key={point.title} delay={i * 0.08} className="bg-inkwell-soft p-7">
                <h3 className="font-medium text-paper-text">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper-text-dim">
                  {point.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <Reveal>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ever">
            Everything you need
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Built for the person reading the feedback, too.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.1}>
              <div className="h-full rounded-card border border-line bg-surface p-6 shadow-card transition-shadow duration-300 hover:shadow-lift">
                <span className="flex size-9 items-center justify-center rounded-xl bg-ever-tint text-ever">
                  {feature.icon}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-5xl">
              The truth is one link away.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Create your first anonymous feedback form in the next five
              minutes. No credit card, no setup.
            </p>
            <div className="mt-8">
              <Link href="/login">
                <Button size="lg">Create a free form</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
