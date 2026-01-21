# Implementation Plan: Digits Packing Puzzle Game

## Overview

This implementation plan breaks down the digits packing puzzle game into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. The implementation uses React, Next.js, and TypeScript with fast-check for property-based testing.

## Tasks

- [x] 1. Set up project structure and core types
  - Initialize Next.js project with TypeScript and App Router
  - Install dependencies: react-dnd (or use native drag-and-drop), fast-check, jest/vitest, @testing-library/react
  - Create directory structure: components/, lib/, types/, tests/
  - Define core TypeScript types: PieceNumber, Rotation, Piece, Segment, BoardPosition, PlacedPiece, BoardState, GameState, DragState
  - Create SEGMENT_PATTERNS constant mapping numbers to segment arrays
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Implement 7-segment piece rendering
  - [x] 2.1 Create PieceRenderer component
    - Implement component that renders a piece based on its number and rotation
    - Convert segment patterns to SVG paths for visual display
    - Apply rotation transformation to SVG
    - Add hover and dragging visual states
    - _Requirements: 1.1, 1.2, 4.2_
  - [ ]\* 2.2 Write property test for segment pattern correctness
    - **Property 1: Segment Pattern Correctness**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]\* 2.3 Write unit test for number 0 edge case
    - Test that number 0 renders exactly 4 segments
    - _Requirements: 1.2_

- [x] 3. Implement rotation logic
  - [x] 3.1 Create rotation utility functions
    - Implement rotatePiece function (clockwise/counterclockwise)
    - Implement rotateSegment function for coordinate transformation
    - Handle rotation wrapping (0° ↔ 270°)
    - _Requirements: 4.2, 4.3_
  - [ ]\* 3.2 Write property test for rotation by 90 degrees
    - **Property 9: Rotation by 90 Degrees**
    - **Validates: Requirements 4.2**
  - [ ]\* 3.3 Write property test for rotation round trip
    - **Property 10: Rotation Round Trip**
    - **Validates: Requirements 4.3**

- [x] 4. Implement board component
  - [x] 4.1 Create Board component
    - Render 5x4 grid structure with 49 segments
    - Display placed pieces at correct positions
    - Implement coordinate system (grid to pixel conversion)
    - Add drop zone handling for drag-and-drop
    - _Requirements: 2.1, 2.2, 2.4, 3.3_
  - [ ]\* 4.2 Write unit test for board initialization
    - Test that board contains exactly 49 segments
    - Test that grid structure is 5x4
    - _Requirements: 2.1, 2.2_
  - [ ]\* 4.3 Write property test for coordinate system consistency
    - **Property 2: Coordinate System Consistency**
    - **Validates: Requirements 2.4**

- [x] 5. Implement state management
  - [x] 5.1 Create game state reducer
    - Implement gameReducer with actions: PICK_UP_PIECE, DROP_PIECE, CANCEL_DRAG, ROTATE_PIECE, RESET_BOARD, LOAD_STATE
    - Implement getInitialState function (10 pieces in inventory, empty board)
    - Create React Context for game state
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 4.2, 10.2_
  - [ ]\* 5.2 Write property test for state persistence across operations
    - **Property 13: State Persistence Across Operations**
    - **Validates: Requirements 8.1**
  - [ ]\* 5.3 Write unit test for initial state
    - Test that initial state has 10 pieces in inventory
    - Test that initial board is empty
    - _Requirements: 5.1_

- [x] 6. Implement inventory component
  - [x] 6.1 Create Inventory component
    - Display all pieces currently in inventory
    - Render pieces using PieceRenderer
    - Add rotation controls (clockwise/counterclockwise buttons)
    - Make pieces draggable
    - _Requirements: 5.1, 5.2, 5.3, 4.1_
  - [ ]\* 6.2 Write property test for inventory updates on placement
    - **Property 6: Board Placement Removes from Inventory**
    - **Validates: Requirements 3.5**
  - [ ]\* 6.3 Write property test for inventory updates on return
    - **Property 12: Inventory Return Adds Piece**
    - **Validates: Requirements 5.3**

- [x] 7. Checkpoint - Ensure rendering and state management work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement drag-and-drop system
  - [x] 8.1 Create drag-and-drop handlers
    - Implement onDragStart for pieces in inventory
    - Implement onDragStart for pieces on board
    - Implement onDragOver for board drop zones
    - Implement onDrop for board (place piece at position)
    - Implement onDragEnd for cancel handling (drop outside board)
    - Update game state via reducer actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  - [ ]\* 8.2 Write property test for drag initiation
    - **Property 3: Drag Initiation**
    - **Validates: Requirements 3.1**
  - [ ]\* 8.3 Write property test for piece placement on board
    - **Property 4: Piece Placement on Board**
    - **Validates: Requirements 3.3**
  - [ ]\* 8.4 Write property test for drag cancellation
    - **Property 5: Drag Cancellation Returns to Inventory**
    - **Validates: Requirements 3.4**
  - [ ]\* 8.5 Write property test for board-to-board movement
    - **Property 7: Board-to-Board Movement**
    - **Validates: Requirements 3.6**
  - [ ]\* 8.6 Write property test for board-to-inventory movement
    - **Property 8: Board-to-Inventory Movement**
    - **Validates: Requirements 3.6**
  - [ ]\* 8.7 Write property test for rotation preservation during drag
    - **Property 11: Rotation Preservation During Drag**
    - **Validates: Requirements 4.5**

- [x] 9. Implement collision detection
  - [x] 9.1 Add collision detection logic
    - Implement checkCollision function to detect segment overlaps
    - Implement getPieceSegmentPositions to get absolute positions
    - Implement updateOccupiedSegments to track occupied board positions
    - Update board state to include occupiedSegments Set
    - Modify DROP_PIECE action to check collision before placement
    - Prevent placement if collision detected, return piece to source
    - Provide visual feedback for valid/invalid drop positions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]\* 9.2 Write property test for collision detection
    - **Property 16: Collision Detection**
    - **Validates: Requirements 9.1**
  - [ ]\* 9.3 Write property test for valid placement in empty space
    - **Property 17: Valid Placement Only in Empty Space**
    - **Validates: Requirements 9.2, 9.5**
  - [ ]\* 9.4 Write property test for invalid placement returns to source
    - **Property 18: Invalid Placement Returns to Source**
    - **Validates: Requirements 9.3**
  - [ ]\* 9.5 Write unit tests for collision edge cases
    - Test collision at board edges
    - Test collision with multiple existing pieces
    - _Requirements: 9.1, 9.2_

- [x] 10. Implement localStorage persistence
  - [x] 10.1 Create persistence utilities
    - Implement serializeState function (GameState → PersistedState)
    - Implement deserializeState function (PersistedState → GameState)
    - Implement saveState function with error handling
    - Implement loadState function with validation
    - Add useEffect hook to save state on changes
    - Add useEffect hook to load state on mount
    - _Requirements: 8.1, 8.3, 8.4, 8.5_
  - [ ]\* 10.2 Write property test for storage round trip
    - **Property 14: Storage Round Trip**
    - **Validates: Requirements 8.3**
  - [ ]\* 10.3 Write property test for storage error handling
    - **Property 15: Storage Error Handling**
    - **Validates: Requirements 8.5**
  - [ ]\* 10.4 Write unit tests for storage edge cases
    - Test corrupted localStorage data
    - Test quota exceeded error
    - Test private browsing mode (storage unavailable)
    - _Requirements: 8.5_

- [x] 11. Implement reset functionality
  - [x] 11.1 Create Controls component with reset button
    - Add reset button UI
    - Dispatch RESET_BOARD action on click
    - Show confirmation dialog or visual feedback
    - _Requirements: 10.1, 10.5_
  - [x] 11.2 Implement reset logic in reducer
    - Clear all placed pieces from board
    - Return all pieces to inventory with 0° rotation
    - Clear localStorage
    - _Requirements: 10.2, 10.3, 10.4_
  - [ ]\* 11.3 Write property test for reset clears board
    - **Property 19: Reset Clears Board**
    - **Validates: Requirements 10.2**
  - [ ]\* 11.4 Write property test for reset clears rotations
    - **Property 20: Reset Clears Rotations**
    - **Validates: Requirements 10.3**
  - [ ]\* 11.5 Write property test for reset clears storage
    - **Property 21: Reset Clears Storage**
    - **Validates: Requirements 10.4**
  - [ ]\* 11.6 Write unit test for reset button functionality
    - Test that clicking reset clears the board
    - _Requirements: 10.1_

- [x] 12. Checkpoint - Ensure all core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Create main GameContainer component
  - [x] 13.1 Implement GameContainer
    - Set up game state context provider
    - Compose Board, Inventory, and Controls components
    - Implement responsive layout (board prominent, inventory accessible)
    - Add visual styling and spacing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]\* 13.2 Write integration test for complete drag-and-drop flow
    - Test dragging from inventory to board
    - Test dragging from board to different position
    - Test dragging from board back to inventory
    - _Requirements: 3.1, 3.3, 3.4, 3.6_

- [x] 14. Create Next.js page and styling
  - [x] 14.1 Create main page component
    - Create app/page.tsx with GameContainer
    - Add page metadata and title
    - Implement responsive layout with CSS/Tailwind
    - Add visual feedback for hover states
    - Style drag-and-drop visual feedback
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_
  - [ ]\* 14.2 Write visual regression tests (optional)
    - Test component rendering matches expected output
    - _Requirements: 1.4, 1.5, 7.5_

- [x] 15. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test complete user workflows:
    - Place all 10 pieces on board
    - Rotate pieces before and after placement
    - Move pieces between board positions
    - Return pieces to inventory
    - Reset and start fresh
    - Refresh page and verify state restoration

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify complete workflows
- Checkpoints ensure incremental validation throughout development
