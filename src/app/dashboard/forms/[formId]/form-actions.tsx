"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  setFormStatusAction,
  deleteFormAction,
  duplicateFormAction,
} from "@/features/forms/actions";
import type { EffectiveStatus } from "@/features/forms/status";
import { accentStyle } from "@/features/forms/components/accents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  IconPencil,
  IconDuplicate,
  IconTrash,
  IconSend,
  IconDownload,
} from "@/components/icons";

export function FormActions({
  formId,
  status,
  hasResponses,
  accent = "evergreen",
}: {
  formId: string;
  status: EffectiveStatus;
  hasResponses: boolean;
  accent?: string;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const style = accentStyle(accent);
  const accentButton = cn(style.solid, style.solidHover);

  const setStatus = (next: "DRAFT" | "OPEN" | "CLOSED") => {
    startTransition(async () => {
      await setFormStatusAction(formId, next);
      router.refresh();
    });
  };

  const duplicate = () => {
    startTransition(async () => {
      const result = await duplicateFormAction(formId);
      if (result.ok) {
        router.push(`/dashboard/forms/${result.formId}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Buttons follow the EFFECTIVE status - a form closed by its deadline
          or response cap offers "Reopen" (which also clears the expired
          constraint server-side), not a useless "Close". */}
      {status === "draft" && (
        <Button
          variant="accent"
          onClick={() => setStatus("OPEN")}
          loading={pending}
          className={accentButton}
        >
          <IconSend size={15} />
          Open for responses
        </Button>
      )}
      {(status === "open" || status === "scheduled") && (
        <Button
          variant="secondary"
          onClick={() => setStatus("CLOSED")}
          loading={pending}
        >
          Close form
        </Button>
      )}
      {status === "closed" && (
        <Button
          variant="accent"
          onClick={() => setStatus("OPEN")}
          loading={pending}
          className={accentButton}
        >
          Reopen
        </Button>
      )}

      <Link href={`/dashboard/forms/${formId}/edit`}>
        <Button variant="secondary">
          <IconPencil size={15} />
          Edit
        </Button>
      </Link>

      {hasResponses && (
        <a href={`/api/forms/${formId}/export`} download>
          <Button variant="secondary">
            <IconDownload size={15} />
            CSV
          </Button>
        </a>
      )}

      <Button variant="ghost" onClick={duplicate} disabled={pending}>
        <IconDuplicate size={15} />
        Duplicate
      </Button>

      <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
        <IconTrash size={15} className="text-clay" />
      </Button>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="p-6">
          <h2 className="font-display text-xl font-medium text-ink">
            Delete this form?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {hasResponses
              ? "This permanently deletes the form and every response collected. There's no undo."
              : "This permanently deletes the form. There's no undo."}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() => startTransition(() => deleteFormAction(formId))}
            >
              Delete forever
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
