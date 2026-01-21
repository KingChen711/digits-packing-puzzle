"use client";

import React from "react";
import { Piece } from "../types";
import { getPieceSegments } from "../lib/rotation";
import { PIECE_COLORS } from "../lib/segments";

interface PieceRendererProps {
  piece: Piece;
  scale?: number;
}

const SEGMENT_LENGTH = 40;
const SEGMENT_THICKNESS = 6;

/**
 * PieceRenderer - renders a piece's segments as SVG polygons with pointed ends
 */
export function PieceRenderer({ piece, scale = 1 }: PieceRendererProps) {
  const segments = getPieceSegments(piece);
  const color = PIECE_COLORS[piece.number];

  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  segments.forEach((seg) => {
    minX = Math.min(minX, seg.x);
    minY = Math.min(minY, seg.y);

    if (seg.orientation === "horizontal") {
      maxX = Math.max(maxX, seg.x + 1);
      maxY = Math.max(maxY, seg.y);
    } else {
      maxX = Math.max(maxX, seg.x);
      maxY = Math.max(maxY, seg.y + 1);
    }
  });

  const width = (maxX - minX) * SEGMENT_LENGTH * scale;
  const height = (maxY - minY) * SEGMENT_LENGTH * scale;
  const padding = 10 * scale;

  const svgWidth = width + 2 * padding;
  const svgHeight = height + 2 * padding;

  const thickness = SEGMENT_THICKNESS * scale;
  const halfThickness = thickness / 2;
  const backgroundThickness = (SEGMENT_THICKNESS + 4) * scale;
  const backgroundHalfThickness = backgroundThickness / 2;
  const innerThickness = SEGMENT_THICKNESS * scale * 0.7; // Inner polygon is 70% of segment thickness
  const innerHalfThickness = innerThickness / 2;
  const backgroundColor = "#0a0e1a"; // Very dark blue, much darker than empty segments

  // Gap at the ends of inner polygon to prevent touching
  const endGap = SEGMENT_LENGTH * scale * 0.15; // 15% gap at each end

  /**
   * Convert segment coordinates to pixel coordinates
   */
  const segToPixel = (x: number, y: number) => {
    return {
      x: padding + (x - minX) * SEGMENT_LENGTH * scale,
      y: padding + (y - minY) * SEGMENT_LENGTH * scale,
    };
  };

  return (
    <svg width={svgWidth} height={svgHeight} style={{ display: "block" }}>
      {/* Render background (dark) polygons first */}
      {segments.map((seg, idx) => {
        const start = segToPixel(seg.x, seg.y);
        let points: string;

        if (seg.orientation === "horizontal") {
          const end = segToPixel(seg.x + 1, seg.y);
          points = `
            ${start.x + backgroundHalfThickness},${start.y - backgroundHalfThickness}
            ${start.x},${start.y}
            ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
            ${end.x - backgroundHalfThickness},${end.y + backgroundHalfThickness}
            ${end.x},${end.y}
            ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
          `;
        } else {
          const end = segToPixel(seg.x, seg.y + 1);
          points = `
            ${start.x - backgroundHalfThickness},${start.y + backgroundHalfThickness}
            ${start.x},${start.y}
            ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
            ${end.x + backgroundHalfThickness},${end.y - backgroundHalfThickness}
            ${end.x},${end.y}
            ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
          `;
        }

        return (
          <polygon key={`bg-${idx}`} points={points} fill={backgroundColor} />
        );
      })}

      {/* Render inner colored polygons on top - shorter to prevent touching */}
      {segments.map((seg, idx) => {
        const start = segToPixel(seg.x, seg.y);
        let points: string;

        if (seg.orientation === "horizontal") {
          const end = segToPixel(seg.x + 1, seg.y);
          // Shorten the inner polygon at both ends
          const innerStart = { x: start.x + endGap, y: start.y };
          const innerEnd = { x: end.x - endGap, y: end.y };
          points = `
            ${innerStart.x + innerHalfThickness},${innerStart.y - innerHalfThickness}
            ${innerStart.x},${innerStart.y}
            ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
            ${innerEnd.x - innerHalfThickness},${innerEnd.y + innerHalfThickness}
            ${innerEnd.x},${innerEnd.y}
            ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
          `;
        } else {
          const end = segToPixel(seg.x, seg.y + 1);
          // Shorten the inner polygon at both ends
          const innerStart = { x: start.x, y: start.y + endGap };
          const innerEnd = { x: end.x, y: end.y - endGap };
          points = `
            ${innerStart.x - innerHalfThickness},${innerStart.y + innerHalfThickness}
            ${innerStart.x},${innerStart.y}
            ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
            ${innerEnd.x + innerHalfThickness},${innerEnd.y - innerHalfThickness}
            ${innerEnd.x},${innerEnd.y}
            ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
          `;
        }

        return <polygon key={idx} points={points} fill={color} />;
      })}
    </svg>
  );
}
