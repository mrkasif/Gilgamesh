"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-edge bg-surface",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/gilgamesh.png"
        alt=""
        fill
        sizes="40px"
        className="object-cover"
        draggable={false}
      />
    </div>
  );
}