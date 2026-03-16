"use client";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sound wave / diamond motif inspired by Tidal */}
        <path
          d="M20 4L28 12L20 20L12 12L20 4Z"
          fill="currentColor"
          className="text-tidal-cyan"
        />
        <path
          d="M12 12L20 20L12 28L4 20L12 12Z"
          fill="currentColor"
          className="text-tidal-cyan"
          opacity="0.7"
        />
        <path
          d="M28 12L36 20L28 28L20 20L28 12Z"
          fill="currentColor"
          className="text-tidal-cyan"
          opacity="0.7"
        />
        <path
          d="M20 20L28 28L20 36L12 28L20 20Z"
          fill="currentColor"
          className="text-tidal-cyan"
          opacity="0.4"
        />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-white">
        tidal-cli
      </span>
    </div>
  );
}
