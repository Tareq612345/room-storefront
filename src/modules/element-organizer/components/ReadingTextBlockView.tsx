/**
 * @file src/modules/element-organizer/components/ReadingTextBlockView.tsx
 * @purpose Renders a Frosted Dark Reading Text Card matching the Universe Card inner box theme, hugging only the filled content area with 3 block typography line scales and optional positioned button.
 */

"use client";

import type { ButtonItem, ReadingTextLine, TextBlockItem } from "../schema";
import { ActionButtonView } from "./ActionButtonView";

interface ReadingTextBlockViewProps {
  block: TextBlockItem;
  buttons: ButtonItem[];
  interactive?: boolean;
  fullContainerWidth?: boolean;
  onClick?: () => void;
}

const RADIUS_CLASS: Record<TextBlockItem["borderRadius"], string> = {
  sharp: "rounded-md",
  rounded: "rounded-xl",
  pill: "rounded-3xl",
};

const TEXT_ALIGN_CLASS: Record<TextBlockItem["align"], string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function renderLine(line: ReadingTextLine) {
  if (!line.text.trim()) return null;

  if (line.size === "eyebrow") {
    return (
      <p
        key={line.id}
        dir="auto"
        className="text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: line.color || "#c94b99" }}
      >
        {line.text}
      </p>
    );
  }

  if (line.size === "title") {
    return (
      <h3
        key={line.id}
        dir="auto"
        className="font-serif text-2xl font-semibold tracking-wide md:text-3xl"
        style={{ color: line.color || "#ffffff" }}
      >
        {line.text}
      </h3>
    );
  }

  return (
    <p
      key={line.id}
      dir="auto"
      className="text-sm leading-relaxed"
      style={{ color: line.color || "var(--color-text-secondary)" }}
    >
      {line.text}
    </p>
  );
}

export function ReadingTextBlockView({
  block,
  buttons,
  interactive = true,
  fullContainerWidth = false,
  onClick,
}: ReadingTextBlockViewProps) {
  const attachedButton =
    block.buttonPlacement !== "none" && block.attachedButtonId
      ? buttons.find((b) => b.id === block.attachedButtonId) ?? null
      : null;

  const padCls = block.paddingMode === "compact" ? "px-4 py-3" : "px-5 py-4";
  const radiusCls = RADIUS_CLASS[block.borderRadius];
  const alignCls = TEXT_ALIGN_CLASS[block.align];

  const cardSurfaceStyle: React.CSSProperties = {
    backgroundColor: block.bgColor || "var(--color-surface-badge)",
    boxShadow: "var(--shadow-card)",
  };

  const buttonAlignRowClass =
    block.buttonPlacement === "bottom-start"
      ? "justify-start"
      : block.buttonPlacement === "bottom-end"
        ? "justify-end"
        : "justify-center";

  const isInlineEnd = block.buttonPlacement === "inline-end" && attachedButton !== null;
  const isTopEnd = block.buttonPlacement === "top-end" && attachedButton !== null;
  const isBottom =
    (block.buttonPlacement === "bottom-start" ||
      block.buttonPlacement === "bottom-center" ||
      block.buttonPlacement === "bottom-end") &&
    attachedButton !== null;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${fullContainerWidth ? "w-full" : "inline-block w-fit max-w-full"} border border-white/15 backdrop-blur-md transition-all duration-300 ${radiusCls} ${padCls} ${alignCls} ${
        onClick ? "cursor-pointer hover:border-white/35" : ""
      } ${!block.isActive ? "opacity-60" : ""}`}
      style={cardSurfaceStyle}
    >
      {isTopEnd ? (
        <div className="mb-3 flex justify-end">
          <ActionButtonView button={attachedButton} interactive={interactive} />
        </div>
      ) : null}

      <div
        className={
          isInlineEnd
            ? "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            : "space-y-1.5"
        }
      >
        <div className="space-y-1.5">
          {block.lines.map((line) => renderLine(line))}
        </div>

        {isInlineEnd ? (
          <div className="shrink-0">
            <ActionButtonView button={attachedButton} interactive={interactive} />
          </div>
        ) : null}
      </div>

      {isBottom ? (
        <div className={`mt-4 flex flex-wrap ${buttonAlignRowClass}`}>
          <ActionButtonView button={attachedButton} interactive={interactive} />
        </div>
      ) : null}
    </div>
  );
}
