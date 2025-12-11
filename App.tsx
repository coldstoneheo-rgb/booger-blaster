import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import GameOverlay from './components/GameOverlay';
import { GameState } from './types';
import { getGameCommentary } from './services/geminiService';
import { Github } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [commentary, setCommentary] = useState("");
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('booger-blaster-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setCommentary("");
  };

  const handleGameOver = async () => {
    setGameState(GameState.GAME_OVER);
    
    // Save High Score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('booger-blaster-highscore', score.toString());
    }

    // Get AI Commentary
    setIsLoadingCommentary(true);
    const comment = await getGameCommentary(score);
    setCommentary(comment);
    setIsLoadingCommentary(false);
  };

  return (
    <div className="relative w-full h-screen bg-sky-200 overflow-hidden flex flex-col items-center justify-center">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-yellow-200 rounded-full blur-3xl"></div>
      </div>

      {/* Game Container - Maintains Aspect Ratio on Desktop, Full on Mobile */}
      <div className="relative w-full h-full max-w-[800px] max-h-[600px] bg-white shadow-2xl sm:rounded-3xl overflow-hidden border-8 border-white/50 ring-4 ring-black/5">
        
        {/* Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-sky-50 z-0"></div>
        
        {/* Grass at bottom */}
        <div className="absolute bottom-0 w-full h-16 bg-green-400 z-0 rounded-b-xl"></div>
        <div className="absolute bottom-10 w-full h-12 bg-green-300 z-0 rounded-t-full scale-110"></div>

        <GameCanvas 
          gameState={gameState}
          onScoreUpdate={setScore}
          onTimeUpdate={setTimeLeft}
          onGameOver={handleGameOver}
        />
        
        <GameOverlay 
          gameState={gameState}
          score={score}
          highScore={highScore}
          timeLeft={timeLeft}
          onStart={handleStartGame}
          commentary={commentary}
          isLoadingCommentary={isLoadingCommentary}
        />
      </div>

      <div className="absolute bottom-4 text-sky-800/50 text-sm font-medium flex items-center gap-2">
         <span>Powered by Gemini API</span>
      </div>
    </div>
  );
};

export default App;