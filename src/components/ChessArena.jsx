import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './ChessArena.css';

const ChessArena = () => {
  console.log('ChessArena component rendering...');
  
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameStatus, setGameStatus] = useState('Click Start to begin AI vs AI game');
  const [currentPlayer, setCurrentPlayer] = useState('White');
  const [moveHistory, setMoveHistory] = useState([]);
  // Move highlight squares in algebraic notation, e.g., 'e2' and 'e4'
  const [highlightFrom, setHighlightFrom] = useState(null);
  const [highlightTo, setHighlightTo] = useState(null);

  // Keep animation duration in sync with highlight lifecycle
  const MOVE_ANIMATION_MS = 1500;
  
  const whiteEngineRef = useRef(null);
  const blackEngineRef = useRef(null);
  const gameRef = useRef(game);
  
  // Audio context for sound effects
  const audioContextRef = useRef(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Play sound effect
  const playSound = useCallback((type) => {
    initAudio();
    const audioContext = audioContextRef.current;
    
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different sounds
      if (type === 'move') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      } else if (type === 'capture') {
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [initAudio]);

  // Initialize Stockfish engines
  useEffect(() => {
    console.log('ChessArena component mounted, initializing engines...');
    
    const initEngines = async () => {
      try {
        console.log('Creating workers...');
        // Create workers for both engines
        whiteEngineRef.current = new Worker('/engine/stockfish.js');
        blackEngineRef.current = new Worker('/engine/stockfish.js');

        console.log('Setting up message handlers...');
        // Setup white engine
        whiteEngineRef.current.onmessage = (event) => {
          handleEngineMessage(event.data, 'white');
        };

        // Setup black engine
        blackEngineRef.current.onmessage = (event) => {
          handleEngineMessage(event.data, 'black');
        };

        // Setup error handlers
        whiteEngineRef.current.onerror = (error) => {
          console.error('White engine error:', error);
          setGameStatus('White engine failed to load. Please refresh.');
        };

        blackEngineRef.current.onerror = (error) => {
          console.error('Black engine error:', error);
          setGameStatus('Black engine failed to load. Please refresh.');
        };

        console.log('Initializing engines with UCI...');
        // Initialize engines
        whiteEngineRef.current.postMessage('uci');
        blackEngineRef.current.postMessage('uci');
        
        setGameStatus('Engines loaded! Click Start to begin');
        console.log('Engines initialized successfully');
      } catch (error) {
        console.error('Failed to initialize engines:', error);
        setGameStatus('Error loading engines. Please refresh and try again.');
      }
    };

    initEngines();

    // Cleanup
    return () => {
      console.log('Cleaning up engines...');
      if (whiteEngineRef.current) whiteEngineRef.current.terminate();
      if (blackEngineRef.current) blackEngineRef.current.terminate();
    };
  }, [handleEngineMessage]);

  // Handle engine messages
  const handleEngineMessage = useCallback((message, engine) => {
    console.log(`${engine} engine says:`, message);
    if (message.startsWith('bestmove')) {
      const move = message.split(' ')[1];
      console.log(`${engine} wants to play:`, move);
      if (move && move !== '(none)') {
        makeEngineMove(move, engine);
      }
    }
  }, [makeEngineMove]);

  // Make a move from the engine
  const makeEngineMove = useCallback((moveString, engine) => {
    const currentGame = gameRef.current;
    
    console.log(`makeEngineMove called: ${engine} wants to play ${moveString}`);
    console.log(`Game active: ${isGameActive}, Game over: ${currentGame.isGameOver()}`);
    
    if (!isGameActive || currentGame.isGameOver()) {
      console.log('Rejecting move: game not active or game over');
      return;
    }

    // Check if it's the right engine's turn
    const isWhiteTurn = currentGame.turn() === 'w';
    const expectedEngine = isWhiteTurn ? 'white' : 'black';
    console.log(`Current turn: ${isWhiteTurn ? 'White' : 'Black'}, Engine: ${engine}, Expected: ${expectedEngine}`);
    
    if ((isWhiteTurn && engine !== 'white') || (!isWhiteTurn && engine !== 'black')) {
      console.log('Rejecting move: wrong engine turn');
      return;
    }

    try {
      // Attempt to make the move
      console.log(`Attempting to make move: ${moveString}`);
      const moveObject = currentGame.move(moveString);
      
      if (moveObject) {
        console.log(`Move successful! ${moveObject.san}`);
        // Play sound effect
        playSound(moveObject.captured ? 'capture' : 'move');
        // Set highlights for the moving piece during animation
        try {
          // chess.js moveObject has `from` and `to` squares like 'e2', 'e4'
          setHighlightFrom(moveObject.from);
          setHighlightTo(moveObject.to);
          // Clear after animation completes
          setTimeout(() => {
            setHighlightFrom(null);
            setHighlightTo(null);
          }, MOVE_ANIMATION_MS);
        } catch (_) {}
        
        // Update game state
        setGamePosition(currentGame.fen());
        setCurrentPlayer(currentGame.turn() === 'w' ? 'White' : 'Black');
        setMoveHistory(prev => [...prev, moveObject]);
        
        // Check if game is over
        if (currentGame.isGameOver()) {
          let status = 'Game Over - ';
          if (currentGame.isCheckmate()) {
            status += `${currentGame.turn() === 'w' ? 'Black' : 'White'} wins by checkmate!`;
          } else if (currentGame.isDraw()) {
            status += 'Draw!';
          }
          setGameStatus(status);
          setIsGameActive(false);
          return;
        }

        // Request next move from the other engine
        setTimeout(() => {
          if (isGameActive) {
            requestEngineMove();
          }
        }, 500); // Small delay for realism
      }
    } catch (error) {
      console.error('Invalid move from engine:', moveString, error);
      // Request a new move if the engine made an invalid move
      setTimeout(() => {
        if (isGameActive) {
          requestEngineMove();
        }
      }, 100);
    }
  }, [isGameActive, playSound]);

  // Request move from current engine
  const requestEngineMove = useCallback(() => {
    const currentGame = gameRef.current;
    const isWhiteTurn = currentGame.turn() === 'w';
    const engine = isWhiteTurn ? whiteEngineRef.current : blackEngineRef.current;
    const playerName = isWhiteTurn ? 'White' : 'Black';
    
    console.log(`Requesting move from ${playerName}, isGameActive: ${isGameActive}`);
    
    if (engine && isGameActive && !currentGame.isGameOver()) {
      // Send position to engine
      const moves = currentGame.history();
      const positionCommand = moves.length > 0 
        ? `position startpos moves ${moves.join(' ')}`
        : 'position startpos';
      
      console.log(`Sending to ${playerName}:`, positionCommand);
      engine.postMessage(positionCommand);
      engine.postMessage('go depth 5'); // Limit depth for faster moves
    } else {
      console.log(`Cannot request move: engine=${!!engine}, isGameActive=${isGameActive}, gameOver=${currentGame.isGameOver()}`);
    }
  }, [isGameActive]);

  // Start new game
  const startGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    gameRef.current = newGame;
    setGamePosition(newGame.fen());
    setIsGameActive(true);
    setGameStatus('Game in progress...');
    setCurrentPlayer('White');
    setMoveHistory([]);
    
    // Start with white's move
    setTimeout(() => {
      requestEngineMove();
    }, 1000);
  }, [requestEngineMove]);

  // Restart game
  const restartGame = useCallback(() => {
    setIsGameActive(false);
    setTimeout(() => {
      startGame();
    }, 100);
  }, [startGame]);

  console.log('Rendering ChessArena with status:', gameStatus);

  return (
    <div className="chess-arena">
      {/* Game Status */}
      <div className="game-status">
        <h1 className="game-title">Duh! Chess - AI vs AI</h1>
        <p className="status-text">{gameStatus}</p>
        <p className="turn-text">Current Turn: {currentPlayer}</p>
      </div>

      {/* Chessboard */}
      <div className="chessboard-container">
        <Chessboard
          position={gamePosition}
          arePiecesDraggable={false}
          boardWidth={600}
          animationDuration={MOVE_ANIMATION_MS}
          customBoardStyle={{
            borderRadius: '8px',
          }}
          customSquareStyles={{
            ...(highlightFrom ? {
              [highlightFrom]: {
                boxShadow: '0 0 0 4px rgba(255, 215, 0, 0.6), 0 0 18px 6px rgba(255, 215, 0, 0.6)',
                animation: 'squarePulseGold 1.5s ease-in-out',
              }
            } : {}),
            ...(highlightTo ? {
              [highlightTo]: {
                boxShadow: '0 0 0 4px rgba(0, 255, 128, 0.6), 0 0 18px 6px rgba(0, 255, 128, 0.6)',
                animation: 'squarePulseGreen 1.5s ease-in-out',
              }
            } : {})
          }}
        />
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={startGame}
          disabled={isGameActive}
          className={`btn btn-primary ${isGameActive ? 'disabled' : ''}`}
        >
          Start Game
        </button>
        <button
          onClick={restartGame}
          className="btn btn-secondary"
        >
          Restart
        </button>
      </div>

      {/* Move History */}
      {moveHistory.length > 0 && (
        <div className="move-history">
          <p className="history-text">
            Move History: {moveHistory.map(move => move.san).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChessArena;