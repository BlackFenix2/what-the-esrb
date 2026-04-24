"use client";

interface EsrbBadgeProps {
  rating: string;
  label: string;
}

const RATING_COLORS: Record<string, string> = {
  RP: "bg-gray-500",
  EC: "bg-green-600",
  E: "bg-green-600",
  "E10+": "bg-blue-600",
  T: "bg-yellow-600",
  M: "bg-red-700",
  AO: "bg-red-900",
};

export default function EsrbBadge({ rating, label }: EsrbBadgeProps) {
  const colorClass = RATING_COLORS[rating] ?? "bg-gray-600";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${colorClass} text-white font-black text-4xl w-20 h-20 flex items-center justify-center rounded-md border-4 border-white shadow-lg`}
        aria-label={`ESRB Rating: ${label}`}
      >
        {rating}
      </div>
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
