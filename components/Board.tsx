"use client";

import React, { useState, useRef, useEffect } from "react";
import { Piece, BoardPosition, Segment } from "../types";
import {
  getAllBoardSegments,
  segmentToId,
  PIECE_COLORS,
} from "../lib/segments";
import { getPieceSegments } from "../lib/rotation";
import { getPieceAnchor } from "../lib/anchor";

interface BoardProps {
  placedPieces: Array<{ piece: Piece; position: BoardPosition }>;
  occupiedSegments: Set<string>;
  onPiecePickup: (piece: Piece, position: BoardPosition) => void;
  draggedPiece: Piece | null;
  dragPointer: { clientX: number; clientY: number } | null;
  dragPointerOffset: { x: number; y: number } | null;
  onBoardHoverChange: (position: BoardPosition | null) => void;
  onStartDragFromBoard: (
    piece: Piece,
    position: BoardPosition,
    event: React.PointerEvent<HTMLDivElement>,
    dragPointerOffset: { x: number; y: number },
  ) => void;
}

const BASE_SEGMENT_LENGTH = 60;
const SEGMENT_THICKNESS = 8;
const GRID_PADDING = 10;

export function Board({
  placedPieces,
  occupiedSegments,
  onPiecePickup,
  draggedPiece,
  dragPointer,
  dragPointerOffset,
  onBoardHoverChange,
  onStartDragFromBoard,
}: BoardProps) {
  const [dragOverPosition, setDragOverPosition] =
    useState<BoardPosition | null>(null);
  const [scale, setScale] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale based on container size
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Base board dimensions
      const baseWidth = 5 * BASE_SEGMENT_LENGTH + 2 * GRID_PADDING;
      const baseHeight = 4 * BASE_SEGMENT_LENGTH + 2 * GRID_PADDING;

      const maxWidth = 698 - 16;

      // Calculate scale to fit container (with some margin)
      const scaleX = Math.min(
        (containerWidth - 40) / baseWidth,
        maxWidth / baseWidth,
      );
      const scaleY = (containerHeight - 40) / baseHeight;
      const newScale = Math.min(scaleX, scaleY, 2.0); // Increased max scale to 2.0x

      setScale(newScale);
      setIsLoading(false);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const SEGMENT_LENGTH = BASE_SEGMENT_LENGTH * scale;

  const boardSegments = getAllBoardSegments();
  const svgWidth = 5 * SEGMENT_LENGTH + 2 * GRID_PADDING * scale;
  const svgHeight = 4 * SEGMENT_LENGTH + 2 * GRID_PADDING * scale;

  const gridToPixel = (x: number, y: number) => {
    return {
      x: GRID_PADDING * scale + x * SEGMENT_LENGTH,
      y: GRID_PADDING * scale + y * SEGMENT_LENGTH,
    };
  };

  const pixelToGrid = (
    pixelX: number,
    pixelY: number,
    piece?: Piece,
  ): BoardPosition => {
    let gridX = Math.round((pixelX - GRID_PADDING * scale) / SEGMENT_LENGTH);
    let gridY = Math.round((pixelY - GRID_PADDING * scale) / SEGMENT_LENGTH);

    // Adjust so the cursor represents the *visual center* of the piece.
    if (piece) {
      const center = getPieceAnchor(piece);
      gridX = gridX - center.x;
      gridY = gridY - center.y;
    }

    return { x: Math.round(gridX), y: Math.round(gridY) };
  };

  // Update drag-over position based on global drag pointer
  useEffect(() => {
    if (!dragPointer || !draggedPiece || !containerRef.current) {
      if (dragOverPosition !== null) {
        setDragOverPosition(null);
        onBoardHoverChange(null);
      }
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const adjustedClientX = dragPointer.clientX - (dragPointerOffset?.x ?? 0);
    const adjustedClientY = dragPointer.clientY - (dragPointerOffset?.y ?? 0);

    const pixelX = adjustedClientX - rect.left;
    const pixelY = adjustedClientY - rect.top;

    if (
      pixelX < 0 ||
      pixelY < 0 ||
      pixelX > rect.width ||
      pixelY > rect.height
    ) {
      if (dragOverPosition !== null) {
        setDragOverPosition(null);
        onBoardHoverChange(null);
      }
      return;
    }

    const gridPos = pixelToGrid(pixelX, pixelY, draggedPiece);
    if (
      !dragOverPosition ||
      dragOverPosition.x !== gridPos.x ||
      dragOverPosition.y !== gridPos.y
    ) {
      setDragOverPosition(gridPos);
      onBoardHoverChange(gridPos);
    }
  }, [
    dragPointer,
    dragPointerOffset,
    draggedPiece,
    dragOverPosition,
    onBoardHoverChange,
  ]);

  const renderSegment = (segment: Segment, isOccupied: boolean) => {
    const id = segmentToId(segment);
    const start = gridToPixel(segment.x, segment.y);
    const thickness = SEGMENT_THICKNESS * scale;
    const halfThickness = thickness / 2;

    let points: string;

    if (segment.orientation === "horizontal") {
      const end = gridToPixel(segment.x + 1, segment.y);
      // Horizontal segment with pointed ends
      points = `
        ${start.x + halfThickness},${start.y - halfThickness}
        ${start.x},${start.y}
        ${start.x + halfThickness},${start.y + halfThickness}
        ${end.x - halfThickness},${end.y + halfThickness}
        ${end.x},${end.y}
        ${end.x - halfThickness},${end.y - halfThickness}
      `;
    } else {
      const end = gridToPixel(segment.x, segment.y + 1);
      // Vertical segment with pointed ends
      points = `
        ${start.x - halfThickness},${start.y + halfThickness}
        ${start.x},${start.y}
        ${start.x + halfThickness},${start.y + halfThickness}
        ${end.x + halfThickness},${end.y - halfThickness}
        ${end.x},${end.y}
        ${end.x - halfThickness},${end.y - halfThickness}
      `;
    }

    return (
      <polygon
        key={id}
        points={points}
        fill={isOccupied ? "var(--text-muted)" : "rgba(255, 255, 255, 0.05)"}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
      />
    );
  };

  const renderPieceSegments = (
    piece: Piece,
    position: BoardPosition,
    color: string,
    opacity: number = 1,
  ) => {
    const segments = getPieceSegments(piece);
    const backgroundThickness = (SEGMENT_THICKNESS + 4) * scale;
    const backgroundHalfThickness = backgroundThickness / 2;
    const innerThickness = SEGMENT_THICKNESS * scale * 0.7; // Inner polygon is 70% of segment thickness
    const innerHalfThickness = innerThickness / 2;
    const backgroundColor = "#0a0e1a"; // Very dark blue, much darker than empty segments
    const shadowFilter =
      opacity === 1 ? "drop-shadow(0 0 4px rgba(255,255,255,0.2))" : "none";

    // Gap at the ends of inner polygon to prevent touching
    const endGap = SEGMENT_LENGTH * 0.15; // 15% gap at each end

    return segments.flatMap((seg, idx) => {
      const absoluteSeg = {
        x: position.x + seg.x,
        y: position.y + seg.y,
        orientation: seg.orientation,
      };

      const start = gridToPixel(absoluteSeg.x, absoluteSeg.y);
      let backgroundPoints: string;
      let innerPoints: string;

      if (absoluteSeg.orientation === "horizontal") {
        const end = gridToPixel(absoluteSeg.x + 1, absoluteSeg.y);

        // Background (larger, dark polygon) - full length
        backgroundPoints = `
          ${start.x + backgroundHalfThickness},${start.y - backgroundHalfThickness}
          ${start.x},${start.y}
          ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
          ${end.x - backgroundHalfThickness},${end.y + backgroundHalfThickness}
          ${end.x},${end.y}
          ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
        `;

        // Inner colored polygon (smaller and shorter) - with gaps at ends
        const innerStart = { x: start.x + endGap, y: start.y };
        const innerEnd = { x: end.x - endGap, y: end.y };
        innerPoints = `
          ${innerStart.x + innerHalfThickness},${innerStart.y - innerHalfThickness}
          ${innerStart.x},${innerStart.y}
          ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
          ${innerEnd.x - innerHalfThickness},${innerEnd.y + innerHalfThickness}
          ${innerEnd.x},${innerEnd.y}
          ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
        `;
      } else {
        const end = gridToPixel(absoluteSeg.x, absoluteSeg.y + 1);

        // Background (larger, dark polygon) - full length
        backgroundPoints = `
          ${start.x - backgroundHalfThickness},${start.y + backgroundHalfThickness}
          ${start.x},${start.y}
          ${start.x + backgroundHalfThickness},${start.y + backgroundHalfThickness}
          ${end.x + backgroundHalfThickness},${end.y - backgroundHalfThickness}
          ${end.x},${end.y}
          ${end.x - backgroundHalfThickness},${end.y - backgroundHalfThickness}
        `;

        // Inner colored polygon (smaller and shorter) - with gaps at ends
        const innerStart = { x: start.x, y: start.y + endGap };
        const innerEnd = { x: end.x, y: end.y - endGap };
        innerPoints = `
          ${innerStart.x - innerHalfThickness},${innerStart.y + innerHalfThickness}
          ${innerStart.x},${innerStart.y}
          ${innerStart.x + innerHalfThickness},${innerStart.y + innerHalfThickness}
          ${innerEnd.x + innerHalfThickness},${innerEnd.y - innerHalfThickness}
          ${innerEnd.x},${innerEnd.y}
          ${innerEnd.x - innerHalfThickness},${innerEnd.y - innerHalfThickness}
        `;
      }

      return [
        // Background polygon (dark)
        <polygon
          key={`${piece.id}-bg-${idx}`}
          points={backgroundPoints}
          fill={backgroundColor}
          opacity={opacity}
          style={{ transition: "all 0.2s ease" }}
        />,
        // Inner polygon (colored)
        <polygon
          key={`${piece.id}-seg-${idx}`}
          points={innerPoints}
          fill={color}
          opacity={opacity}
          style={{ filter: shadowFilter, transition: "all 0.2s ease" }}
        />,
      ];
    });
  };

  const wouldBeValidPlacement = (
    piece: Piece,
    position: BoardPosition,
  ): boolean => {
    const segments = getPieceSegments(piece);

    for (const seg of segments) {
      const absoluteSeg = {
        x: position.x + seg.x,
        y: position.y + seg.y,
        orientation: seg.orientation,
      };

      if (absoluteSeg.orientation === "horizontal") {
        if (
          absoluteSeg.x < 0 ||
          absoluteSeg.x >= 5 ||
          absoluteSeg.y < 0 ||
          absoluteSeg.y > 4
        ) {
          return false;
        }
      } else {
        if (
          absoluteSeg.x < 0 ||
          absoluteSeg.x > 5 ||
          absoluteSeg.y < 0 ||
          absoluteSeg.y >= 4
        ) {
          return false;
        }
      }

      const id = segmentToId(absoluteSeg);
      if (occupiedSegments.has(id)) {
        return false;
      }
    }

    return true;
  };

  return (
    <div ref={containerRef} className="board-root">
      {isLoading ? (
        <div className="board-skeleton">
          <div className="board-skeleton-inner"></div>
        </div>
      ) : (
        <div className="board-svg-wrapper">
          <div
            style={{
              position: "relative",
              width: svgWidth,
              height: svgHeight,
            }}
          >
            <svg
              width={svgWidth}
              height={svgHeight}
              className="board-svg"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {boardSegments.map((seg) => {
                const id = segmentToId(seg);
                const isOccupied = occupiedSegments.has(id);
                return renderSegment(seg, isOccupied);
              })}

              {placedPieces.map(({ piece, position }) => {
                const isDragging = draggedPiece?.id === piece.id;
                const color = PIECE_COLORS[piece.number];

                return (
                  <g key={piece.id}>
                    {renderPieceSegments(
                      piece,
                      position,
                      color,
                      isDragging ? 0.3 : 1,
                    )}
                  </g>
                );
              })}

              {/* Show placement preview on board for visual feedback */}
              {draggedPiece && dragOverPosition && (
                <g>
                  {renderPieceSegments(
                    draggedPiece,
                    dragOverPosition,
                    wouldBeValidPlacement(draggedPiece, dragOverPosition)
                      ? "var(--success)"
                      : "var(--error)",
                    0.4,
                  )}
                </g>
              )}
            </svg>

            {placedPieces.map(({ piece, position }) => {
              const pixelPos = gridToPixel(position.x, position.y);
              // Calculate hitbox logic...
              const segments = getPieceSegments(piece);
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

              // Add small padding to make hitbox slightly larger for easier grabbing
              const padding = 0.15; // 15% of a segment on each side
              const width = (maxX - minX + padding * 2) * SEGMENT_LENGTH;
              const height = (maxY - minY + padding * 2) * SEGMENT_LENGTH;
              const offsetX = (minX - padding) * SEGMENT_LENGTH;
              const offsetY = (minY - padding) * SEGMENT_LENGTH;

              // Give piece "1" higher z-index priority when hitboxes overlap
              const zIndex = piece.number === 1 ? 20 : 10;

              return (
                <div
                  key={`drag-${piece.id}`}
                  style={{
                    position: "absolute",
                    left: pixelPos.x + offsetX,
                    top: pixelPos.y + offsetY,
                    width: width,
                    height: height,
                    cursor: "grab",
                    background: "transparent",
                    zIndex: zIndex,
                    pointerEvents: "auto",
                  }}
                  onPointerDown={(e) => {
                    onPiecePickup(piece, position);
                    // Compute dragPointerOffset so the cursor represents the piece's visual centroid.
                    // Use board coordinate mapping (position + centroid -> gridToPixel) to avoid
                    // hitbox/padding mismatches.
                    const boardRect =
                      containerRef.current?.getBoundingClientRect();
                    if (!boardRect) {
                      onStartDragFromBoard(piece, position, e, { x: 0, y: 0 });
                      return;
                    }

                    const center = getPieceAnchor(piece); // piece-local grid coords
                    const absX = position.x + center.x;
                    const absY = position.y + center.y;
                    const centroidPixel = gridToPixel(absX, absY);
                    const centroidClientX = boardRect.left + centroidPixel.x;
                    const centroidClientY = boardRect.top + centroidPixel.y;
                    const offset = {
                      x: e.clientX - centroidClientX,
                      y: e.clientY - centroidClientY,
                    };

                    onStartDragFromBoard(piece, position, e, offset);
                  }}
                  title={`Piece ${piece.number}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
