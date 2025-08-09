import React, { useState, useEffect } from 'react'
import LoadingScreen from './components/LoadingScreen'
import ChessArena from './components/ChessArena'
import SimpleChessArena from './components/SimpleChessArena'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('App component mounted, starting loading timer...')
    // Simulate loading time for engines and assets
    const timer = setTimeout(() => {
      console.log('Loading complete, switching to ChessArena')
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  console.log('App rendering, isLoading:', isLoading)

  return (
    <div className="app">
      <ErrorBoundary>
        {isLoading ? <LoadingScreen /> : <SimpleChessArena />}
      </ErrorBoundary>
    </div>
  )
}

export default App
