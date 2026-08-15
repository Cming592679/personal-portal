"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// 自动增高、超出 maxHeight 后内部滚动的 textarea。
export function AutoTextarea({
  maxHeight = 200,
  className,
  onChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxHeight?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resize, [props.value, props.defaultValue]);

  return (
    <textarea
      ref={ref}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      className={cn("w-full resize-none overflow-y-auto", className)}
      style={{ maxHeight }}
      {...props}
    />
  );
}
