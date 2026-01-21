"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useGame } from "../lib/gameState";
import { Board } from "./Board";
import { Inventory } from "./Inventory";
import { Piece, BoardPosition } from "../types";

interface DragRotationInputProps {
  draggedPieceId: string | null;
  onRotate: (direction: "clockwise" | "counterclockwise") => void;
}

function DragRotationInput({
  draggedPieceId,
  onRotate,
}: DragRotationInputProps) {
  React.useEffect(() => {
    if (!draggedPieceId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log("handleKeyDown");
      console.log(draggedPieceId);
      if (!draggedPieceId) return;

      const key = event.key.toLowerCase();
      if (key === "q") {
        event.preventDefault();
        console.log("counterclockwise");
        onRotate("counterclockwise");
      } else if (key === "e") {
        event.preventDefault();
        onRotate("clockwise");
      }
    };

    // During native HTML5 drag, some browsers stop sending events to window.
    // Listening on document (capture) + keeping focus on the app improves reliability.
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    console.log("Add event listeners");

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      console.log("Remove event listeners");
    };
  }, [draggedPieceId, onRotate]);

  return null;
}

// Import ChallengeViewer dynamically with SSR disabled to avoid DOMMatrix error
const ChallengeViewer = dynamic(
  () =>
    import("./ChallengeViewer").then((mod) => ({
      default: mod.ChallengeViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="challenge-viewer-skeleton">
        <div className="pagination-container">
          <label className="pagination-label">Level Range:</label>
          <div className="skeleton-controls">
            <div className="skeleton-button"></div>
            <div className="skeleton-select"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
        <div className="skeleton-pdf-area">
          <div className="skeleton-pulse"></div>
        </div>
      </div>
    ),
  },
);

/**
 * GameContainer - main game component that coordinates all sub-components
 */
export function GameContainer() {
  const { state, dispatch } = useGame();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Pointer-based drag state (to replace native HTML5 drag)
  const [dragPointer, setDragPointer] = React.useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [dragPointerOffset, setDragPointerOffset] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isPointerDragging, setIsPointerDragging] = React.useState(false);
  const [boardHoverPosition, setBoardHoverPosition] =
    React.useState<BoardPosition | null>(null);
  const [isInventoryHover, setIsInventoryHover] = React.useState(false);

  // Keep focus within the app while dragging so key events are delivered.
  React.useEffect(() => {
    if (!state.dragState?.piece) return;
    containerRef.current?.focus();
  }, [state.dragState?.piece]);

  // Global pointer move / up listeners while a custom drag is active
  React.useEffect(() => {
    if (!isPointerDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      setDragPointer({ clientX: event.clientX, clientY: event.clientY });
    };

    const handlePointerUp = () => {
      setIsPointerDragging(false);
      setDragPointer(null);
      setDragPointerOffset(null);

      const dragState = state.dragState;
      if (!dragState) return;

      const { piece } = dragState;

      if (boardHoverPosition) {
        // Drop on board at last valid hover position
        handlePieceDrop(piece, boardHoverPosition);
      } else if (isInventoryHover) {
        // Return to inventory
        handlePieceReturnToInventory(piece);
      } else {
        // Cancel drag
        handleDragCancel();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    isPointerDragging,
    state.dragState,
    boardHoverPosition,
    isInventoryHover,
  ]);

  const handlePiecePickupFromInventory = (piece: Piece) => {
    dispatch({
      type: "PICK_UP_PIECE",
      payload: { piece, source: "inventory" },
    });
  };

  const handlePiecePickupFromBoard = (
    piece: Piece,
    position: BoardPosition,
  ) => {
    dispatch({
      type: "PICK_UP_PIECE",
      payload: { piece, source: "board", position },
    });
  };

  const startPointerDragFromInventory = (
    piece: Piece,
    event: React.PointerEvent<HTMLDivElement>,
    pointerOffset: { x: number; y: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPointerDragging(true);
    setDragPointer({ clientX: event.clientX, clientY: event.clientY });

    setDragPointerOffset(pointerOffset);
  };

  const startPointerDragFromBoard = (
    piece: Piece,
    position: BoardPosition,
    event: React.PointerEvent<HTMLDivElement>,
    pointerOffset: { x: number; y: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    handlePiecePickupFromBoard(piece, position);
    setIsPointerDragging(true);
    setDragPointer({ clientX: event.clientX, clientY: event.clientY });

    setDragPointerOffset(pointerOffset);
  };

  const handlePieceDrop = (piece: Piece, position: BoardPosition) => {
    dispatch({
      type: "DROP_PIECE",
      payload: { position },
    });
  };

  const handleDragCancel = () => {
    dispatch({ type: "CANCEL_DRAG" });
  };

  const handlePieceReturnToInventory = (piece: Piece) => {
    dispatch({ type: "RETURN_TO_INVENTORY", payload: { piece } });
  };

  const handleRotate = (
    pieceId: string,
    direction: "clockwise" | "counterclockwise",
  ) => {
    dispatch({
      type: "ROTATE_PIECE",
      payload: { pieceId, direction },
    });
  };

  // Stable rotate handler for DragRotationInput (prevents re-adding listeners on every render)
  const rotateCurrentlyDraggedPiece = React.useCallback(
    (direction: "clockwise" | "counterclockwise") => {
      const currentId = state.dragState?.piece.id;
      if (!currentId) return;
      handleRotate(currentId, direction);
    },
    [state.dragState?.piece.id],
  );

  const handleReset = () => {
    if (confirm("Reset the board? This will clear all placed pieces.")) {
      dispatch({ type: "RESET_BOARD" });
    }
  };

  const handleOpenRules = () => {
    const pdfPath =
      "C:\\Users\\Kingc\\OneDrive\\Desktop\\BREAK_OUT\\digits\\public\\rules.pdf";
    // For web, open in new tab
    window.open("/rules.pdf", "_blank");
  };

  const handleOpenSolutions = () => {
    const pdfPath =
      "C:\\Users\\Kingc\\OneDrive\\Desktop\\BREAK_OUT\\digits\\public\\solutions.pdf";
    // For web, open in new tab
    window.open("/solutions.pdf", "_blank");
  };

  return (
    <div className="game-container" ref={containerRef} tabIndex={-1}>
      <DragRotationInput
        draggedPieceId={state.dragState?.piece.id ?? null}
        onRotate={rotateCurrentlyDraggedPiece}
      />

      {/* Left: Challenge area */}
      <div className="sidebar glass-panel">
        <ChallengeViewer />
        {/* Control hints (placed here to use left-side space) */}
        <div
          className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed"
          style={{ padding: "0 14px" }}
        >
          <div className="font-semibold text-[var(--text)] mb-1">Controls</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Drag pieces bằng chuột từ Inventory lên board.</li>
            <li>
              Trong khi đang kéo, nhấn <strong>Q</strong> / <strong>E</strong>{" "}
              để xoay trái / phải.
            </li>
            <li>Thả lại vào vùng Inventory để trả piece về.</li>
          </ul>
        </div>
      </div>

      {/* Center: Board */}
      <div className="board-area">
        <Board
          placedPieces={state.board.placedPieces}
          occupiedSegments={state.board.occupiedSegments}
          onPiecePickup={handlePiecePickupFromBoard}
          draggedPiece={state.dragState?.piece || null}
          dragPointer={dragPointer}
          dragPointerOffset={dragPointerOffset}
          onBoardHoverChange={setBoardHoverPosition}
          onStartDragFromBoard={startPointerDragFromBoard}
        />
      </div>

      {/* Right: Inventory and Controls */}
      <div className="sidebar sidebar-full">
        <Inventory
          pieces={state.inventory}
          onPiecePickup={handlePiecePickupFromInventory}
          onRotate={handleRotate}
          onPieceReturnToInventory={handlePieceReturnToInventory}
          dragPointer={dragPointer}
          onInventoryHoverChange={setIsInventoryHover}
          onStartDragFromInventory={startPointerDragFromInventory}
        />

        {/* Controls */}
        <div className="flex-col">
          <div className="controls-row">
            <button
              onClick={handleOpenRules}
              className="action-button action-button-primary"
            >
              📖 Rules
            </button>
            <button
              onClick={handleOpenSolutions}
              className="action-button action-button-secondary"
            >
              ✓ Solutions
            </button>
          </div>
          <button onClick={handleReset} className="reset-button">
            Reset Board
          </button>
        </div>
      </div>
    </div>
  );
}
