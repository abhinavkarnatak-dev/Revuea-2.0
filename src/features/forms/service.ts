import "server-only";
import { prisma } from "@/lib/prisma";
import { generateFormSlug } from "@/lib/utils";
import type { FormInput } from "./schema";
import type { Form, Question } from "@prisma/client";

export type FormWithCounts = Form & { responseCount: number };
export type FormWithQuestions = Form & { questions: Question[] };
export type FormDetail = FormWithQuestions & { responseCount: number };

/** All forms belonging to a user, with response counts in a single query. */
export async function listFormsForUser(
  userId: string
): Promise<FormWithCounts[]> {
  const forms = await prisma.form.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });
  return forms.map(({ _count, ...form }) => ({
    ...form,
    responseCount: _count.responses,
  }));
}

/** A single form, only if owned by `userId`. Ownership enforced here, once. */
export async function getFormForCreator(
  formId: string,
  userId: string
): Promise<FormDetail | null> {
  const form = await prisma.form.findFirst({
    where: { id: formId, creatorId: userId },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
  if (!form) return null;
  const { _count, ...rest } = form;
  return { ...rest, responseCount: _count.responses };
}

/** Public lookup by share slug - no creator identity beyond first name needed. */
export async function getFormBySlug(slug: string): Promise<
  | (FormWithQuestions & {
      responseCount: number;
      creatorName: string | null;
    })
  | null
> {
  const form = await prisma.form.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      creator: { select: { name: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!form) return null;
  const { creator, _count, ...rest } = form;
  return {
    ...rest,
    responseCount: _count.responses,
    creatorName: creator.name,
  };
}

/** Case-insensitive per-user title collision check. */
async function titleTaken(
  userId: string,
  title: string,
  excludeFormId?: string
): Promise<boolean> {
  const existing = await prisma.form.findFirst({
    where: {
      creatorId: userId,
      title: { equals: title, mode: "insensitive" },
      ...(excludeFormId && { id: { not: excludeFormId } }),
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export type CreateFormResult =
  | { ok: true; form: Form }
  | { ok: false; error: "title-taken" };

export async function createForm(
  userId: string,
  input: FormInput
): Promise<CreateFormResult> {
  if (await titleTaken(userId, input.title)) {
    return { ok: false, error: "title-taken" };
  }
  const form = await prisma.form.create({
    data: {
      slug: generateFormSlug(),
      title: input.title,
      description: input.description,
      accent: input.accent,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      responseLimit: input.responseLimit,
      creatorId: userId,
      questions: {
        create: input.questions.map((q, index) => ({
          order: index,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.type === "MCQ" || q.type === "MULTI" ? q.options : [],
        })),
      },
    },
  });
  return { ok: true, form };
}

export type UpdateFormResult =
  | { ok: true; form: Form }
  | { ok: false; error: "not-found" | "has-responses" | "title-taken" };

/**
 * Full update (metadata + questions). Question edits are blocked once
 * responses exist - changing questions under collected answers would
 * corrupt analytics. Metadata-only edits stay allowed.
 */
export async function updateForm(
  formId: string,
  userId: string,
  input: FormInput
): Promise<UpdateFormResult> {
  const existing = await prisma.form.findFirst({
    where: { id: formId, creatorId: userId },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
  if (!existing) return { ok: false, error: "not-found" };

  if (await titleTaken(userId, input.title, formId)) {
    return { ok: false, error: "title-taken" };
  }

  const questionsChanged =
    existing.questions.length !== input.questions.length ||
    existing.questions.some((q, i) => {
      const next = input.questions[i];
      return (
        !next ||
        next.id !== q.id ||
        next.type !== q.type ||
        next.label !== q.label ||
        next.required !== q.required ||
        JSON.stringify(next.options) !== JSON.stringify(q.options)
      );
    });

  if (existing._count.responses > 0 && questionsChanged) {
    return { ok: false, error: "has-responses" };
  }

  const form = await prisma.$transaction(async (tx) => {
    if (questionsChanged) {
      await tx.question.deleteMany({ where: { formId } });
    }
    return tx.form.update({
      where: { id: formId },
      data: {
        title: input.title,
        description: input.description,
        accent: input.accent,
        opensAt: input.opensAt ? new Date(input.opensAt) : null,
        closesAt: input.closesAt ? new Date(input.closesAt) : null,
        responseLimit: input.responseLimit,
        ...(questionsChanged && {
          questions: {
            create: input.questions.map((q, index) => ({
              order: index,
              type: q.type,
              label: q.label,
              required: q.required,
              options:
                q.type === "MCQ" || q.type === "MULTI" ? q.options : [],
            })),
          },
        }),
      },
    });
  });

  return { ok: true, form };
}

export async function setFormStatus(
  formId: string,
  userId: string,
  status: "DRAFT" | "OPEN" | "CLOSED"
): Promise<Form | null> {
  const existing = await prisma.form.findFirst({
    where: { id: formId, creatorId: userId },
    include: { _count: { select: { responses: true } } },
  });
  if (!existing) return null;

  const data: { status: typeof status; closesAt?: null; responseLimit?: null } =
    { status };

  // Reopening must actually reopen: clear constraints that would keep the
  // effective status "closed" (an expired deadline or a reached cap).
  if (status === "OPEN") {
    if (existing.closesAt && existing.closesAt <= new Date()) {
      data.closesAt = null;
    }
    if (
      existing.responseLimit != null &&
      existing._count.responses >= existing.responseLimit
    ) {
      data.responseLimit = null;
    }
  }

  return prisma.form.update({ where: { id: formId }, data });
}

export async function deleteForm(
  formId: string,
  userId: string
): Promise<boolean> {
  const { count } = await prisma.form.deleteMany({
    where: { id: formId, creatorId: userId },
  });
  return count > 0;
}

/** Clone a form (questions included, responses excluded) as a new draft. */
export async function duplicateForm(
  formId: string,
  userId: string
): Promise<Form | null> {
  const source = await prisma.form.findFirst({
    where: { id: formId, creatorId: userId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!source) return null;

  // Smart copy naming: duplicating "test" → "test (copy)"; duplicating that
  // (or duplicating again) → "test (copy 2)", "test (copy 3)", …
  const base = source.title.replace(/ \(copy(?: \d+)?\)$/i, "");
  const siblings = await prisma.form.findMany({
    where: {
      creatorId: userId,
      title: { startsWith: base, mode: "insensitive" },
    },
    select: { title: true },
  });
  const taken = new Set(siblings.map((f) => f.title.toLowerCase()));
  let title = `${base} (copy)`;
  for (let n = 2; taken.has(title.toLowerCase()); n++) {
    title = `${base} (copy ${n})`;
  }

  return prisma.form.create({
    data: {
      slug: generateFormSlug(),
      title: title.slice(0, 120),
      description: source.description,
      accent: source.accent,
      status: "DRAFT",
      responseLimit: source.responseLimit,
      creatorId: userId,
      questions: {
        create: source.questions.map((q) => ({
          order: q.order,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.options,
        })),
      },
    },
  });
}
