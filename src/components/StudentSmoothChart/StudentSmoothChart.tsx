import { useId } from "react";

interface StudentSmoothChartProps {
  values: number[];
  labels: string[];
  color?: "blue" | "orange" | "red" | "purple";
  ariaLabel: string;
  height?: number;
}

const COLOR_MAP: Record<NonNullable<StudentSmoothChartProps["color"]>, string> = {
  blue: "#2e90fa",
  orange: "#f05a28",
  red: "#f04438",
  purple: "#7a5af8",
};

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) * 0.45;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) * 0.55;
    const cpY2 = next.y;
    d += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

export default function StudentSmoothChart({
  values,
  labels,
  color = "blue",
  ariaLabel,
  height = 156,
}: StudentSmoothChartProps) {
  const rawId = useId().replace(/:/g, "");
  const strokeColor = COLOR_MAP[color];

  const width = 560;
  const padLeft = 10;
  const padRight = 24;
  const topY = 20;
  const bottomY = 122;

  const plotWidth = width - padLeft - padRight;
  const count = Math.max(2, values.length);

  // Para o eixo X do painel (S1..S8), o último ponto no Figma termina em ~S7.5
  const effectiveSpan = labels.length === 8 ? plotWidth * 0.91 : plotWidth;

  const coords = values.map((v, idx) => {
    const clamped = Math.max(0, Math.min(100, v));
    const x = padLeft + (idx / (count - 1)) * effectiveSpan;
    const y = bottomY - (clamped / 100) * (bottomY - topY);
    return { x, y };
  });

  const linePath = buildSmoothPath(coords);
  const firstPt = coords[0];
  const lastPt = coords[coords.length - 1];
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${lastPt.x.toFixed(1)} ${bottomY} L ${firstPt.x.toFixed(1)} ${bottomY} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="student-smooth-chart"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={`grad-${rawId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {[22, 54, 86, 118].map((gridY) => (
        <line
          key={gridY}
          x1={padLeft}
          x2={width - 10}
          y1={gridY}
          y2={gridY}
          stroke="#e7eaf0"
          strokeDasharray="3 5"
          strokeWidth="1"
        />
      ))}

      {areaPath && <path d={areaPath} fill={`url(#grad-${rawId})`} />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {lastPt && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="4.5"
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="2.5"
        />
      )}

      {labels.map((label, idx) => {
        const labelX =
          labels.length === 1
            ? width / 2
            : padLeft + (idx / (labels.length - 1)) * (width - padLeft - 14);
        const anchor =
          idx === 0 ? "start" : idx === labels.length - 1 ? "end" : "middle";
        return (
          <text
            key={`${label}-${idx}`}
            x={labelX}
            y={height - 8}
            textAnchor={anchor}
            fill="#94a3b8"
            fontSize="11"
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
