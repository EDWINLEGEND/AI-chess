import React, { useState, useEffect, useRef } from 'react';

const CustomChessBoard = ({ position, boardWidth = 500 }) => {
  const [animatingPieces, setAnimatingPieces] = useState([]);
  const [displayPosition, setDisplayPosition] = useState(position);
  const previousPositionRef = useRef(position);
  // Chess piece Unicode symbols
  const pieceSymbols = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙', // White pieces
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'  // Black pieces
  };

  // Parse FEN position into 8x8 board array
  const parseFEN = (fen) => {
    const rows = fen.split(' ')[0].split('/');
    const board = [];
    
    for (let row of rows) {
      const boardRow = [];
      for (let char of row) {
        if (isNaN(char)) {
          boardRow.push(char); // It's a piece
        } else {
          // It's a number, add that many empty squares
          for (let i = 0; i < parseInt(char); i++) {
            boardRow.push('');
          }
        }
      }
      board.push(boardRow);
    }
    return board;
  };

  // Detect move and animate
  useEffect(() => {
    if (position !== previousPositionRef.current) {
      const oldBoard = parseFEN(previousPositionRef.current);
      const newBoard = parseFEN(position);
      
      // Find the move by comparing boards
      const move = findMove(oldBoard, newBoard);
      
      if (move) {
        console.log('Animating move:', move);
        // Start animation
        setAnimatingPieces([{
          piece: move.piece,
          from: move.from,
          to: move.to,
          id: Date.now()
        }]);
        
        // Update display position after animation
        setTimeout(() => {
          setDisplayPosition(position);
          setAnimatingPieces([]);
        }, 1500); // Animation duration
      } else {
        // No animation needed, just update
        setDisplayPosition(position);
      }
      
      previousPositionRef.current = position;
    }
  }, [position]);

  // Function to find what piece moved
  const findMove = (oldBoard, newBoard) => {
    let fromSquare = null;
    let toSquare = null;
    let piece = null;

    // Find what disappeared (from square)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (oldBoard[row][col] !== newBoard[row][col]) {
          if (oldBoard[row][col] && !newBoard[row][col]) {
            fromSquare = { row, col };
            piece = oldBoard[row][col];
          } else if (!oldBoard[row][col] && newBoard[row][col]) {
            toSquare = { row, col };
          }
        }
      }
    }

    if (fromSquare && toSquare && piece) {
      return { from: fromSquare, to: toSquare, piece };
    }
    return null;
  };

  const board = parseFEN(displayPosition);
  const squareSize = boardWidth / 8;

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
  };

  return (
    <div 
      style={{
        width: boardWidth,
        height: boardWidth,
        border: '2px solid #8b4513',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        position: 'relative'
      }}
    >
      {/* Static board squares */}
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          // Don't show piece if it's currently being animated
          const isAnimating = animatingPieces.some(ap => 
            ap.from.row === rowIndex && ap.from.col === colIndex
          );
          
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                backgroundColor: getSquareColor(rowIndex, colIndex),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: squareSize * 0.7,
                width: squareSize,
                height: squareSize,
                userSelect: 'none',
                position: 'relative'
              }}
            >
              {piece && !isAnimating && pieceSymbols[piece]}
              {/* Add coordinate labels */}
              {rowIndex === 7 && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '4px',
                  fontSize: '10px',
                  color: getSquareColor(rowIndex, colIndex) === '#f0d9b5' ? '#8b4513' : '#f0d9b5',
                  fontWeight: 'bold'
                }}>
                  {String.fromCharCode(97 + colIndex)}
                </div>
              )}
              {colIndex === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '4px',
                  fontSize: '10px',
                  color: getSquareColor(rowIndex, colIndex) === '#f0d9b5' ? '#8b4513' : '#f0d9b5',
                  fontWeight: 'bold'
                }}>
                  {8 - rowIndex}
                </div>
              )}
            </div>
          );
        })
      )}
      
      {/* Animated pieces */}
      {animatingPieces.map((animPiece) => (
        <div
          key={animPiece.id}
          style={{
            position: 'absolute',
            left: animPiece.from.col * squareSize,
            top: animPiece.from.row * squareSize,
            width: squareSize,
            height: squareSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: squareSize * 0.7,
            userSelect: 'none',
            zIndex: 10,
            transition: 'all 1.5s ease-in-out',
            transform: `translate(${(animPiece.to.col - animPiece.from.col) * squareSize}px, ${(animPiece.to.row - animPiece.from.row) * squareSize}px)`,
            pointerEvents: 'none'
          }}
        >
          {pieceSymbols[animPiece.piece]}
        </div>
      ))}
    </div>
  );
};

export default CustomChessBoard;