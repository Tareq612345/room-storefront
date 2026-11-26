/**
 * @file src/modules/element-organizer/components/ActionButtonView.tsx
 * @purpose Reusable styled CTA Button component rendered identically in /admin/elements/, /admin/home/, Reading Cards, and the live Storefront.
 */

"use client";

import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ButtonItem } from "../schema";

interface ActionButtonViewProps {
  button: ButtonItem;
  interactive?: boolean;
  onClick?: () => void;
}

const RADIUS_CLASS: Record<ButtonItem["borderRadius"], string> = {
  sharp: "rounded-md",
  rounded: "rounded-xl",
  pill: "rounded-full",
};

const SIZE_CLASS: Record<ButtonItem["size"], string> = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-6 py-2.5 text-xs",
  lg: "px-8 py-3.5 text-xs md:text-sm",
};

export function ActionButtonView({
  button,
  interactive = true,
  onClick,
}: ActionButtonViewProps) {
  const radiusCls = RADIUS_CLASS[button.borderRadius];
  const sizeCls = SIZE_CLASS[button.size];

  const variantStyle: React.CSSProperties =
    button.variant === "solid"
      ? { backgroundColor: button.bgColor, color: button.textColor }
      : button.variant === "outline"
        ? {
            backgroundColor: "transparent",
            borderColor: button.bgColor,
            color: button.textColor,
          }
        : button.variant === "glow"
          ? {
              backgroundColor: button.bgColor,
              color: button.textColor,
              boxShadow: `0 0 28px ${button.bgColor}66`,
            }
          : {
              backgroundColor: `${button.bgColor}24`,
              borderColor: `${button.bgColor}66`,
              color: button.textColor,
            };

  const baseClass = `inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.16em] transition-all duration-200 hover:opacity-90 border ${
    button.variant === "solid" || button.variant === "glow"
      ? "border-transparent"
      : ""
  } ${radiusCls} ${sizeCls}`;

  const iconEl =
    button.icon === "arrow" ? (
      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
    ) : button.icon === "sparkles" ? (
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
    ) : button.icon === "bag" ? (
      <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
    ) : null;

  if (!interactive || !button.href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
        style={variantStyle}
      >
        <span>{button.label}</span>
        {iconEl}
      </button>
    );
  }

  return (
    <Link href={button.href} className={baseClass} style={variantStyle}>
      <span>{button.label}</span>
      {iconEl}
    </Link>
  );
}
