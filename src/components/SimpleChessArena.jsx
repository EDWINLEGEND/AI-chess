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
  const [capturedWhite, setCapturedWhite] = useState([]); // black captured white pieces
  const [capturedBlack, setCapturedBlack] = useState([]); // white captured black pieces
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState({ winner: '', reason: '', isDraw: false });
  
  const gameRef = useRef(game);
  const timeoutRef = useRef(null);
  const shouldContinueRef = useRef(false);

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
        // Track captured pieces to display on the right side
        if (moveResult.captured) {
          const capturedCode = moveResult.captured; // p,r,n,b,q,k (lowercase from chess.js)
          if (moveResult.color === 'w') {
            // white moved; captured black piece
            setCapturedBlack(prev => [...prev, capturedCode]);
          } else {
            setCapturedWhite(prev => [...prev, capturedCode.toUpperCase()]);
          }
        }
        const newPosition = newGame.fen();
        const currentTurn = newGame.turn() === 'w' ? 'White' : 'Black';
        
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
            winner = newGame.turn() === 'w' ? 'Black' : 'White';
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
    setCapturedWhite([]);
    setCapturedBlack([]);
    setShowWinnerPopup(false);
    setWinnerInfo({ winner: '', reason: '', isDraw: false });
    
    console.log('Reset to starting position:', startPosition);
  };

  // Debug effect to track position changes
  useEffect(() => {
    console.log('Position changed to:', gamePosition);
    console.log('Board key is:', boardKey);
  }, [gamePosition, boardKey]);

  console.log('SimpleChessArena rendering, position:', gamePosition);

  // Calculate board size based on screen dimensions (larger without right sidebar)
  const getOptimalBoardSize = () => {
    const availableWidth = window.innerWidth - 320; // Subtract left sidebar width
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
            <p><strong>Turn:</strong> {game.turn() === 'w' ? '⚪ White' : '⚫ Black'}</p>
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

      {/* Right Sidebar - Captured pieces */}
      <div style={{
        width: '260px',
        padding: '20px',
        borderLeft: '3px solid #444',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>
          <h3 style={{margin: 0, marginBottom: '8px'}}>Captured by White</h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {capturedBlack.map((p, idx) => (
              <div key={`cb-${idx}`} style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111', border: '1px solid #333', borderRadius: '6px'
              }}>
                <span style={{fontSize: '22px'}}>{p === 'p' ? '♟' : p === 'r' ? '♜' : p === 'n' ? '♞' : p === 'b' ? '♝' : p === 'q' ? '♛' : '♚'}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{margin: 0, marginBottom: '8px'}}>Captured by Black</h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {capturedWhite.map((p, idx) => (
              <div key={`cw-${idx}`} style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111', border: '1px solid #333', borderRadius: '6px'
              }}>
                <span style={{fontSize: '22px', color: '#fff'}}>{p === 'P' ? '♙' : p === 'R' ? '♖' : p === 'N' ? '♘' : p === 'B' ? '♗' : p === 'Q' ? '♕' : '♔'}</span>
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
              : winnerInfo.winner === 'White'
                ? 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 50%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #2d3748 0%, #1a202c 50%, #000000 100%)',
            color: winnerInfo.isDraw 
              ? '#ffffff'
              : winnerInfo.winner === 'White'
                ? '#000000'
                : '#ffffff',
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
              : winnerInfo.winner === 'White'
                ? '2px solid #000000'
                : '2px solid #ffffff'
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
                  radial-gradient(circle at 20% 80%, ${winnerInfo.winner === 'White' ? '#FFD700' : '#C0C0C0'} 2px, transparent 2px),
                  radial-gradient(circle at 80% 20%, ${winnerInfo.winner === 'White' ? '#FFA500' : '#708090'} 2px, transparent 2px),
                  radial-gradient(circle at 40% 40%, ${winnerInfo.winner === 'White' ? '#FF6347' : '#4682B4'} 2px, transparent 2px)
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
                : winnerInfo.winner === 'White' 
                  ? '👑'
                  : '♛'
              }
            </div>
            
            <h1 style={{
              fontSize: '3em',
              margin: '0 0 15px 0',
              fontFamily: '"Clash Display Variable", "Clash Display", sans-serif',
              fontWeight: '700',
              textShadow: winnerInfo.isDraw 
                ? '2px 2px 4px rgba(0, 0, 0, 0.5)'
                : winnerInfo.winner === 'White'
                  ? '2px 2px 4px rgba(0, 0, 0, 0.3)'
                  : '2px 2px 4px rgba(255, 255, 255, 0.3)',
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