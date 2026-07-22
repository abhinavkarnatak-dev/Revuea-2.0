import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/features/auth/session";

/** RFC 4180-ish CSV escaping - no dependency needed. */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * CSV export of a form's responses.
 * Authenticated AND ownership-checked - the old app exposed this publicly.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const form = await prisma.form.findFirst({
    where: { id: formId, creatorId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        orderBy: { submittedAt: "asc" },
        include: { answers: true },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  if (form.responses.length === 0) {
    return NextResponse.json({ error: "No responses yet" }, { status: 400 });
  }

  const header = ["#", ...form.questions.map((q) => q.label)];
  const rows = form.responses.map((response, i) => {
    const byQuestion = new Map(response.answers.map((a) => [a.questionId, a]));
    const cells = form.questions.map((q) => {
      const answer = byQuestion.get(q.id);
      if (!answer) return "";
      switch (q.type) {
        case "TEXT":
          return answer.textValue ?? "";
        case "RATING":
          return answer.ratingValue?.toString() ?? "";
        case "YES_NO":
          return answer.optionIndexes[0] === 0
            ? "Yes"
            : answer.optionIndexes[0] === 1
              ? "No"
              : "";
        default:
          return answer.optionIndexes
            .map((idx) => q.options[idx] ?? "")
            .filter(Boolean)
            .join("; ");
      }
    });
    return [(i + 1).toString(), ...cells];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const safeTitle = form.title.replace(/[^a-z0-9-_ ]/gi, "").slice(0, 40) || "responses";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}.csv"`,
    },
  });
}
