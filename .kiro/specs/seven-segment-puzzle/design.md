# Design Document: Digits Packing Puzzle Game

## Overview

This design document describes the architecture and implementation approach for a digits packing puzzle game built with React and Next.js. The application provides an interactive interface where players can manipulate puzzle pieces shaped like 7-segment display numbers (0-9) and arrange them on a board with 49 segments.

The core design philosophy emphasizes:

- **Simplicity**: No game logic validation or win conditions - players manage puzzles manually
- **Interactivity**: Smooth drag-and-drop with rotation capabilities
- **Visual Clarity**: Clear representation of 7-segment shapes and board structure
- **State Management**: Persistent state across sessions using browser storage

## Architecture

### High-Level Architecture

The application follows a component-based React architecture with the following layers:

```
┌─────────────────────────────────────────┐
│         Next.js App Layer               │
│  (Routing, SSR, Client Hydration)       │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│      React Component Layer              │
│  ┌─────────────────────────────────┐   │
│  │  GameContainer (Main Layout)    │   │
│  │  ├─ Board Component             │   │
│  │  ├─ Inventory Component         │   │
│  │  └─ Controls Component          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│      State Management Layer             │
│  (React Context + useReducer)           │
│  - Piece positions and rotations        │
│  - Board state                          │
│  - Drag state                           │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│      Persistence Layer                  │
│  (localStorage API)                     │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Drag and Drop**: react-dnd or native HTML5 drag-and-drop API
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: React Context API with useReducer
- **Storage**: Browser localStorage API
- **TypeScript**: For type safety

## Components and Interfaces

### Core Data Models

#### PieceType

```typescript
type PieceNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type Rotation = 0 | 90 | 180 | 270;

interface Piece {
  id: string; // Unique identifier
  number: PieceNumber; // The number this piece represents
  rotation: Rotation; // Current rotation in degrees
  segments: Segment[]; // Array of segment positions relative to piece origin
}

interface Segment {
  x: number; // Relative x position
  y: number; // Relative y position
  orientation: "horizontal" | "vertical";
}
```

#### Board State

```typescript
interface BoardPosition {
  x: number; // Grid x coordinate (0-4)
  y: number; // Grid y coordinate (0-3)
}

interface PlacedPiece {
  piece: Piece;
  position: BoardPosition; // Top-left anchor position on board
}

interface BoardState {
  placedPieces: PlacedPiece[];
  occupiedSegments: Set<string>; // Set of "x,y" strings for occupied segment positions
  gridWidth: 5; // Constant: 5 units wide
  gridHeight: 4; // Constant: 4 units tall
  totalSegments: 49; // Constant: total segments
}
```

#### Game State

```typescript
interface GameState {
  board: BoardState;
  inventory: Piece[]; // Pieces not on the board
  dragState: DragState | null;
}

interface DragState {
  piece: Piece;
  sourceType: "inventory" | "board";
  sourcePosition?: BoardPosition; // If dragging from board
}
```

### Component Interfaces

#### GameContainer Component

```typescript
interface GameContainerProps {
  // No props - top-level component
}

// Responsibilities:
// - Initialize game state
// - Provide state context to children
// - Handle state persistence
// - Coordinate between Board, Inventory, and Controls
```

#### Board Component

```typescript
interface BoardProps {
  placedPieces: PlacedPiece[];
  onPieceDrop: (piece: Piece, position: BoardPosition) => boolean; // Returns true if placement successful
  onPiecePickup: (pieceId: string) => void;
  gridWidth: number;
  gridHeight: number;
  occupiedSegments: Set<string>;
}

// Responsibilities:
// - Render 49-segment grid structure
// - Display placed pieces at correct positions
// - Handle drop events with collision detection
// - Handle pickup events for pieces on board
// - Provide visual feedback for valid/invalid drop positions
// - Show which segments are occupied
```

#### Inventory Component

```typescript
interface InventoryProps {
  pieces: Piece[];
  onPiecePickup: (piece: Piece) => void;
  onRotate: (
    pieceId: string,
    direction: "clockwise" | "counterclockwise",
  ) => void;
}

// Responsibilities:
// - Display available pieces
// - Handle piece selection for dragging
// - Provide rotation controls
// - Show piece rotation state
```

#### PieceRenderer Component

```typescript
interface PieceRendererProps {
  piece: Piece;
  scale?: number; // Optional scaling factor
  isDragging?: boolean; // Visual state indicator
  onClick?: () => void;
  onRotate?: (direction: "clockwise" | "counterclockwise") => void;
}

// Responsibilities:
// - Render 7-segment display shape for given number
// - Apply rotation transformation
// - Handle visual states (hover, dragging)
// - Render rotation controls if provided
```

#### Controls Component

```typescript
interface ControlsProps {
  onReset: () => void;
}

// Responsibilities:
// - Provide reset button
// - Show visual confirmation for actions
```

### 7-Segment Display Definitions

Each number (0-9) is defined by which segments are active in a standard 7-segment display:

```
Standard 7-segment layout:
     a
   ┌───┐
 f │   │ b
   ├─g─┤
 e │   │ c
   └───┘
     d

Segment definitions:
- a: top horizontal
- b: top-right vertical
- c: bottom-right vertical
- d: bottom horizontal
- e: bottom-left vertical
- f: top-left vertical
- g: middle horizontal
```

Number to segment mapping:

```typescript
const SEGMENT_PATTERNS: Record<PieceNumber, string[]> = {
  0: ["a", "b", "g", "f"], // Special: only 4 segments
  1: ["b", "c"],
  2: ["a", "b", "g", "e", "d"],
  3: ["a", "b", "g", "c", "d"],
  4: ["f", "g", "b", "c"],
  5: ["a", "f", "g", "c", "d"],
  6: ["a", "f", "g", "e", "d", "c"],
  7: ["a", "b", "c"],
  8: ["a", "b", "c", "d", "e", "f", "g"],
  9: ["a", "b", "c", "d", "f", "g"],
};
```

### Grid Coordinate System

The board uses a coordinate system where:

- Origin (0,0) is top-left
- X increases rightward (0-4)
- Y increases downward (0-3)
- Each grid cell can contain segment endpoints
- 49 segments represent edges in a 5×4 grid structure (5 units wide, 4 units tall)

```
Grid structure (5 cells wide × 4 cells tall):
  0   1   2   3   4   5
0 ●───●───●───●───●───●
  │   │   │   │   │   │
1 ●───●───●───●───●───●
  │   │   │   │   │   │
2 ●───●───●───●───●───●
  │   │   │   │   │   │
3 ●───●───●───●───●───●
  │   │   │   │   │   │
4 ●───●───●───●───●───●

Total edges (segments):
- Vertical edges: 6 vertical lines × 4 edges each = 24
- Horizontal edges: 5 horizontal lines × 5 edges each = 25
- Total: 24 + 25 = 49 segments
```

## Data Models

### State Management

The application uses React Context with useReducer for centralized state management:

```typescript
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
  | { type: "RESET_BOARD" }
  | { type: "LOAD_STATE"; payload: GameState };

function gameReducer(state: GameState, action: GameAction): GameState {
  // Handle state transitions based on action type
}
```

### Persistence Schema

State is persisted to localStorage with the following schema:

```typescript
interface PersistedState {
  version: string; // Schema version for migrations
  timestamp: number; // Last save timestamp
  board: {
    placedPieces: Array<{
      pieceId: string;
      number: PieceNumber;
      rotation: Rotation;
      position: BoardPosition;
    }>;
    occupiedSegments: string[]; // Array of "x,y" strings
  };
  inventory: Array<{
    pieceId: string;
    number: PieceNumber;
    rotation: Rotation;
  }>;
}
```

### Rotation Logic

Rotation transforms segment positions around the piece origin:

```typescript
function rotateSegment(segment: Segment, rotation: Rotation): Segment {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: Math.round(segment.x * cos - segment.y * sin),
    y: Math.round(segment.x * sin + segment.y * cos),
    orientation:
      rotation % 180 === 0
        ? segment.orientation
        : segment.orientation === "horizontal"
          ? "vertical"
          : "horizontal",
  };
}

function rotatePiece(
  piece: Piece,
  direction: "clockwise" | "counterclockwise",
): Piece {
  const delta = direction === "clockwise" ? 90 : -90;
  const newRotation = ((piece.rotation + delta + 360) % 360) as Rotation;

  return {
    ...piece,
    rotation: newRotation,
    segments: piece.segments.map((seg) =>
      rotateSegment(seg, delta as Rotation),
    ),
  };
}
```

### Collision Detection Logic

The application must prevent pieces from overlapping:

```typescript
function checkCollision(
  piece: Piece,
  position: BoardPosition,
  occupiedSegments: Set<string>,
): boolean {
  // Get all segment positions this piece would occupy
  const pieceSegments = getPieceSegmentPositions(piece, position);

  // Check if any segment is already occupied
  for (const segment of pieceSegments) {
    const key = `${segment.x},${segment.y}`;
    if (occupiedSegments.has(key)) {
      return true; // Collision detected
    }
  }

  return false; // No collision
}

function getPieceSegmentPositions(
  piece: Piece,
  position: BoardPosition,
): Array<{ x: number; y: number }> {
  // Convert piece's relative segment positions to absolute board positions
  return piece.segments.map((seg) => ({
    x: position.x + seg.x,
    y: position.y + seg.y,
  }));
}

function updateOccupiedSegments(
  occupiedSegments: Set<string>,
  piece: Piece,
  position: BoardPosition,
  operation: "add" | "remove",
): Set<string> {
  const newSet = new Set(occupiedSegments);
  const segments = getPieceSegmentPositions(piece, position);

  for (const segment of segments) {
    const key = `${segment.x},${segment.y}`;
    if (operation === "add") {
      newSet.add(key);
    } else {
      newSet.delete(key);
    }
  }

  return newSet;
}
```

### Drag and Drop Flow

```
1. User initiates drag on piece
   ↓
2. Create DragState with piece and source info
   ↓
3. Visual feedback: piece follows cursor
   ↓
4. User moves over board
   ↓
5. Board checks collision at hover position
   ↓
6. Show visual feedback: green if valid, red if collision
   ↓
7. User releases mouse
   ↓
8a. Over board with valid position:
    - Check collision one final time
    - If no collision: place piece at position
    - Update occupiedSegments set
    - Remove from inventory if from inventory
    - Update position if from board
   ↓
8b. Over board with collision OR outside board:
    - Return piece to source
    - If from board, return to original position
    - If from inventory, return to inventory
   ↓
9. Clear DragState
   ↓
10. Persist state to localStorage
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- Properties 1.3 is redundant with 1.1 (both test correct segment patterns)
- Property 2.5 is redundant with 2.1 (rendering all segments is implied by having 49 segments)
- Property 4.6 is redundant with 4.5 (rotation preservation during placement is covered by drag preservation)
- Property 5.2 is redundant with 3.5 (both test inventory updates when piece placed)
- Property 5.5 is redundant with 4.5 (rotation preservation already tested)
- Property 8.2 is redundant with 4.5 (rotation preservation already tested)
- Property 9.4 is redundant with 9.1 (visual feedback is a UI concern, not a correctness property)

The following properties provide unique validation value and will be implemented:

### Property 1: Segment Pattern Correctness

_For any_ number 0-9, rendering that number as a puzzle piece should produce segments that match the standard 7-segment display pattern for that number, with number 0 having exactly 4 segments.

**Validates: Requirements 1.1, 1.2**

### Property 2: Coordinate System Consistency

_For any_ segment position on the board, converting from grid coordinates to pixel coordinates and back should produce the same grid coordinates.

**Validates: Requirements 2.4**

### Property 3: Drag Initiation

_For any_ piece in the inventory, clicking on that piece should create a drag state containing that piece.

**Validates: Requirements 3.1**

### Property 4: Piece Placement on Board

_For any_ piece and any valid board position, dropping the piece at that position should result in the piece being placed at that exact position on the board.

**Validates: Requirements 3.3**

### Property 5: Drag Cancellation Returns to Inventory

_For any_ piece from inventory, if dragged and dropped outside the board area, the piece should remain in the inventory.

**Validates: Requirements 3.4**

### Property 6: Board Placement Removes from Inventory

_For any_ piece in inventory, placing it on the board should remove it from the inventory and add it to the board's placed pieces.

**Validates: Requirements 3.5**

### Property 7: Board-to-Board Movement

_For any_ piece on the board, dragging it to a different board position should update its position while keeping it on the board.

**Validates: Requirements 3.6**

### Property 8: Board-to-Inventory Movement

_For any_ piece on the board, dragging it outside the board area should remove it from the board and return it to the inventory.

**Validates: Requirements 3.6**

### Property 9: Rotation by 90 Degrees

_For any_ piece, rotating it clockwise or counterclockwise should change its rotation value by exactly 90 degrees (modulo 360).

**Validates: Requirements 4.2**

### Property 10: Rotation Round Trip

_For any_ piece, rotating it clockwise 4 times should return it to its original rotation state, and rotating counterclockwise 4 times should also return it to its original rotation state.

**Validates: Requirements 4.3**

### Property 11: Rotation Preservation During Drag

_For any_ piece with a non-zero rotation, dragging and dropping it (whether to board or back to inventory) should preserve its rotation value.

**Validates: Requirements 4.5**

### Property 12: Inventory Return Adds Piece

_For any_ piece on the board, removing it from the board should add it back to the inventory.

**Validates: Requirements 5.3**

### Property 13: State Persistence Across Operations

_For any_ sequence of valid operations (place, move, rotate), the board state should remain consistent and reflect all applied operations.

**Validates: Requirements 8.1**

### Property 14: Storage Round Trip

_For any_ valid game state, serializing it to storage format and then deserializing should produce an equivalent game state.

**Validates: Requirements 8.3**

### Property 15: Storage Error Handling

_For any_ storage error (quota exceeded, access denied), the application should handle it gracefully without crashing and continue operating with in-memory state.

**Validates: Requirements 8.5**

### Property 16: Collision Detection

_For any_ piece and board position, if placing the piece would cause any of its segments to overlap with segments from existing pieces, the placement should be prevented.

**Validates: Requirements 9.1**

### Property 17: Valid Placement Only in Empty Space

_For any_ piece placement that succeeds, all segments of that piece must occupy board positions that were previously empty.

**Validates: Requirements 9.2, 9.5**

### Property 18: Invalid Placement Returns to Source

_For any_ attempted placement that would cause overlap, the piece should return to its original position (inventory or previous board location).

**Validates: Requirements 9.3**

### Property 19: Reset Clears Board

_For any_ board state with pieces placed, activating reset should result in an empty board with all pieces returned to inventory.

**Validates: Requirements 10.2**

### Property 20: Reset Clears Rotations

_For any_ game state with rotated pieces, activating reset should result in all pieces having 0-degree rotation.

**Validates: Requirements 10.3**

### Property 21: Reset Clears Storage

_For any_ game state, activating reset should clear the persisted state from localStorage.

**Validates: Requirements 10.4**

## Error Handling

### Error Categories

1. **Storage Errors**
   - Quota exceeded
   - Access denied (private browsing)
   - Serialization failures
   - **Handling**: Log error, continue with in-memory state, show user notification

2. **State Corruption**
   - Invalid piece IDs
   - Out-of-bounds positions
   - Invalid rotation values
   - **Handling**: Reset to default state, log error for debugging

3. **Drag Operation Errors**
   - Lost drag state
   - Invalid drop targets
   - **Handling**: Cancel drag operation, return piece to source

4. **Rendering Errors**
   - Invalid segment definitions
   - Missing piece data
   - **Handling**: Use fallback rendering, log error

### Error Recovery Strategies

```typescript
// Storage error handling
function saveState(state: GameState): void {
  try {
    const serialized = JSON.stringify(serializeState(state));
    localStorage.setItem("puzzle-state", serialized);
  } catch (error) {
    console.error("Failed to save state:", error);
    // Continue operating with in-memory state
    showNotification(
      "Unable to save progress. Changes will be lost on refresh.",
    );
  }
}

// State validation
function validateGameState(state: unknown): GameState | null {
  try {
    // Validate structure and types
    if (!isValidGameState(state)) {
      return null;
    }
    return state as GameState;
  } catch (error) {
    console.error("Invalid game state:", error);
    return null;
  }
}

// Graceful degradation
function loadState(): GameState {
  try {
    const saved = localStorage.getItem("puzzle-state");
    if (!saved) return getInitialState();

    const parsed = JSON.parse(saved);
    const validated = validateGameState(parsed);

    return validated || getInitialState();
  } catch (error) {
    console.error("Failed to load state:", error);
    return getInitialState();
  }
}
```

## Testing Strategy

### Dual Testing Approach

This project will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: We will use **fast-check** for property-based testing in TypeScript/JavaScript.

**Configuration Requirements**:

- Each property test must run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: seven-segment-puzzle, Property N: [property text]`
- Each correctness property must be implemented by a single property-based test

**Example Property Test**:

```typescript
import fc from "fast-check";

// Feature: seven-segment-puzzle, Property 1: Segment Pattern Correctness
test("piece rendering produces correct segment patterns", () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 9 }), (number) => {
      const piece = createPiece(number as PieceNumber);
      const segments = piece.segments;
      const expectedPattern = SEGMENT_PATTERNS[number];

      expect(segments).toHaveLength(expectedPattern.length);
      // Additional assertions for segment correctness
    }),
    { numRuns: 100 },
  );
});
```

### Unit Testing Focus

Unit tests should focus on:

- **Specific examples**: Initial state has 10 pieces in inventory (Requirement 5.1)
- **Edge cases**: Number 0 has exactly 4 segments (Requirement 1.2)
- **Integration points**: GameContainer properly initializes all child components
- **Error conditions**: Storage quota exceeded, invalid JSON in localStorage
- **UI interactions**: Reset button clears board (Requirement 10.1)

### Property Testing Focus

Property tests should focus on:

- **Universal properties**: All numbers render with correct segment patterns (Property 1)
- **State transitions**: Drag and drop operations maintain state consistency (Properties 4-8)
- **Transformations**: Rotation operations are correct and reversible (Properties 9-11)
- **Invariants**: Z-index ordering is maintained (Property 18)
- **Round-trip properties**: Storage serialization/deserialization (Property 14)

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   │   ├── PieceRenderer.test.tsx
│   │   ├── Board.test.tsx
│   │   ├── Inventory.test.tsx
│   │   └── Controls.test.tsx
│   ├── state/
│   │   ├── gameReducer.test.ts
│   │   └── persistence.test.ts
│   └── utils/
│       ├── rotation.test.ts
│       └── coordinates.test.ts
└── property/
    ├── rendering.property.test.ts
    ├── dragDrop.property.test.ts
    ├── rotation.property.test.ts
    ├── state.property.test.ts
    └── persistence.property.test.ts
```

### Generator Strategies for Property Tests

**Piece Generator**:

```typescript
const arbitraryPiece = fc.record({
  id: fc.uuid(),
  number: fc.integer({ min: 0, max: 9 }) as fc.Arbitrary<PieceNumber>,
  rotation: fc.constantFrom(0, 90, 180, 270) as fc.Arbitrary<Rotation>,
  segments: fc.constant([]), // Will be computed from number
});
```

**Board Position Generator**:

```typescript
const arbitraryBoardPosition = fc.record({
  x: fc.integer({ min: 0, max: 4 }),
  y: fc.integer({ min: 0, max: 3 }),
});
```

**Game State Generator**:

```typescript
const arbitraryGameState = fc.record({
  board: fc.record({
    placedPieces: fc.array(
      fc.record({
        piece: arbitraryPiece,
        position: arbitraryBoardPosition,
        zIndex: fc.nat(),
      }),
      { maxLength: 10 },
    ),
    gridWidth: fc.constant(5),
    gridHeight: fc.constant(4),
    totalSegments: fc.constant(49),
  }),
  inventory: fc.array(arbitraryPiece, { maxLength: 10 }),
  dragState: fc.constant(null),
});
```

### Edge Cases to Cover

1. **Number 0 with 4 segments** (not 6 like typical 7-segment displays)
2. **Empty board state** (all pieces in inventory)
3. **Full board state** (all pieces placed without overlap)
4. **Collision at board edges** (piece extends beyond board boundaries)
5. **Collision with existing pieces** (overlapping segments)
6. **Rotation at boundaries** (359° → 0°, 0° → 270° counterclockwise)
7. **Storage quota exceeded**
8. **Corrupted localStorage data**
9. **Drag operation interrupted** (mouse leaves window)

### Integration Testing

Integration tests should verify:

- Complete drag-and-drop flow from inventory to board
- Rotation followed by placement preserves rotation
- Reset functionality clears all state including localStorage
- Page refresh restores previous state correctly
- Multiple pieces can be placed and moved without state corruption

### Testing Tools

- **Test Runner**: Jest or Vitest
- **Property Testing**: fast-check
- **React Testing**: React Testing Library
- **Drag and Drop Testing**: @testing-library/user-event with drag-and-drop support
- **Storage Mocking**: jest-localstorage-mock or custom localStorage mock
