"use client";

import * as React from "react";

export function NoteWidget({
  content,
  setContent,
  textColor,
}: {
  content: Record<string, unknown>;
  setContent: (c: Record<string, unknown>) => void;
  textColor: string;
}) {
  const text = typeof content.text === "string" ? content.text : "";
  const [local, setLocal] = React.useState(text);
  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => setLocal(text), [text]);

  function onChange(v: string) {
    setLocal(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setContent({ text: v });
    }, 400);
  }

  return (
    <textarea
      data-no-drag
      value={local}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Brain dump…"
      style={{ color: textColor }}
      className="min-h-32 w-full resize-none bg-transparent text-sm focus:outline-none placeholder:opacity-50"
    />
  );
}
