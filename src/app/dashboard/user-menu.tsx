"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { logoutAction } from "@/features/auth/actions";
import { IconLogout, IconPencil } from "@/components/icons";

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string | null;
  email: string;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initial = (name?.[0] ?? email[0]).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-ink/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-ever-tint text-sm font-semibold text-ever-deep">
            {initial}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-raised shadow-modal"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium text-ink">
                {name ?? "Unnamed"}
              </p>
              <p className="truncate text-[13px] text-muted">{email}</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <IconPencil size={16} />
                Settings
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-clay-tint hover:text-clay"
                >
                  <IconLogout size={16} />
                  Log out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
