"use client";

import React, { useState } from "react";
import { Piece } from "../types";
import { PieceRenderer } from "./PieceRenderer";
import { getPieceSegments } from "../lib/rotation";
import { getPieceAnchor } from "../lib/anchor";

interface InventoryProps {
  pieces: Piece[];
  onPiecePickup: (piece: Piece) => void;
  onRotate: (
    pieceId: string,
    direction: "clockwise" | "counterclockwise",
  ) => void;
  onPieceReturnToInventory: (piece: Piece) => void;
  dragPointer: { clientX: number; clientY: number } | null;
  onInventoryHoverChange: (isHover: boolean) => void;
  onStartDragFromInventory: (
    piece: Piece,
    event: React.PointerEvent<HTMLDivElement>,
    dragPointerOffset: { x: number; y: number },
  ) => void;
}

function getPieceAnchorOffsetInPieceRendererSvg(piece: Piece): {
  x: number;
  y: number;
} {
  // Match PieceRenderer defaults (scale=1)
  const SEGMENT_LENGTH = 40;
  const PADDING = 10;

  const segments = getPieceSegments(piece);
  if (segments.length === 0) return { x: 0, y: 0 };

  // minX/minY match PieceRenderer's bbox logic (using raw segment coords)
  let minX = Infinity;
  let minY = Infinity;
  for (const seg of segments) {
    minX = Math.min(minX, seg.x);
    minY = Math.min(minY, seg.y);
  }

  // Anchor point in piece-local grid coords (centroid + per-digit tweak)
  const anchor = getPieceAnchor(piece);

  // Map local grid coords -> SVG pixel coords used by PieceRenderer
  return {
    x: PADDING + (anchor.x - minX) * SEGMENT_LENGTH,
    y: PADDING + (anchor.y - minY) * SEGMENT_LENGTH,
  };
}

/**
 * Inventory component - displays available pieces
 */
export function Inventory({
  pieces,
  onPiecePickup,
  onRotate,
  onPieceReturnToInventory,
  dragPointer,
  onInventoryHoverChange,
  onStartDragFromInventory,
}: InventoryProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track whether the current drag pointer is over the inventory area
  React.useEffect(() => {
    if (!dragPointer || !containerRef.current) {
      if (isDragOver) {
        setIsDragOver(false);
        onInventoryHoverChange(false);
      }
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const isHover =
      dragPointer.clientX >= rect.left &&
      dragPointer.clientX <= rect.right &&
      dragPointer.clientY >= rect.top &&
      dragPointer.clientY <= rect.bottom;

    if (isHover !== isDragOver) {
      setIsDragOver(isHover);
      onInventoryHoverChange(isHover);
    }
  }, [dragPointer, isDragOver, onInventoryHoverChange]);

  return (
    <div
      ref={containerRef}
      className={`inventory-container ${isDragOver ? "drag-over" : ""}`}
    >
      <h2 className="challenge-title" style={{ fontSize: "1.25rem" }}>
        Inventory ({pieces.length}/10)
      </h2>
      <div className="inventory-grid">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            className="inventory-item"
            onPointerDown={(e) => {
              onPiecePickup(piece);
              // Compute dragPointerOffset so cursor represents the piece centroid in the inventory SVG
              const pieceEl = e.currentTarget.querySelector(
                ".inventory-item-piece svg",
              ) as SVGElement | null;
              if (pieceEl && pieceEl instanceof SVGSVGElement) {
                const c = getPieceAnchorOffsetInPieceRendererSvg(piece);
                const ctm = pieceEl.getScreenCTM();
                if (ctm) {
                  const screenPoint = new DOMPoint(c.x, c.y).matrixTransform(
                    ctm,
                  );
                  onStartDragFromInventory(piece, e, {
                    x: e.clientX - screenPoint.x,
                    y: e.clientY - screenPoint.y,
                  });
                } else {
                  // Fallback: treat cursor as the centroid
                  onStartDragFromInventory(piece, e, { x: 0, y: 0 });
                }
              } else {
                // Fallback: treat cursor as the centroid
                onStartDragFromInventory(piece, e, { x: 0, y: 0 });
              }
            }}
          >
            <div className="inventory-item-number">{piece.number}</div>
            <div className="inventory-item-piece">
              <PieceRenderer piece={piece} />
            </div>
            <div className="rotate-controls">
              <button
                onClick={() => onRotate(piece.id, "counterclockwise")}
                className="rotate-btn"
                title="Rotate counterclockwise"
              >
                ↻
              </button>
              <button
                onClick={() => onRotate(piece.id, "clockwise")}
                className="rotate-btn"
                title="Rotate clockwise"
              >
                ↺
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
