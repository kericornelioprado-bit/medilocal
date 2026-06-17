"use client";

import { useEffect, useState } from "react";

const fases = [
  { label: "Analizando imagen…", icon: "👁" },
  { label: "Extrayendo datos…", icon: "📋" },
  { label: "Redactando explicación…", icon: "✍" },
];

export default function PhaseLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(1), 800);
    const t2 = setTimeout(() => setActive(2), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex flex-col items-center gap-3">
        {fases.map((fase, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i <= active
                ? "text-ink opacity-100"
                : "text-muted opacity-40"
            }`}
          >
            <span className="text-base">{fase.icon}</span>
            <span>{fase.label}</span>
            {i === active && (
              <span className="inline-flex gap-1">
                <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
