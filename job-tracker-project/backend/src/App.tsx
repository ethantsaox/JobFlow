import React, { useState, useEffect } from 'react';
import MemoryGame from './components/MemoryGame';
import QuizGame from './components/QuizGame';
import JigsawGame from './components/JigsawGame';
import VirtualCard from './components/VirtualCard';
import ProgressBar from './components/ProgressBar';
import PetalAnimation from './components/PetalAnimation';
import './App.css';

type GameStage = 'memory' | 'quiz' | 'jigsaw' | 'card' | 'welcome';

function App() {
  const [currentStage, setCurrentStage] = useState<GameStage>('welcome');
  const [showPetals, setShowPetals] = useState(false);
  const [gameScores, setGameScores] = useState({
    memory: 0,
    quiz: 0,
    jigsaw: 0
  });

  const handleStageComplete = (stage: GameStage, score?: number) => {
    if (score !== undefined) {
      setGameScores(prev => ({ ...prev, [stage]: score }));
    }
    
    setShowPetals(true);
    setTimeout(() => {
      setShowPetals(false);
      if (stage === 'memory') setCurrentStage('quiz');
      else if (stage === 'quiz') setCurrentStage('jigsaw');
      else if (stage === 'jigsaw') setCurrentStage('card');
    }, 2000);
  };

  const renderWelcomeScreen = () => (
    <div className="min-h-screen flex items-center justify-center p-4 cursor-cat">
      <div className="text-center max-w-2xl">
        <div className="mb-8 float-animation">
          <div className="text-8xl mb-4">🐱</div>
          <h1 className="text-6xl font-script text-matcha-600 mb-4">
            Lucy's Game
          </h1>
          <div className="text-2xl text-tulip-500 mb-2">🌷 Happy National Girlfriend Day! 🌷</div>
          <p className="text-lg text-spanish-600 mb-8 font-cute">
            Three personalized games designed just for you, mi amor ✨
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-semibold text-matcha-700">Memory Match</h3>
            <p className="text-sm text-gray-600">Match your favorite things!</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl mb-3">💕</div>
            <h3 className="font-semibold text-tulip-700">About Us Quiz</h3>
            <p className="text-sm text-gray-600">Test our connection!</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl mb-3">🧩</div>
            <h3 className="font-semibold text-spanish-700">Tulip Puzzle</h3>
            <p className="text-sm text-gray-600">Beautiful tulip fields!</p>
          </div>
        </div>
        
        <button
          onClick={() => setCurrentStage('memory')}
          className="bg-gradient-to-r from-matcha-500 to-tulip-500 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-matcha-600 hover:to-tulip-600 transform hover:scale-105 transition-all shadow-lg"
        >
          Let's Play! 🎮
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          Made with 💚 for the most amazing girl who loves matcha, cats, and Madrid adventures
        </div>
      </div>
    </div>
  );

  return (
    <div className="App min-h-screen relative overflow-hidden">
      {showPetals && <PetalAnimation />}
      
      {currentStage !== 'welcome' && currentStage !== 'card' && (
        <ProgressBar currentStage={currentStage} />
      )}
      
      {currentStage === 'welcome' && renderWelcomeScreen()}
      {currentStage === 'memory' && <MemoryGame onComplete={(score) => handleStageComplete('memory', score)} />}
      {currentStage === 'quiz' && <QuizGame onComplete={(score) => handleStageComplete('quiz', score)} />}
      {currentStage === 'jigsaw' && <JigsawGame onComplete={(score) => handleStageComplete('jigsaw', score)} />}
      {currentStage === 'card' && <VirtualCard gameScores={gameScores} />}
    </div>
  );
}

export default App;