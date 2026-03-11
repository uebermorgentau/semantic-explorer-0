"use client";
import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { FingerprintScores, FINGERPRINT_AXES } from "@/lib/types";

const CX = 100;
const CY = 100;
const R = 72;
const TOTAL = FINGERPRINT_AXES.length;

function toPoint(index: number, value: number, radius = R) {
  const angle = (index / TOTAL) * 2 * Math.PI - Math.PI / 2;
  const scaled = radius * (value / 100);
  return {
    x: CX + scaled * Math.cos(angle),
    y: CY + scaled * Math.sin(angle),
  };
}

function gridPoints(fraction: number): string {
  return FINGERPRINT_AXES.map((_, i) => {
    const p = toPoint(i, fraction * 100);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function scoresToPoints(scores: Record<string, number>): string {
  return FINGERPRINT_AXES.map(({ key }, i) => {
    const p = toPoint(i, scores[key] ?? 50);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function labelPosition(index: number) {
  const angle = (index / TOTAL) * 2 * Math.PI - Math.PI / 2;
  const r = R + 16;
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

interface AnimatedPolygonProps {
  scores: Record<string, number>;
  fill: string;
  stroke: string;
  strokeDasharray?: string;
  opacity?: number;
}

function AnimatedPolygon({ scores, fill, stroke, strokeDasharray, opacity = 1 }: AnimatedPolygonProps) {
  const pointStrings = FINGERPRINT_AXES.map(({ key }, i) => {
    const val = scores[key] ?? 50;
    const p = toPoint(i, val);
    return [p.x, p.y] as [number, number];
  });

  // Use a simple concatenated string for the points attribute
  // We'll update it via useEffect to avoid framer-motion complexity with SVG polygons
  const ref = useRef<SVGPolygonElement>(null);

  useEffect(() => {
    if (ref.current) {
      const pts = scoresToPoints(scores);
      ref.current.setAttribute("points", pts);
    }
  }, [scores]);

  const initialPts = scoresToPoints(scores);

  return (
    <polygon
      ref={ref}
      points={initialPts}
      fill={fill}
      stroke={stroke}
      strokeWidth="1"
      strokeDasharray={strokeDasharray}
      opacity={opacity}
      style={{ transition: "points 0.4s ease" }}
    />
  );
}

interface Props {
  actual: FingerprintScores | null;
  target: Record<string, number>;
  isStale?: boolean;
}

export default function RadarChart({ actual, target, isStale }: Props) {
  const gridFractions = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className={`transition-opacity duration-300 ${isStale ? "opacity-40" : "opacity-100"}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <filter id="glow-violet">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid rings */}
        {gridFractions.map((f) => (
          <polygon
            key={f}
            points={gridPoints(f)}
            fill="none"
            stroke="#1f1f1f"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {FINGERPRINT_AXES.map((_, i) => {
          const end = toPoint(i, 100);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="#1a1a1a"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Target polygon (amber dashed) */}
        <AnimatedPolygon
          scores={target}
          fill="rgba(201, 152, 74, 0.06)"
          stroke="#c9984a"
          strokeDasharray="2,3"
          opacity={0.7}
        />

        {/* Actual polygon (violet solid) */}
        {actual && (
          <AnimatedPolygon
            scores={actual}
            fill="rgba(124, 106, 245, 0.12)"
            stroke="#7c6af5"
            opacity={1}
          />
        )}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r="1.5" fill="#333" />

        {/* Axis labels */}
        {FINGERPRINT_AXES.map(({ label }, i) => {
          const pos = labelPosition(i);
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6"
              fontFamily="var(--font-geist-mono)"
              fill="#333"
              letterSpacing="0.5"
            >
              {label.toUpperCase()}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
