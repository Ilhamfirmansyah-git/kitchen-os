import type { CSSProperties, ElementType, ReactNode } from "react";

interface FocusGroupProps {
  id: string;
  children: ReactNode;
  /** Entering the group returns to the item that was focused last. */
  restore?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  label?: string;
}

/**
 * Groups related focus targets (a row of cards, a toolbar, the sidebar).
 * With `restore`, coming back into the group lands on the last item used,
 * like native Android TV rows.
 */
export function FocusGroup({ id, children, restore = false, className, style, as: Tag = "div", label }: FocusGroupProps) {
  return (
    <Tag
      data-focus-group={id}
      data-focus-restore={restore ? "true" : undefined}
      className={className}
      style={style}
      aria-label={label}
      role={label ? "group" : undefined}
    >
      {children}
    </Tag>
  );
}
