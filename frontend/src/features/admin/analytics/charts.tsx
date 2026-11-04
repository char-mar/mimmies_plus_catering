import { useId } from "react";

import { cn } from "@/lib/cn";

export interface ChartPoint {
  label: string;
  shortLabel: string;
  value: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 18, right: 14, bottom: 30, left: 14 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

function xAt(index: number, count: number): number {
  if (count <= 1) {
    return PADDING.left + INNER_WIDTH / 2;
  }

  return PADDING.left + (index / (count - 1)) * INNER_WIDTH;
}

function yAt(value: number, max: number): number {
  return PADDING.top + INNER_HEIGHT - (value / max) * INNER_HEIGHT;
}

function xLabelIndices(count: number): number[] {
  if (count <= 1) {
    return [0];
  }

  const candidates = [
    0,
    Math.round((count - 1) / 4),
    Math.round((count - 1) / 2),
    Math.round(((count - 1) * 3) / 4),
    count - 1,
  ];

  return [...new Set(candidates)];
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[13.75rem] items-center justify-center rounded-xl bg-stone-50 text-sm text-stone-400">
      {message}
    </div>
  );
}

export function AreaChart({
  points,
  formatValue,
  tone = "brand",
  emptyMessage = "No data for this period yet.",
}: {
  points: ChartPoint[];
  formatValue: (value: number) => string;
  tone?: "brand" | "emerald";
  emptyMessage?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const toneClass = tone === "brand" ? "text-brand-600" : "text-emerald-600";

  if (points.length === 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const line = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xAt(index, points.length).toFixed(1)},${yAt(point.value, max).toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L${xAt(points.length - 1, points.length).toFixed(1)},${(PADDING.top + INNER_HEIGHT).toFixed(1)} L${xAt(0, points.length).toFixed(1)},${(PADDING.top + INNER_HEIGHT).toFixed(1)} Z`;

  return (
    <div className={cn("w-full", toneClass)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Revenue trend chart"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + INNER_HEIGHT * ratio}
            y2={PADDING.top + INNER_HEIGHT * ratio}
            className="stroke-stone-200"
            strokeDasharray={ratio === 1 ? undefined : "3 5"}
            strokeWidth={1}
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <circle
            key={`${point.label}-${index}`}
            cx={xAt(index, points.length)}
            cy={yAt(point.value, max)}
            r={points.length > 20 ? 1.8 : 3}
            fill="currentColor"
          >
            <title>{`${point.label}: ${formatValue(point.value)}`}</title>
          </circle>
        ))}

        {xLabelIndices(points.length).map((index) => {
          const point = points[index];
          if (!point) {
            return null;
          }

          return (
            <text
              key={point.label}
              x={xAt(index, points.length)}
              y={HEIGHT - 8}
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-stone-400 text-[10px]"
            >
              {point.shortLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function BarChart({
  points,
  formatValue,
  emptyMessage = "No data for this period yet.",
}: {
  points: ChartPoint[];
  formatValue: (value: number) => string;
  emptyMessage?: string;
}) {
  if (points.length === 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const band = INNER_WIDTH / points.length;
  const barWidth = Math.max(band * 0.55, 2);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Orders per day chart"
      className="h-auto w-full text-brand-600"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + INNER_HEIGHT * ratio}
          y2={PADDING.top + INNER_HEIGHT * ratio}
          className="stroke-stone-200"
          strokeDasharray={ratio === 1 ? undefined : "3 5"}
          strokeWidth={1}
        />
      ))}

      {points.map((point, index) => {
        const height = (point.value / max) * INNER_HEIGHT;
        const x = PADDING.left + index * band + (band - barWidth) / 2;
        const y = PADDING.top + INNER_HEIGHT - height;

        return (
          <g key={`${point.label}-${index}`}>
            <rect
              x={x}
              y={height > 0 ? y : PADDING.top + INNER_HEIGHT - 1}
              width={barWidth}
              height={Math.max(height, 1)}
              rx={3}
              fill="currentColor"
              opacity={point.value === 0 ? 0.15 : 0.85}
            >
              <title>{`${point.label}: ${formatValue(point.value)}`}</title>
            </rect>
          </g>
        );
      })}

      {xLabelIndices(points.length).map((index) => {
        const point = points[index];
        if (!point) {
          return null;
        }

        return (
          <text
            key={point.label}
            x={xAt(index, points.length)}
            y={HEIGHT - 8}
            textAnchor={
              index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle"
            }
            className="fill-stone-400 text-[10px]"
          >
            {point.shortLabel}
          </text>
        );
      })}
    </svg>
  );
}

export interface BreakdownItem {
  label: string;
  value: number;
  meta?: string;
}

export function BreakdownList({
  items,
  formatValue = (value) => String(value),
  toneClass = "bg-brand-500",
  emptyMessage = "Nothing to show yet.",
}: {
  items: BreakdownItem[];
  formatValue?: (value: number) => string;
  toneClass?: string;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-stone-400">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-stone-700">
              {item.label}
            </span>
            <span className="shrink-0 tabular-nums text-stone-500">
              {formatValue(item.value)}
              {item.meta ? (
                <span className="ml-2 text-xs text-stone-400">{item.meta}</span>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn("h-full rounded-full transition-all", toneClass)}
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
