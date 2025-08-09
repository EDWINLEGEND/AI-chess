import React, { useState, useEffect, useRef } from 'react';

// Global piece identity storage
let pieceIdentities = null;

const initializePieceIdentities = () => {
  if (!pieceIdentities) {
    pieceIdentities = {};
    // Initialize Marvel pieces (uppercase)
    pieceIdentities['K'] = { svg: 'ironman.svg', name: 'Iron Man' };
    pieceIdentities['Q'] = { svg: 'wanda.svg', name: 'Scarlet Witch' };
    
    // Rooks
    pieceIdentities['R_0'] = { svg: 'thor.svg', name: 'Thor' }; // Left rook
    pieceIdentities['R_7'] = { svg: 'capmarvel.svg', name: 'Captain Marvel' }; // Right rook
    
    // Bishops (c1=col2, f1=col5)
    pieceIdentities['B_2'] = { svg: 'strange.svg', name: 'Doctor Strange' }; // c1 bishop
    pieceIdentities['B_5'] = { svg: 'vision.svg', name: 'Vision' }; // f1 bishop
    
    // Knights (b1=col1, g1=col6)
    pieceIdentities['N_1'] = { svg: 'blackp.svg', name: 'Black Panther' }; // b1 knight
    pieceIdentities['N_6'] = { svg: 'spiderman.svg', name: 'Spider-Man' }; // g1 knight
    
    // Pawns
    const marvelPawns = [
      { svg: 'hawkeye.svg', name: 'Hawkeye' },
      { svg: 'blackwidow.svg', name: 'Black Widow' },
      { svg: 'falcon.svg', name: 'Falcon' },
      { svg: 'antman.svg', name: 'Ant-Man' },
      { svg: 'warmachine.svg', name: 'War Machine' },
      { svg: 'wintersol.svg', name: 'Winter Soldier' },
      { svg: 'wasp.svg', name: 'Wasp' },
      { svg: 'starlord.svg', name: 'Star-Lord' }
    ];
    for (let i = 0; i < 8; i++) {
      pieceIdentities[`P_${i}`] = marvelPawns[i];
    }
    
    // Initialize DC pieces (lowercase)
    pieceIdentities['k'] = { svg: 'superman.svg', name: 'Superman' };
    pieceIdentities['q'] = { svg: 'wonder.svg', name: 'Wonder Woman' };
    
    // Rooks
    pieceIdentities['r_0'] = { svg: 'green.svg', name: 'Green Lantern' };
    pieceIdentities['r_7'] = { svg: 'shazam.svg', name: 'Shazam' };
    
    // Bishops (c8=col2, f8=col5)
    pieceIdentities['b_2'] = { svg: 'martian.svg', name: 'Martian Manhunter' }; // c8 bishop
    pieceIdentities['b_5'] = { svg: 'cyborg.svg', name: 'Cyborg' }; // f8 bishop
    
    // Knights (b8=col1, g8=col6)
    pieceIdentities['n_1'] = { svg: 'flash.svg', name: 'The Flash' }; // b8 knight
    pieceIdentities['n_6'] = { svg: 'batman.svg', name: 'Batman' }; // g8 knight
    
    // Pawns - Batgirl, Robin, Hawkman, Zatanna, Blue Beetle, Green Arrow, Black Canary, Plastic Man
    const dcPawns = [
      { svg: 'batman.svg', name: 'Batgirl' }, // Using batman.svg for Batgirl since we don't have batgirl.svg
      { svg: 'Robin.svg', name: 'Robin' },
      { svg: 'hawkman.svg', name: 'Hawkman' },
      { svg: 'zatanna.svg', name: 'Zatanna' },
      { svg: 'blue.svg', name: 'Blue Beetle' },
      { svg: 'arrow.svg', name: 'Green Arrow' },
      { svg: 'blackcanary.svg', name: 'Black Canary' },
      { svg: 'plastic man.svg', name: 'Plastic Man' }
    ];
    for (let i = 0; i < 8; i++) {
      pieceIdentities[`p_${i}`] = dcPawns[i];
    }
  }
};

export const getPieceIdentity = (piece, row = 0, col = 0) => {
  initializePieceIdentities();
  
  // For unique pieces (K, Q, k, q), return directly
  if (['K', 'Q', 'k', 'q'].includes(piece)) {
    return pieceIdentities[piece];
  }
  
  // For pieces that have multiple instances, use starting position logic
  const key = `${piece}_${col}`;
  const identity = pieceIdentities[key];
  
  if (identity) {
    return identity;
  }
  
  // Fallback logic for pieces not found in specific positions
  if (piece === 'R' || piece === 'r') {
    // If no specific rook found, use the first rook as fallback
    return pieceIdentities[piece === 'R' ? 'R_0' : 'r_0'] || { svg: 'default.svg', name: 'Unknown Rook' };
  }
  
  if (piece === 'B' || piece === 'b') {
    // If no specific bishop found, use the first bishop as fallback
    return pieceIdentities[piece === 'B' ? 'B_2' : 'b_2'] || { svg: 'default.svg', name: 'Unknown Bishop' };
  }
  
  if (piece === 'N' || piece === 'n') {
    // If no specific knight found, use the first knight as fallback
    return pieceIdentities[piece === 'N' ? 'N_1' : 'n_1'] || { svg: 'default.svg', name: 'Unknown Knight' };
  }
  
  if (piece === 'P' || piece === 'p') {
    // If no specific pawn found, use the first pawn as fallback
    return pieceIdentities[piece === 'P' ? 'P_0' : 'p_0'] || { svg: 'default.svg', name: 'Unknown Pawn' };
  }
  
  return { svg: 'default.svg', name: 'Unknown' };
};

const CustomChessBoard = ({ position, boardWidth = 500 }) => {
  const [animatingPieces, setAnimatingPieces] = useState([]);
  const [displayPosition, setDisplayPosition] = useState(position);

  const previousPositionRef = useRef(position);

  const getPieceImage = (piece, row = 0, col = 0) => {
    const identity = getPieceIdentity(piece, row, col);
    return `/images/pieces/${identity.svg}`;
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
                              src={getPieceImage(piece, rowIndex, colIndex)} 
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
                            src={(() => {
                              const squareSize = boardWidth / 8;
                              const fromRow = Math.floor(animPiece.fromY / squareSize);
                              const fromCol = Math.floor(animPiece.fromX / squareSize);
                              return getPieceImage(animPiece.piece, fromRow, fromCol);
                            })()} 
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