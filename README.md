# Duh! Chess - AI vs AI Chess Game

A polished, responsive web application featuring AI vs AI chess battles powered by Stockfish engine, built with React and Vite.

## Features

### Core Functionality
- **AI vs AI Chess**: Watch two Stockfish engines battle each other
- **Real-time Game Updates**: See moves happen with smooth animations
- **Chess Rule Validation**: Full chess.js integration for proper game logic
- **Game Status Tracking**: Live updates on game progress and outcomes

### Visual Design
- **Modern Dark Theme**: Polished, eye-friendly dark interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: 500ms move animations with capture effects
- **Loading Screen**: Professional loading experience

### Audio Experience
- **Move Sounds**: Generated audio feedback for piece movements
- **Capture Sounds**: Distinct audio for piece captures
- **Dynamic Audio**: Uses Web Audio API for instant sound generation

### Technical Excellence
- **Stockfish Engine**: Mock implementation with plans for full WASM integration
- **Web Workers**: Non-blocking AI calculations
- **Deployment Ready**: Optimized build process for Netlify/Vercel
- **No CORS Issues**: All assets served locally

## Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI-chess
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Test the build locally
```

## Project Structure

```
AI-chess/
├── public/
│   ├── engine/
│   │   └── stockfish.js          # Stockfish worker implementation
│   ├── pieces/                   # Chess piece assets (white/black)
│   └── sounds/                   # Audio files
├── src/
│   ├── components/
│   │   ├── ChessArena.jsx        # Main game component
│   │   ├── ChessArena.css        # Game styling
│   │   ├── LoadingScreen.jsx     # Loading component
│   │   └── LoadingScreen.css     # Loading styling
│   ├── App.jsx                   # Root component
│   ├── App.css                   # Global styles
│   └── main.jsx                  # Entry point
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies
```

## How It Works

1. **Game Initialization**: Two Stockfish worker instances are created (white and black)
2. **AI vs AI Loop**: Engines alternate making moves with realistic delays
3. **Move Validation**: chess.js ensures all moves follow proper chess rules
4. **Visual Updates**: React state updates trigger board animations
5. **Audio Feedback**: Web Audio API generates move and capture sounds
6. **Game End Detection**: Automatic detection of checkmate, stalemate, or draws

## Customization

### Stockfish Engine
The current implementation uses a mock Stockfish engine for development. To integrate real Stockfish:

1. Download Stockfish WASM files to `/public/engine/`
2. Replace the mock worker with actual Stockfish.js
3. Update UCI command handling in ChessArena.jsx

### Styling
- Edit `src/components/ChessArena.css` for game appearance
- Modify `src/App.css` for global theming
- Update CSS variables for quick color scheme changes

### Game Logic
- Adjust AI thinking time in `ChessArena.jsx` (line ~150)
- Modify search depth for stronger/weaker play
- Add time controls or game variations

## Deployment

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist/` folder to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Vercel
1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push

### Self-Hosting
1. Build: `npm run build`
2. Serve the `dist/` folder with any static file server
3. Ensure proper MIME types for `.wasm` files if using real Stockfish

## Technical Decisions

### Why This Architecture?
- **React + Vite**: Fast development and modern build tooling
- **Web Workers**: Keep UI responsive during AI calculations
- **CSS-in-JS Alternative**: Custom CSS for better performance and control
- **Mock Engine**: Allows development without complex WASM setup

### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 14+
- **Mobile Support**: iOS 14+, Android Chrome 80+
- **Features Used**: Web Workers, Web Audio API, ES6+ JavaScript

## Future Enhancements

- [ ] Real Stockfish WASM integration
- [ ] Custom chess piece sets
- [ ] Game replay functionality
- [ ] Engine strength settings
- [ ] Multiple chess variants
- [ ] Tournament mode
- [ ] Opening book integration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test the build: `npm run build`
5. Submit a pull request

## License

This project is open source. Chess engine Stockfish is licensed under GPL v3.

## Credits

- **Stockfish Team**: Chess engine
- **chess.js**: Chess logic library
- **react-chessboard**: Board component
- **Vite Team**: Build tooling
- **React Team**: UI framework

---

**Duh! Chess** - Because watching AIs play chess is surprisingly entertaining!