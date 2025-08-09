// Simple Stockfish Worker Mock for Development
// This is a basic implementation for demonstration purposes
// In production, you would use the actual Stockfish WASM files

class StockfishWorker {
  constructor() {
    this.engineReady = false;
    this.currentMoves = [];
    this.bestMove = null;
    
    // Initialize engine
    setTimeout(() => {
      this.engineReady = true;
      self.postMessage('uciok');
    }, 100);
  }

  processCommand(command) {
    console.log('Engine received:', command);
    
    if (command === 'uci') {
      self.postMessage('id name Stockfish Dev Mock');
      self.postMessage('id author Duh! Chess');
      self.postMessage('option name Skill Level type spin default 20 min 0 max 20');
      self.postMessage('uciok');
    } else if (command === 'isready') {
      self.postMessage('readyok');
    } else if (command.startsWith('position')) {
      // Extract moves from position command
      if (command.includes('moves')) {
        const movesStr = command.split('moves')[1].trim();
        this.currentMoves = movesStr ? movesStr.split(' ') : [];
      } else {
        this.currentMoves = [];
      }
      console.log('Current moves:', this.currentMoves);
    } else if (command.startsWith('go')) {
      this.search();
    }
  }

  search() {
    // Simulate search time and pick appropriate moves based on game state
    setTimeout(() => {
      const moveCount = this.currentMoves.length;
      const isMarvelToMove = moveCount % 2 === 0;
      
      let bestMove;
      
      // Simple opening book and move selection
      if (moveCount === 0) {
        // Marvel's first move
        bestMove = ['e2e4', 'd2d4', 'g1f3', 'c2c4'][Math.floor(Math.random() * 4)];
      } else if (moveCount === 1) {
        // DC's first response
        const marvelMove = this.currentMoves[0];
        if (marvelMove === 'e2e4') {
          bestMove = ['e7e5', 'c7c5', 'e7e6', 'd7d6'][Math.floor(Math.random() * 4)];
        } else if (marvelMove === 'd2d4') {
          bestMove = ['d7d5', 'g8f6', 'e7e6', 'c7c6'][Math.floor(Math.random() * 4)];
        } else {
          bestMove = ['e7e5', 'd7d5', 'g8f6'][Math.floor(Math.random() * 3)];
        }
      } else {
        // Generate moves based on game phase
        if (isMarvelToMove) {
          bestMove = this.getMarvelMove(moveCount);
        } else {
          bestMove = this.getDCMove(moveCount);
        }
      }
      
      console.log('Engine suggesting move:', bestMove);
      self.postMessage(`info depth 1 score cp ${Math.floor(Math.random() * 200 - 100)} nodes 100 nps 1000 time 300`);
      self.postMessage(`bestmove ${bestMove}`);
    }, 300 + Math.random() * 500); // Random delay between 300-800ms
  }
  
  getMarvelMove(moveCount) {
    const earlyGame = ['g1f3', 'f1c4', 'e1g1', 'b1c3', 'd2d3', 'c2c3', 'h2h3'];
    const midGame = ['f3e5', 'c4d5', 'c3d5', 'f1e1', 'd1e2', 'a2a4', 'b2b3'];
    const endGame = ['e1e7', 'f3g5', 'c4f7', 'd5e6', 'e5f7'];
    
    if (moveCount < 10) {
      return earlyGame[Math.floor(Math.random() * earlyGame.length)];
    } else if (moveCount < 20) {
      return midGame[Math.floor(Math.random() * midGame.length)];
    } else {
      return endGame[Math.floor(Math.random() * endGame.length)];
    }
  }
  
  getDCMove(moveCount) {
    const earlyGame = ['g8f6', 'f8c5', 'e8g8', 'b8c6', 'd7d6', 'c7c6', 'h7h6'];
    const midGame = ['f6e4', 'c5d4', 'c6d4', 'f8e8', 'd8e7', 'a7a5', 'b7b6'];
    const endGame = ['e8e1', 'f6g4', 'c5f2', 'd4e3', 'e4f2'];
    
    if (moveCount < 10) {
      return earlyGame[Math.floor(Math.random() * earlyGame.length)];
    } else if (moveCount < 20) {
      return midGame[Math.floor(Math.random() * midGame.length)];
    } else {
      return endGame[Math.floor(Math.random() * endGame.length)];
    }
  }
}

// Worker message handler
if (typeof self !== 'undefined') {
  const engine = new StockfishWorker();
  
  self.onmessage = function(e) {
    engine.processCommand(e.data);
  };
}