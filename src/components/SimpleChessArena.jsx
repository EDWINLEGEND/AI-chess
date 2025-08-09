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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2a2a2a',
      color: '#fff',
      padding: '20px'
    }}>
      <h1>Duh! Chess - AI vs AI</h1>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '10px' }}>{gameStatus}</h2>
        <p>Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
        <p>Move Count: {moveCount}</p>
        {game.isGameOver() && (
          <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
            {game.isCheckmate() ? 'Checkmate!' : 
             game.isDraw() ? 'Draw!' : 
             game.isStalemate() ? 'Stalemate!' : 'Game Over'}
          </p>
        )}
      </div>
      
      <div style={{
        width: '500px',
        height: '500px',
        margin: '20px',
        border: '2px solid #555',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <CustomChessBoard
          position={gamePosition}
          boardWidth={500}
          key={boardKey}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button 
          onClick={startGame}
          disabled={isGameActive || game.isGameOver()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isGameActive || game.isGameOver() ? '#666' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isGameActive || game.isGameOver() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
        >
          {isGameActive ? 'Game Running...' : 'Start Game'}
        </button>
        
        <button 
          onClick={stopGame}
          disabled={!isGameActive}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isGameActive ? '#666' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isGameActive ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
        >
          Stop Game
        </button>
        
        <button 
          onClick={resetGame}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
        >
          Reset Game
        </button>
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#ccc',
        maxWidth: '600px'
      }}>
        <p>✨ AI vs AI Chess Game ✨</p>
        <p>Press "Start Game" to watch two AI players battle it out!</p>
        <p>Each move takes 1.5 seconds with smooth animations.</p>
      </div>
    </div>
  );
};

export default SimpleChessArena;