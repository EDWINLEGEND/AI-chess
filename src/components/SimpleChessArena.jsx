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
          if (newGame.isCheckmate()) {
            const winner = newGame.turn() === 'w' ? 'Black' : 'White';
            endStatus += `${winner} wins by checkmate!`;
          } else if (newGame.isDraw()) {
            endStatus += 'Draw!';
          } else if (newGame.isStalemate()) {
            endStatus += 'Stalemate!';
          } else if (newGame.isThreefoldRepetition()) {
            endStatus += 'Draw by threefold repetition!';
          } else if (newGame.isInsufficientMaterial()) {
            endStatus += 'Draw by insufficient material!';
          }
          setGameStatus(endStatus);
          setIsGameActive(false);
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
    
    console.log('Reset to starting position:', startPosition);
  };

  // Debug effect to track position changes
  useEffect(() => {
    console.log('Position changed to:', gamePosition);
    console.log('Board key is:', boardKey);
  }, [gamePosition, boardKey]);

  console.log('SimpleChessArena rendering, position:', gamePosition);

  // Calculate board size based on screen dimensions
  const getOptimalBoardSize = () => {
    const minDimension = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.9);
    return Math.max(400, Math.min(700, minDimension));
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
        width: '300px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        borderRight: '2px solid #444'
      }}>
        <h1 style={{ 
          fontSize: '2.5em', 
          marginBottom: '30px', 
          textAlign: 'center',
          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Duh! Chess
        </h1>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#333',
          borderRadius: '12px',
          border: '1px solid #555',
          width: '100%'
        }}>
          <h2 style={{ 
            color: '#4CAF50', 
            marginBottom: '15px',
            fontSize: '1.4em'
          }}>
            {gameStatus}
          </h2>
          <div style={{ fontSize: '1.1em', lineHeight: '1.6' }}>
            <p><strong>Turn:</strong> {game.turn() === 'w' ? '⚪ White' : '⚫ Black'}</p>
            <p><strong>Move:</strong> #{moveCount}</p>
            <p><strong>Available:</strong> {game.moves().length} moves</p>
          </div>
          {game.isGameOver() && (
            <div style={{ 
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#ff6b6b',
              borderRadius: '6px',
              color: 'white',
              fontWeight: 'bold'
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
          gap: '15px',
          width: '100%'
        }}>
          <button 
            onClick={startGame}
            disabled={isGameActive || game.isGameOver()}
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              backgroundColor: isGameActive || game.isGameOver() ? '#666' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isGameActive || game.isGameOver() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              width: '100%'
            }}
          >
            {isGameActive ? '⚡ Game Running...' : '🚀 Start Game'}
          </button>
          
          <button 
            onClick={stopGame}
            disabled={!isGameActive}
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              backgroundColor: !isGameActive ? '#666' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: !isGameActive ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              width: '100%'
            }}
          >
            ⏹️ Stop Game
          </button>
          
          <button 
            onClick={resetGame}
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              width: '100%'
            }}
          >
            🔄 Reset Game
          </button>
        </div>
      </div>

      {/* Center - Chessboard */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          width: `${boardSize}px`,
          height: `${boardSize}px`,
          border: '3px solid #8b4513',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
          padding: '8px'
        }}>
          <CustomChessBoard
            position={gamePosition}
            boardWidth={boardSize - 16}
            key={boardKey}
          />
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div style={{
        width: '300px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(225deg, #1a1a1a 0%, #2a2a2a 100%)',
        borderLeft: '2px solid #444'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#333',
          borderRadius: '12px',
          border: '1px solid #555',
          width: '100%',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            color: '#FFD700', 
            marginBottom: '20px',
            fontSize: '1.3em'
          }}>
            ✨ Game Info
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#ccc' }}>
            <p>🤖 <strong>AI vs AI</strong> Chess Battle</p>
            <p>⏱️ <strong>1.5s</strong> per move animation</p>
            <p>🎯 <strong>Automatic</strong> gameplay</p>
            <p>🎨 <strong>Smooth</strong> piece transitions</p>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#333',
          borderRadius: '12px',
          border: '1px solid #555',
          width: '100%'
        }}>
          <h3 style={{ 
            color: '#FF6B6B', 
            marginBottom: '15px',
            fontSize: '1.2em'
          }}>
            🎮 Controls
          </h3>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#ddd' }}>
            <p><strong>Start:</strong> Begin AI battle</p>
            <p><strong>Stop:</strong> Pause the game</p>
            <p><strong>Reset:</strong> New game setup</p>
            <p style={{ marginTop: '15px', color: '#4CAF50' }}>
              Sit back and enjoy the show! 🍿
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChessArena;