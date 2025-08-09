import React, { useState, useEffect, useRef } from 'react';

const CustomChessBoard = ({ position, boardWidth = 500 }) => {
  const [animatingPieces, setAnimatingPieces] = useState([]);
  const [displayPosition, setDisplayPosition] = useState(position);

  const previousPositionRef = useRef(position);
  // Chess piece image mapping (SVG placeholders, replace with PNG images)
  const pieceImages = {
    'K': '/images/pieces/white-king.svg',
    'Q': '/images/pieces/white-queen.svg', 
    'R': '/images/pieces/white-rook.svg',
    'B': '/images/pieces/white-bishop.svg',
    'N': '/images/pieces/white-knight.svg',
    'P': '/images/pieces/white-pawn.svg',
    'k': '/images/pieces/black-king.svg',
    'q': '/images/pieces/black-queen.svg',
    'r': '/images/pieces/black-rook.svg',
    'b': '/images/pieces/black-bishop.svg',
    'n': '/images/pieces/black-knight.svg',
    'p': '/images/pieces/black-pawn.svg'
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

  // Simple position change detection and animation
  useEffect(() => {
    if (position !== previousPositionRef.current) {
      console.log('🔄 Position changed, analyzing move...');
      
      // Simple move detection by finding differences
      const move = findSimpleMove(previousPositionRef.current, position);
      
      if (move) {
        console.log('✅ Move found:', move);
        
        // Determine movement type and distances in pixels
        const dxSquares = move.to.col - move.from.col;
        const dySquares = move.to.row - move.from.row;
        const dxPx = dxSquares * (boardWidth / 8);
        const dyPx = dySquares * (boardWidth / 8);
        const absDx = Math.abs(dxSquares);
        const absDy = Math.abs(dySquares);

        let animType = 'linearStep';
        let kxPx = 0;
        let kyPx = 0;
        let steps = Math.max(absDx, absDy);
        const PER_STEP_MS = 500; // slow step: 0.5s per square
        let durationMs = Math.max(PER_STEP_MS, steps * PER_STEP_MS);
        // Knight (L-shape)
        if ((absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2)) {
          animType = 'knight';
          // First leg: the longer axis
          if (absDx > absDy) {
            kxPx = (dxSquares > 0 ? 2 : -2) * (boardWidth / 8);
            kyPx = 0;
          } else {
            kxPx = 0;
            kyPx = (dySquares > 0 ? 2 : -2) * (boardWidth / 8);
          }
          steps = 2;
          durationMs = steps * PER_STEP_MS;
        }

        // Start piece animation with movement variables
        setAnimatingPieces([{
          piece: move.piece,
          from: move.from,
          to: move.to,
          id: Date.now(),
          animType,
          dxPx,
          dyPx,
          kxPx,
          kyPx,
          steps,
          durationMs
        }]);

        // Clear everything after animation
        setTimeout(() => {
          setDisplayPosition(position);
          setAnimatingPieces([]);
        }, durationMs);
      } else {
        // No move detected, just update position
        setDisplayPosition(position);
      }
      
      previousPositionRef.current = position;
    }
  }, [position]);

  // Simple and reliable move detection
  const findSimpleMove = (oldFEN, newFEN) => {
    try {
      // Parse both positions
      const oldBoard = parseFEN(oldFEN);
      const newBoard = parseFEN(newFEN);
      
      // Find all changed squares
      const changes = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (oldBoard[row][col] !== newBoard[row][col]) {
            changes.push({
              row,
              col,
              was: oldBoard[row][col] || '',
              now: newBoard[row][col] || ''
            });
          }
        }
      }
      
      console.log('Board changes:', changes);
      
      if (changes.length < 2) return null;
      
      // Find the most obvious move (piece disappeared from one square, appeared on another)
      for (let i = 0; i < changes.length; i++) {
        for (let j = i + 1; j < changes.length; j++) {
          const change1 = changes[i];
          const change2 = changes[j];
          
          // Case 1: Normal move (piece left one square, appeared on empty square)
          if (change1.was && !change1.now && !change2.was && change2.now && change1.was === change2.now) {
            return {
              from: { row: change1.row, col: change1.col },
              to: { row: change2.row, col: change2.col },
              piece: change1.was
            };
          }
          
          // Case 2: Capture (piece left one square, replaced piece on another square)
          if (change1.was && !change1.now && change2.was && change2.now && change1.was === change2.now) {
            return {
              from: { row: change1.row, col: change1.col },
              to: { row: change2.row, col: change2.col },
              piece: change1.was
            };
          }
        }
      }
      
      // Fallback: just take first piece that disappeared and first that appeared
      const disappeared = changes.find(c => c.was && !c.now);
      const appeared = changes.find(c => !c.was && c.now);
      
      if (disappeared && appeared) {
        return {
          from: { row: disappeared.row, col: disappeared.col },
          to: { row: appeared.row, col: appeared.col },
          piece: disappeared.was || appeared.now
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting move:', error);
      return null;
    }
  };

  const board = parseFEN(displayPosition);
  const squareSize = boardWidth / 8;

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? '#ffffff' : '#000000';
  };

  // Unicode fallback for when images don't load
  const getUnicodeSymbol = (piece) => {
    const symbols = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return symbols[piece] || piece;
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
                                        {piece && !isAnimating && (
                            <img 
                              src={pieceImages[piece]} 
                              alt={piece}
                              style={{
                                width: '80%',
                                height: '80%',
                                objectFit: 'contain',
                                userSelect: 'none',
                                pointerEvents: 'none'
                              }}
                              onError={(e) => {
                                // Fallback to Unicode if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          )}
                          {piece && !isAnimating && (
                            <span style={{ 
                              display: 'none', 
                              fontSize: squareSize * 0.7,
                              userSelect: 'none'
                            }}>
                              {getUnicodeSymbol(piece)}
                            </span>
                          )}
                                        {/* Add coordinate labels */}
                          {rowIndex === 7 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '4px',
                              fontSize: '12px',
                              color: getSquareColor(rowIndex, colIndex) === '#ffffff' ? '#333333' : '#cccccc',
                              fontWeight: 'bold',
                              textShadow: getSquareColor(rowIndex, colIndex) === '#ffffff' ? '0 0 2px rgba(255,255,255,0.8)' : '0 0 2px rgba(0,0,0,0.8)'
                            }}>
                              {String.fromCharCode(97 + colIndex)}
                            </div>
                          )}
                          {colIndex === 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              left: '4px',
                              fontSize: '12px',
                              color: getSquareColor(rowIndex, colIndex) === '#ffffff' ? '#333333' : '#cccccc',
                              fontWeight: 'bold',
                              textShadow: getSquareColor(rowIndex, colIndex) === '#ffffff' ? '0 0 2px rgba(255,255,255,0.8)' : '0 0 2px rgba(0,0,0,0.8)'
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
            // Provide CSS variables for keyframe animations
            ['--dx']: `${animPiece.dxPx}px`,
            ['--dy']: `${animPiece.dyPx}px`,
            ['--kx']: `${animPiece.kxPx}px`,
            ['--ky']: `${animPiece.kyPx}px`,
            animation: `${animPiece.animType === 'knight' ? 'moveKnight' : 'moveLinearStep'} ${animPiece.durationMs}ms steps(${Math.max(1, animPiece.steps)}, end) forwards`,
            pointerEvents: 'none'
          }}
        >
                                <img 
                        src={pieceImages[animPiece.piece]} 
                        alt={animPiece.piece}
                        style={{
                          width: '80%',
                          height: '80%',
                          objectFit: 'contain',
                          userSelect: 'none',
                          pointerEvents: 'none'
                        }}
                        onError={(e) => {
                          // Fallback to Unicode for animated pieces
                          e.target.outerHTML = `<span style="font-size: ${squareSize * 0.7}px; user-select: none;">${getUnicodeSymbol(animPiece.piece)}</span>`;
                        }}
                      />
        </div>
      ))}
    </div>
  );
};

export default CustomChessBoard;