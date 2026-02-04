"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScentGenome } from "@/lib/types";

interface RadarChartProps {
  genome: ScentGenome;
  size?: number;
}

export default function RadarChart({ genome, size = 300 }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = size / 2 - 40;

  const categories = Object.entries(genome).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const angleStep = (2 * Math.PI) / categories.length;

  // Generate polygon points for a given radius multiplier
  const getPolygonPoints = (radiusFn: (i: number) => number) => {
    return categories
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radiusFn(i);
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(" ");
  };

  // Grid levels
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const dataPoints = getPolygonPoints(
    (i) => (categories[i].value / 100) * maxRadius
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid levels */}
      {levels.map((level) => (
        <polygon
          key={level}
          points={getPolygonPoints(() => level * maxRadius)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {categories.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + maxRadius * Math.cos(angle);
        const y = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon fill */}
      <motion.polygon
        points={dataPoints}
        fill="rgba(212, 165, 116, 0.15)"
        stroke="#D4A574"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />

      {/* Data points */}
      {categories.map((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (cat.value / 100) * maxRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);

        return (
          <motion.circle
            key={`point-${i}`}
            cx={x}
            cy={y}
            r={3}
            fill="#D4A574"
            stroke="#0A0A0F"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
          />
        );
      })}

      {/* Labels */}
      {categories.map((cat, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 22;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);

        return (
          <motion.g
            key={`label-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.03 }}
          >
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9CA3AF"
              fontSize={10}
              fontWeight={500}
            >
              {cat.label}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6B7280"
              fontSize={8}
              fontFamily="monospace"
            >
              {cat.value}%
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
