"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  GameState,
  Piece,
  BoardPosition,
  PieceNumber,
  PlacedPiece,
} from "../types";
import { SEGMENT_PATTERNS, segmentToId } from "./segments";
import { rotatePiece, getPieceSegments } from "./rotation";

/**
 * Game actions
 */
type GameAction =
  | {
      type: "PICK_UP_PIECE";
      payload: {
        piece: Piece;
        source: "inventory" | "board";
        position?: BoardPosition;
      };
    }
  | { type: "DROP_PIECE"; payload: { position: BoardPosition } }
  | { type: "CANCEL_DRAG" }
  | {
      type: "ROTATE_PIECE";
      payload: { pieceId: string; direction: "clockwise" | "counterclockwise" };
    }
  | { type: "RETURN_TO_INVENTORY"; payload: { piece: Piece } }
  | { type: "RESET_BOARD" }
  | { type: "LOAD_STATE"; payload: GameState };

/**
 * Get initial game state
 */
export function getInitialState(): GameState {
  // Create 10 pieces (0-9) with no rotation
  const inventory: Piece[] = [];
  for (let i = 0; i <= 9; i++) {
    const number = i as PieceNumber;
    inventory.push({
      id: `piece-${i}`,
      number,
      rotation: 0,
      segments: SEGMENT_PATTERNS[number],
    });
  }

  return {
    board: {
      placedPieces: [],
      occupiedSegments: new Set(),
      gridWidth: 5,
      gridHeight: 4,
      totalSegments: 49,
    },
    inventory,
    dragState: null,
  };
}

/**
 * Get absolute segment positions for a piece at a given board position
 */
function getPieceSegmentPositions(
  piece: Piece,
  position: BoardPosition,
): Array<{ x: number; y: number; orientation: "horizontal" | "vertical" }> {
  const segments = getPieceSegments(piece);
  return segments.map((seg) => ({
    x: position.x + seg.x,
    y: position.y + seg.y,
    orientation: seg.orientation,
  }));
}

/**
 * Check if placing a piece would cause collision
 */
function checkCollision(
  piece: Piece,
  position: BoardPosition,
  occupiedSegments: Set<string>,
): boolean {
  const pieceSegments = getPieceSegmentPositions(piece, position);

  for (const segment of pieceSegments) {
    const id = segmentToId(segment);
    if (occupiedSegments.has(id)) {
      return true;
    }

    // Also check if segment is out of bounds
    if (segment.orientation === "horizontal") {
      if (segment.x < 0 || segment.x >= 5 || segment.y < 0 || segment.y > 4) {
        return true;
      }
    } else {
      if (segment.x < 0 || segment.x > 5 || segment.y < 0 || segment.y >= 4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Update occupied segments set
 */
function updateOccupiedSegments(
  occupiedSegments: Set<string>,
  piece: Piece,
  position: BoardPosition,
  operation: "add" | "remove",
): Set<string> {
  const newSet = new Set(occupiedSegments);
  const segments = getPieceSegmentPositions(piece, position);

  for (const segment of segments) {
    const id = segmentToId(segment);
    if (operation === "add") {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
  }

  return newSet;
}

/**
 * Game reducer
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PICK_UP_PIECE": {
      const { piece, source, position } = action.payload;

      // For both inventory and board, just set drag state
      // Don't remove piece yet - it will be removed/moved on successful drop
      // For board pieces, we need to temporarily remove from occupied segments
      // so collision detection works correctly
      if (source === "board" && position) {
        const newOccupiedSegments = updateOccupiedSegments(
          state.board.occupiedSegments,
          piece,
          position,
          "remove",
        );

        return {
          ...state,
          board: {
            ...state.board,
            occupiedSegments: newOccupiedSegments,
          },
          dragState: {
            piece,
            sourceType: source,
            sourcePosition: position,
            sourcePiece: piece,
          },
        };
      }

      // For inventory, just set drag state
      return {
        ...state,
        dragState: { piece, sourceType: source },
      };
    }

    case "DROP_PIECE": {
      if (!state.dragState) return state;

      const { piece, sourceType, sourcePosition, sourcePiece } =
        state.dragState;
      const { position } = action.payload;

      // Check collision
      if (checkCollision(piece, position, state.board.occupiedSegments)) {
        // Return to source
        if (sourceType === "inventory") {
          // Piece is still in inventory, just clear drag state
          return {
            ...state,
            dragState: null,
          };
        } else if (sourcePosition) {
          // Return occupied segments for original position
          const restorePiece = sourcePiece ?? piece;
          const newOccupiedSegments = updateOccupiedSegments(
            state.board.occupiedSegments,
            restorePiece,
            sourcePosition,
            "add",
          );
          return {
            ...state,
            board: {
              ...state.board,
              occupiedSegments: newOccupiedSegments,
            },
            dragState: null,
          };
        }
      }

      // Place on board successfully
      const newOccupiedSegments = updateOccupiedSegments(
        state.board.occupiedSegments,
        piece,
        position,
        "add",
      );

      // Handle different source types
      if (sourceType === "inventory") {
        // Remove from inventory and add to board
        const newInventory = state.inventory.filter((p) => p.id !== piece.id);
        return {
          ...state,
          board: {
            ...state.board,
            placedPieces: [...state.board.placedPieces, { piece, position }],
            occupiedSegments: newOccupiedSegments,
          },
          inventory: newInventory,
          dragState: null,
        };
      } else if (sourcePosition) {
        // Moving from board to board - update position
        const newPlacedPieces = state.board.placedPieces.map((p) =>
          p.piece.id === piece.id ? { piece, position } : p,
        );
        return {
          ...state,
          board: {
            ...state.board,
            placedPieces: newPlacedPieces,
            occupiedSegments: newOccupiedSegments,
          },
          dragState: null,
        };
      }

      return { ...state, dragState: null };
    }

    case "CANCEL_DRAG": {
      if (!state.dragState) return state;

      const { piece, sourceType, sourcePosition, sourcePiece } =
        state.dragState;

      // Return to source
      if (sourceType === "inventory") {
        // Piece is still in inventory, just clear drag state
        return {
          ...state,
          dragState: null,
        };
      } else if (sourcePosition) {
        // Restore occupied segments for original position
        const restorePiece = sourcePiece ?? piece;
        const newOccupiedSegments = updateOccupiedSegments(
          state.board.occupiedSegments,
          restorePiece,
          sourcePosition,
          "add",
        );
        return {
          ...state,
          board: {
            ...state.board,
            occupiedSegments: newOccupiedSegments,
          },
          dragState: null,
        };
      }

      return { ...state, dragState: null };
    }

    case "ROTATE_PIECE": {
      const { pieceId, direction } = action.payload;

      // Rotate piece in inventory (if present)
      const inventoryIndex = state.inventory.findIndex((p) => p.id === pieceId);
      let newInventory = state.inventory;

      if (inventoryIndex !== -1) {
        const piece = state.inventory[inventoryIndex];
        const rotatedPiece = rotatePiece(piece, direction);
        newInventory = [...state.inventory];
        newInventory[inventoryIndex] = rotatedPiece;
      }

      // Rotate piece in dragState (if currently being dragged)
      let newDragState = state.dragState;
      if (state.dragState?.piece.id === pieceId) {
        const rotatedDragPiece = rotatePiece(state.dragState.piece, direction);
        newDragState = {
          ...state.dragState,
          piece: rotatedDragPiece,
        };
      }

      // If nothing changed, return original state
      if (inventoryIndex === -1 && state.dragState?.piece.id !== pieceId) {
        return state;
      }

      return {
        ...state,
        inventory: newInventory,
        dragState: newDragState,
      };
    }

    case "RETURN_TO_INVENTORY": {
      const { piece } = action.payload;

      // Check if piece is being dragged and came from inventory
      // If so, just cancel the drag without duplicating
      if (state.dragState?.sourceType === "inventory") {
        return {
          ...state,
          dragState: null,
        };
      }

      // Remove from board if it's there
      const newPlacedPieces = state.board.placedPieces.filter(
        (p) => p.piece.id !== piece.id,
      );

      // Find the position if it was on board to remove occupied segments
      const placedPiece = state.board.placedPieces.find(
        (p) => p.piece.id === piece.id,
      );

      let newOccupiedSegments = state.board.occupiedSegments;
      if (placedPiece) {
        newOccupiedSegments = updateOccupiedSegments(
          state.board.occupiedSegments,
          placedPiece.piece,
          placedPiece.position,
          "remove",
        );
      }

      // Add to inventory only if it's not already there
      const isAlreadyInInventory = state.inventory.some(
        (p) => p.id === piece.id,
      );

      return {
        ...state,
        board: {
          ...state.board,
          placedPieces: newPlacedPieces,
          occupiedSegments: newOccupiedSegments,
        },
        inventory: isAlreadyInInventory
          ? state.inventory
          : [...state.inventory, piece],
        dragState: null,
      };
    }

    case "RESET_BOARD": {
      return getInitialState();
    }

    case "LOAD_STATE": {
      return action.payload;
    }

    default:
      return state;
  }
}

/**
 * Game context
 */
const GameContext = createContext<
  | {
      state: GameState;
      dispatch: React.Dispatch<GameAction>;
    }
  | undefined
>(undefined);

/**
 * Game provider component
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook to use game context
 */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
