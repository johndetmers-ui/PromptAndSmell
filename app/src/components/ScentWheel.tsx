"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { Ingredient } from "@/lib/types";
import { getCategoryColor } from "@/lib/utils";

interface ScentWheelProps {
  ingredients: Ingredient[];
  name?: string;
  size?: number;
  showLabels?: boolean;
}

interface ArcData {
  ingredient: Ingredient;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  path: string;
  color: string;
}

export default function ScentWheel({
  ingredients,
  name,
  size = 300,
  showLabels = true,
}: ScentWheelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    ingredient: Ingredient;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius * 0.55;

  const sortedIngredients = [...ingredients].sort(
    (a, b) => b.percentage - a.percentage
  );

  const pie = d3
    .pie<Ingredient>()
    .value((d) => d.percentage)
    .sort(null)
    .padAngle(0.02);

  const arcGenerator = d3
    .arc<d3.PieArcDatum<Ingredient>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(3);

  const hoverArcGenerator = d3
    .arc<d3.PieArcDatum<Ingredient>>()
    .innerRadius(innerRadius - 3)
    .outerRadius(outerRadius + 8)
    .cornerRadius(3);

  const pieData = pie(sortedIngredients);

  const arcs: ArcData[] = pieData.map((d, i) => ({
    ingredient: d.data,
    startAngle: d.startAngle,
    endAngle: d.endAngle,
    innerRadius,
    outerRadius,
    path: arcGenerator(d) || "",
    color: getCategoryColor(d.data.category),
  }));

  const handleMouseEnter = (
    index: number,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    setHoveredIndex(index);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        ingredient: sortedIngredients[index],
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && hoveredIndex !== null) {
      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        ingredient: sortedIngredients[hoveredIndex],
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  return (
    <div className="relative inline-block">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <g transform={`translate(${center}, ${center})`}>
          {arcs.map((arc, i) => {
            const isHovered = hoveredIndex === i;
            const hoveredPath = hoverArcGenerator(pieData[i]) || "";
            return (
              <motion.path
                key={`arc-${i}`}
                d={isHovered ? hoveredPath : arc.path}
                fill={arc.color}
                opacity={
                  hoveredIndex === null ? 0.85 : isHovered ? 1 : 0.4
                }
                stroke="rgba(10, 10, 15, 0.8)"
                strokeWidth={1}
                onMouseEnter={(e) => handleMouseEnter(i, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: hoveredIndex === null ? 0.85 : isHovered ? 1 : 0.4 }}
                transition={{
                  scale: { delay: i * 0.05, duration: 0.5, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                }}
                style={{ cursor: "pointer", transformOrigin: "center" }}
              />
            );
          })}

          {showLabels &&
            arcs.map((arc, i) => {
              const angle = (pieData[i].startAngle + pieData[i].endAngle) / 2;
              const labelRadius = outerRadius + 18;
              const x = Math.sin(angle) * labelRadius;
              const y = -Math.cos(angle) * labelRadius;
              const percentage = arc.ingredient.percentage;

              if (percentage < 5) return null;

              return (
                <motion.text
                  key={`label-${i}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9CA3AF"
                  fontSize={9}
                  fontWeight={500}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                >
                  {arc.ingredient.name}
                </motion.text>
              );
            })}

          {name && (
            <motion.text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#D4A574"
              fontSize={13}
              fontWeight={600}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {name.length > 16 ? name.substring(0, 14) + "..." : name}
            </motion.text>
          )}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none glass rounded-lg px-3 py-2 text-xs"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
          }}
        >
          <div className="font-semibold text-white">
            {tooltip.ingredient.name}
          </div>
          <div className="text-gray-400 capitalize">
            {tooltip.ingredient.category} / {tooltip.ingredient.note_type} note
          </div>
          <div className="text-primary-400 font-mono">
            {tooltip.ingredient.percentage.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

// Mini version for gallery cards
export function MiniScentWheel({
  ingredients,
  size = 60,
}: {
  ingredients: Ingredient[];
  size?: number;
}) {
  const center = size / 2;
  const outerRadius = size / 2 - 4;
  const innerRadius = outerRadius * 0.5;

  const pie = d3
    .pie<Ingredient>()
    .value((d) => d.percentage)
    .sort(null)
    .padAngle(0.03);

  const arcGenerator = d3
    .arc<d3.PieArcDatum<Ingredient>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(2);

  const pieData = pie(ingredients);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${center}, ${center})`}>
        {pieData.map((d, i) => (
          <path
            key={i}
            d={arcGenerator(d) || ""}
            fill={getCategoryColor(d.data.category)}
            opacity={0.8}
            stroke="rgba(10, 10, 15, 0.5)"
            strokeWidth={0.5}
          />
        ))}
      </g>
    </svg>
  );
}
