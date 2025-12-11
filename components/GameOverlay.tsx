import React from 'react';
import { GameState } from '../types';
import { Play, RotateCcw, Trophy, Brain } from 'lucide-react';

interface GameOverlayProps {
  gameState: GameState;
  score: number;
  highScore: number;
  timeLeft: number;
  onStart: () => void;
  commentary: string;
  isLoadingCommentary: boolean;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  gameState, 
  score, 
  highScore, 
  timeLeft, 
  onStart, 
  commentary,
  isLoadingCommentary
}) => {
  // HUD (Heads-Up Display)
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg border-2 border-slate-200">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Score</span>
            <div className="text-3xl font-black text-slate-800">{score.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className={`bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg border-2 ${timeLeft < 5 ? 'border-red-400 text-red-500 animate-pulse' : 'border-slate-200 text-slate-800'}`}>
            <span className="text-xs font-bold uppercase tracking-wider block text-right">Time</span>
            <div className="text-3xl font-black">{Math.ceil(timeLeft)}s</div>
          </div>
        </div>
      </div>
    );
  }

  // Main Menu
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-sky-100/80 backdrop-blur-sm z-10">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-white transform hover:scale-[1.02] transition-transform duration-300">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <span className="text-6xl animate-bounce">👃</span>
          </div>
          <h1 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Booger<br/><span className="text-green-500">Blaster</span></h1>
          <p className="text-slate-500 mb-8 font-medium">Flick boogers, squash bugs, save the world (maybe).</p>
          
          <button 
            onClick={onStart}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-3 group"
          >
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" />
            Game Start
          </button>
          
          {highScore > 0 && (
             <div className="mt-6 flex items-center justify-center gap-2 text-yellow-500 font-bold">
               <Trophy className="w-5 h-5" />
               High Score: {highScore.toLocaleString()}
             </div>
          )}
        </div>
      </div>
    );
  }

  // Game Over
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-10 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center border-4 border-white animate-in zoom-in duration-300">
          <h2 className="text-4xl font-black text-slate-800 mb-2">Time's Up!</h2>
          <div className="text-6xl font-black text-green-500 mb-6 drop-shadow-sm">{score.toLocaleString()}</div>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold">
               <Brain className="w-5 h-5" />
               <span>AI Analysis</span>
            </div>
            {isLoadingCommentary ? (
               <div className="flex gap-2 items-center text-slate-400 py-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 <span className="text-sm">Analyzing booger trajectory...</span>
               </div>
            ) : (
               <p className="text-slate-600 leading-relaxed font-medium">
                 {commentary}
               </p>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onStart}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3 px-6 rounded-xl shadow-lg shadow-green-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameOverlay;