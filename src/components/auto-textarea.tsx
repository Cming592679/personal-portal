"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

interface AutoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
}

/** Textarea 随内容自动增高（到达 maxHeight 后内部滚动），用于长备注 / 活动记录。 */
export function AutoTextarea({ maxHeight = 200, className, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      onInput={resize}
      rows={1}
      className={`resize-none overflow-y-auto ${className ?? ""}`}
      {...props}
      style={{ maxHeight }}
    />
  );
}
