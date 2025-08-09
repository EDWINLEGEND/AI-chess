import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import CustomChessBoard from './CustomChessBoard';

const SimpleChessArena = () => {
  const [game, setGame] = useState(() => new Chess());
  const [gamePosition, setGamePosition] = useState(() => game.fen());
  const [boardKey, setBoardKey] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameStatus, setGameStatus] = useState('Ready to start');
  const [capturedMarvel, setCapturedMarvel] = useState([]); // DC captured Marvel pieces
  const [capturedDC, setCapturedDC] = useState([]); // Marvel captured DC pieces
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState({ winner: '', reason: '', isDraw: false });
  const [commentary, setCommentary] = useState([
    { 
      id: 1, 
      player: 'system', 
              message: 'Welcome to Duh! Chess! Marvel vs DC battle begins...', 
      timestamp: Date.now() 
    }
  ]);
  
  const gameRef = useRef(game);
  const timeoutRef = useRef(null);
  const shouldContinueRef = useRef(false);
  const commentaryRef = useRef(null);

  // Helper function to get piece name with SVG
  const getPieceName = (piece) => {
    const pieceNames = {
      'K': 'King', 'Q': 'Queen', 'R': 'Rook', 'B': 'Bishop', 'N': 'Knight', 'P': 'Pawn',
      'k': 'King', 'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn'
    };
    const color = piece === piece.toUpperCase() ? 'white' : 'black';
    const team = piece === piece.toUpperCase() ? 'Marvel' : 'DC';
    const pieceName = pieceNames[piece.toUpperCase()];
    const svgPath = `/images/pieces/${color}-${pieceName.toLowerCase()}.svg`;
    
    return { name: pieceName, color, team, svgPath, piece };
  };

  // Helper function to convert square notation (like 'e4') to readable position
  const getSquareName = (square) => {
    return square.toUpperCase();
  };

  // Add commentary message
  const addCommentary = (player, message) => {
    setCommentary(prev => [...prev, {
      id: Date.now(),
      player,
      message,
      timestamp: Date.now()
    }]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (commentaryRef.current) {
        commentaryRef.current.scrollTop = commentaryRef.current.scrollHeight;
      }
    }, 100);
  };

  // Update game ref when game state changes
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const makeAutomaticMove = useCallback(() => {
    const currentGame = gameRef.current;
    
    console.log('=== makeAutomaticMove called ===');
    console.log('currentGame.isGameOver():', currentGame.isGameOver());
    console.log('currentGame.fen():', currentGame.fen());
    console.log('currentGame.turn():', currentGame.turn());
    
    // Check if we should continue (using ref to avoid stale closure)
    if (!shouldContinueRef.current) {
      console.log('Game stopped by user');
      setIsGameActive(false);
      return;
    }
    
    if (currentGame.isGameOver()) {
      console.log('Game is over, stopping');
      setIsGameActive(false);
      shouldContinueRef.current = false;
      return;
    }

    console.log('Making automatic move...');
    const moves = currentGame.moves();
    console.log('Available moves:', moves);
    console.log('Number of available moves:', moves.length);
    
    if (moves.length === 0) {
      console.log('No moves available - game should be over');
      setIsGameActive(false);
      return;
    }
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    console.log('Selected move:', randomMove);
    
    try {
      // Create a new game instance and make the move
      const newGame = new Chess(currentGame.fen());
      const moveResult = newGame.move(randomMove);
      console.log('Move result:', moveResult);
      
      if (moveResult) {
        // Create commentary for the move
        const movingPiece = getPieceName(moveResult.piece);
        const playerName = moveResult.color === 'w' ? 'Marvel' : 'DC';
        const fromSquare = getSquareName(moveResult.from);
        const toSquare = getSquareName(moveResult.to);
        
        let commentaryMessage = '';
        
        if (moveResult.captured) {
          const capturedPiece = getPieceName(moveResult.captured);
          commentaryMessage = `${movingPiece.name} from ${fromSquare} captures ${capturedPiece.name} on ${toSquare}! 💥`;
          
          // Track captured pieces to display on the right side
          const capturedCode = moveResult.captured; // p,r,n,b,q,k (lowercase from chess.js)
          if (moveResult.color === 'w') {
            // Marvel moved; captured DC piece
            setCapturedDC(prev => [...prev, capturedCode]);
          } else {
            setCapturedMarvel(prev => [...prev, capturedCode.toUpperCase()]);
          }
        } else {
          commentaryMessage = `${movingPiece.name} moves from ${fromSquare} to ${toSquare}`;
          
          // Add special move annotations
          if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
            commentaryMessage += ' (Castling!) 🏰';
          } else if (moveResult.flags.includes('e')) {
            commentaryMessage += ' (En passant!) ⚡';
          } else if (moveResult.promotion) {
            commentaryMessage += ` (Promoted to ${getPieceName(moveResult.promotion).name}!) 👑`;
          }
        }
        
        // Add check/checkmate indicators
        if (newGame.inCheck()) {
          if (newGame.isCheckmate()) {
            commentaryMessage += ' CHECKMATE! 🎯';
          } else {
            commentaryMessage += ' Check! ⚠️';
          }
        }
        
        addCommentary(playerName.toLowerCase() === 'marvel' ? 'marvel' : 'dc', commentaryMessage);
        
        const newPosition = newGame.fen();
        const currentTurn = newGame.turn() === 'w' ? 'Marvel' : 'DC';
        
        console.log('Move successful! Updating state...');
        console.log('New position:', newPosition);
        console.log('Next turn:', currentTurn);
        
        setGame(newGame);
        setGamePosition(newPosition);
        setMoveCount(prev => {
          const newCount = prev + 1;
          console.log('Move count updated to:', newCount);
          return newCount;
        });
        setBoardKey(prev => prev + 1);
        setGameStatus(`Move ${moveCount + 1} - ${currentTurn} to move`);
        
        // Check if game is over AFTER the move
        if (newGame.isGameOver()) {
          console.log('Game is now over after move');
          let endStatus = 'Game Over - ';
          let winner = '';
          let reason = '';
          let isDraw = false;
          
          if (newGame.isCheckmate()) {
            winner = newGame.turn() === 'w' ? 'DC' : 'Marvel';
            reason = 'Checkmate';
            endStatus += `${winner} wins by checkmate!`;
          } else if (newGame.isDraw()) {
            isDraw = true;
            reason = 'Draw';
            endStatus += 'Draw!';
          } else if (newGame.isStalemate()) {
            isDraw = true;
            reason = 'Stalemate';
            endStatus += 'Stalemate!';
          } else if (newGame.isThreefoldRepetition()) {
            isDraw = true;
            reason = 'Threefold Repetition';
            endStatus += 'Draw by threefold repetition!';
          } else if (newGame.isInsufficientMaterial()) {
            isDraw = true;
            reason = 'Insufficient Material';
            endStatus += 'Draw by insufficient material!';
          }
          
          setGameStatus(endStatus);
          setIsGameActive(false);
          shouldContinueRef.current = false;
          
          // Show winner popup with animation delay
          setTimeout(() => {
            setWinnerInfo({ winner, reason, isDraw });
            setShowWinnerPopup(true);
          }, 1000); // Show popup 1 second after game ends
          
          console.log('Game ended with status:', endStatus);
          return;
        }
        
        // Schedule next move after animation completes + small delay
        console.log('Scheduling next move in 2000ms...');
        timeoutRef.current = setTimeout(() => {
          console.log('Timeout fired, checking if game should continue...');
          const latestGame = gameRef.current;
          if (shouldContinueRef.current && latestGame && !latestGame.isGameOver()) {
            makeAutomaticMove();
          } else {
            console.log('Game no longer active or is over, not making next move');
            setIsGameActive(false);
            shouldContinueRef.current = false;
          }
        }, 2000); // 1.5s animation + 0.5s pause
      } else {
        console.error('Move failed, trying again...');
        // Try again with a small delay
        timeoutRef.current = setTimeout(() => {
          makeAutomaticMove();
        }, 100);
      }
    } catch (error) {
      console.error('Error making move:', error);
      // Try again with a small delay
      timeoutRef.current = setTimeout(() => {
        makeAutomaticMove();
      }, 100);
    }
  }, []); // Remove all dependencies to avoid stale closure

  const startGame = () => {
    console.log('=== Starting automatic game ===');
    console.log('Current game state:', game.fen());
    console.log('Current game over?', game.isGameOver());
    console.log('Available moves:', game.moves().length);
    
    if (game.isGameOver()) {
      console.log('Cannot start - game is already over');
      return;
    }
    
    setIsGameActive(true);
    shouldContinueRef.current = true; // Enable game continuation
    setGameStatus('Game starting...');
    addCommentary('system', 'Game started! Marvel (You) moves first. Good luck! 🚀');
    
    // Start the first move after a short delay
    timeoutRef.current = setTimeout(() => {
      console.log('Starting first move...');
      makeAutomaticMove();
    }, 500);
  };

  const stopGame = () => {
    console.log('Stopping game...');
    setIsGameActive(false);
    shouldContinueRef.current = false; // Disable game continuation
    setGameStatus('Game stopped');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetGame = () => {
    console.log('Resetting game...');
    
    // Stop current game
    setIsGameActive(false);
    shouldContinueRef.current = false; // Disable game continuation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset to starting position
    const newGame = new Chess();
    const startPosition = newGame.fen();
    setGame(newGame);
    setGamePosition(startPosition);
    setMoveCount(0);
    setBoardKey(prev => prev + 1);
    setGameStatus('Ready to start');
    setCapturedMarvel([]);
    setCapturedDC([]);
    setShowWinnerPopup(false);
    setWinnerInfo({ winner: '', reason: '', isDraw: false });
    setCommentary([
      { 
        id: 1, 
        player: 'system', 
        message: 'New game started! Marvel vs DC battle begins...', 
        timestamp: Date.now() 
      }
    ]);
    
    console.log('Reset to starting position:', startPosition);
  };

  // Debug effect to track position changes
  useEffect(() => {
    console.log('Position changed to:', gamePosition);
    console.log('Board key is:', boardKey);
  }, [gamePosition, boardKey]);

  console.log('SimpleChessArena rendering, position:', gamePosition);

  // Calculate board size based on screen dimensions (accounting for both sidebars)
  const getOptimalBoardSize = () => {
    const availableWidth = window.innerWidth - 320 - 380; // Subtract left sidebar (320px) and right sidebar (380px) width
    const availableHeight = window.innerHeight - 40; // Subtract padding
    const minDimension = Math.min(availableWidth * 0.85, availableHeight * 0.9);
    return Math.max(500, Math.min(800, minDimension));
  };

  const boardSize = getOptimalBoardSize();

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: '#2a2a2a',
      color: '#fff',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar */}
      <div style={{
        minWidth: '320px',
        width: '320px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        borderRight: '3px solid #444',
        boxShadow: '5px 0 15px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: '2.8em', 
          marginBottom: '40px', 
          textAlign: 'center',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          fontWeight: 'bold'
        }}>
          <span style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '2px'
          }}>
            Duh!
          </span>
          <span style={{ margin: '0 8px' }}> </span>
          <span style={{
            fontFamily: 'Oswald, sans-serif',
            fontStyle: 'normal',
            background: 'linear-gradient(45deg, #FF6347, #FF4500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            Chess
          </span>
        </h1>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '50px',
          padding: '25px',
          background: 'linear-gradient(135deg, #333 0%, #444 100%)',
          borderRadius: '15px',
          border: '2px solid #555',
          width: '100%',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          fontFamily: '"Clash Display Variable", "Clash Display", sans-serif'
        }}>
          <h2 style={{ 
            color: '#4CAF50', 
            marginBottom: '20px',
            fontSize: '1.5em',
            textShadow: '0 0 10px rgba(76, 175, 80, 0.3)',
            fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
            fontWeight: '500'
          }}>
            {gameStatus}
          </h2>
          <div style={{ 
            fontSize: '1.2em', 
            lineHeight: '1.8',
            fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
            fontWeight: '400'
          }}>
                                    <p><strong>Turn:</strong> {game.turn() === 'w' ? '🦸‍♂️ Marvel' : '🦹‍♂️ DC'}</p>
            <p><strong>Move:</strong> #{moveCount}</p>
            <p><strong>Available:</strong> {game.moves().length} moves</p>
          </div>
          {game.isGameOver() && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              animation: 'pulse 2s infinite',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif'
            }}>
              {game.isCheckmate() ? '👑 Checkmate!' : 
               game.isDraw() ? '🤝 Draw!' : 
               game.isStalemate() ? '🔒 Stalemate!' : '🏁 Game Over'}
            </div>
          )}
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          width: '100%'
        }}>
          <button 
            onClick={startGame}
            disabled={isGameActive || game.isGameOver()}
            className="animated-button"
            style={{
              padding: '18px 25px',
              fontSize: '19px',
              background: isGameActive || game.isGameOver() 
                ? 'linear-gradient(135deg, #666 0%, #555 100%)' 
                : 'linear-gradient(135deg, #4CAF50 0%, #45a049 50%, #4CAF50 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: isGameActive || game.isGameOver() ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: isGameActive || game.isGameOver()
                ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                : '0 8px 25px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundSize: '200% 100%',
              animation: isGameActive || game.isGameOver() ? 'none' : 'shimmer 3s ease-in-out infinite'
            }}
            onMouseEnter={(e) => {
              if (!isGameActive && !game.isGameOver()) {
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 12px 35px rgba(76, 175, 80, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGameActive && !game.isGameOver()) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }
            }}
          >
            {isGameActive ? '⚡ Game Running...' : '🚀 Start Game'}
          </button>
          
          <button 
            onClick={stopGame}
            disabled={!isGameActive}
            className="animated-button"
            style={{
              padding: '18px 25px',
              fontSize: '19px',
              background: !isGameActive 
                ? 'linear-gradient(135deg, #666 0%, #555 100%)' 
                : 'linear-gradient(135deg, #f44336 0%, #d32f2f 50%, #f44336 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: !isGameActive ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: !isGameActive
                ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                : '0 8px 25px rgba(244, 67, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundSize: '200% 100%'
            }}
            onMouseEnter={(e) => {
              if (isGameActive) {
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 12px 35px rgba(244, 67, 54, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (isGameActive) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 25px rgba(244, 67, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }
            }}
          >
            ⏹️ Stop Game
          </button>
          
          <button 
            onClick={resetGame}
            className="animated-button"
            style={{
              padding: '18px 25px',
              fontSize: '19px',
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 50%, #2196F3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundSize: '200% 100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)';
              e.target.style.boxShadow = '0 12px 35px rgba(33, 150, 243, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            🔄 Reset Game
          </button>
        </div>


      </div>

      {/* Center - Larger Chessboard */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)'
      }}>
        <div style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
          border: '4px solid #2c1810',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #3c2414 0%, #2c1810 100%)',
          padding: '12px',
          position: 'relative'
        }}>
          {/* Corner decorations */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            borderRadius: '16px',
            background: 'linear-gradient(45deg, #FFD700, transparent, #FFD700)',
            zIndex: -1,
            opacity: 0.3
          }} />
          
          <CustomChessBoard
            position={gamePosition}
            boardWidth={boardSize - 24}
            key={boardKey}
          />
        </div>
      </div>

      {/* Right Sidebar - Captured pieces and Commentary */}
      <div style={{
        width: '380px',
        minWidth: '380px',
        borderLeft: '3px solid #444',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Captured Pieces Section */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #444',
          flexShrink: 0
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            color: '#FFD700',
            fontSize: '1.2em',
            fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
            fontWeight: '600'
          }}>
            Captured Pieces
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{
              margin: '0 0 8px 0',
              color: '#cccccc',
              fontSize: '0.9em',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '500'
            }}>
              By Marvel (You)
            </h4>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
              {capturedDC.map((p, idx) => (
                <div key={`cb-${idx}`} style={{
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  <span style={{fontSize: '18px'}}>{p === 'p' ? '♟' : p === 'r' ? '♜' : p === 'n' ? '♞' : p === 'b' ? '♝' : p === 'q' ? '♛' : '♚'}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{
              margin: '0 0 8px 0',
              color: '#cccccc',
              fontSize: '0.9em',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '500'
            }}>
              By DC (Opponent)
            </h4>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
              {capturedMarvel.map((p, idx) => (
                <div key={`cw-${idx}`} style={{
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  <span style={{fontSize: '18px', color: '#fff'}}>{p === 'P' ? '♙' : p === 'R' ? '♖' : p === 'N' ? '♘' : p === 'B' ? '♗' : p === 'Q' ? '♕' : '♔'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commentary Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px 12px 20px',
            borderBottom: '1px solid #333',
            flexShrink: 0
          }}>
            <h3 style={{
              margin: 0,
              color: '#FFD700',
              fontSize: '1.2em',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '600'
            }}>
              Live Commentary 💬
            </h3>
          </div>
          
          <div 
            ref={commentaryRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 20px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
            {commentary.map((comment) => (
              <div key={comment.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: comment.player === 'marvel' ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}>
                <div style={{
                  maxWidth: '90%',
                  padding: '10px 14px',
                  borderRadius: comment.player === 'marvel' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: comment.player === 'system' 
                    ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
                    : comment.player === 'marvel'
                      ? 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)'
                      : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
                  fontWeight: '400',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  border: comment.player === 'system' ? '1px solid #666' : 'none',
                  wordWrap: 'break-word'
                }}>
                  {comment.message}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
                  fontWeight: '300',
                  alignSelf: comment.player === 'marvel' ? 'flex-end' : 'flex-start',
                  marginRight: comment.player === 'marvel' ? '8px' : '0',
                  marginLeft: comment.player !== 'marvel' ? '8px' : '0'
                }}>
                  {comment.player === 'system' ? 'System' : comment.player === 'marvel' ? 'You (Marvel)' : 'Opponent (DC)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winner Popup */}
      {showWinnerPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            background: winnerInfo.isDraw 
              ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)'
              : winnerInfo.winner === 'Marvel'
                ? 'linear-gradient(135deg, #E53E3E 0%, #C53030 50%, #9B2C2C 100%)'
                : 'linear-gradient(135deg, #2B6CB0 0%, #2C5282 50%, #2A4365 100%)',
            color: '#ffffff',
            padding: '60px 80px',
            borderRadius: '24px',
            textAlign: 'center',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(255, 215, 0, 0.3)',
            animation: 'popupSlideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            maxWidth: '500px',
            position: 'relative',
            overflow: 'hidden',
            border: winnerInfo.isDraw 
              ? '2px solid #718096'
              : winnerInfo.winner === 'Marvel'
                ? '2px solid #E53E3E'
                : '2px solid #2B6CB0'
          }}>
            {/* Confetti animation background */}
            {!winnerInfo.isDraw && (
              <div style={{
                position: 'absolute',
                top: '-100%',
                left: '-50%',
                right: '-50%',
                bottom: '-100%',
                background: `
                  radial-gradient(circle at 20% 80%, ${winnerInfo.winner === 'Marvel' ? '#E53E3E' : '#2B6CB0'} 2px, transparent 2px),
                  radial-gradient(circle at 80% 20%, ${winnerInfo.winner === 'Marvel' ? '#DC143C' : '#4682B4'} 2px, transparent 2px),
                  radial-gradient(circle at 40% 40%, ${winnerInfo.winner === 'Marvel' ? '#B91C1C' : '#1E40AF'} 2px, transparent 2px)
                `,
                backgroundSize: '50px 50px, 30px 30px, 40px 40px',
                animation: 'confetti 2s linear infinite',
                opacity: 0.3,
                zIndex: -1
              }} />
            )}
            
            <div style={{
              fontSize: '4em',
              marginBottom: '20px',
              animation: 'bounce 1s ease-in-out infinite alternate'
            }}>
              {winnerInfo.isDraw 
                ? '🤝' 
                : winnerInfo.winner === 'Marvel' 
                  ? '🦸‍♂️'
                  : '🦹‍♂️'
              }
            </div>
            
            <h1 style={{
              fontSize: '3em',
              margin: '0 0 15px 0',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '700',
              textShadow: winnerInfo.isDraw 
                ? '2px 2px 4px rgba(0, 0, 0, 0.5)'
                : '2px 2px 4px rgba(0, 0, 0, 0.3)',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              {winnerInfo.isDraw ? 'DRAW!' : `${winnerInfo.winner.toUpperCase()} WINS!`}
            </h1>
            
            <p style={{
              fontSize: '1.5em',
              margin: '0 0 40px 0',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '400',
              opacity: 0.9
            }}>
              {winnerInfo.reason}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowWinnerPopup(false)}
                className="animated-button"
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
              >
                Close
              </button>
              
              <button
                onClick={() => {
                  setShowWinnerPopup(false);
                  resetGame();
                }}
                className="animated-button"
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(76, 175, 80, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4)';
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleChessArena;