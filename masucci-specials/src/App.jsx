import { useState, useRef, useEffect } from "react";
import GuessInput from "./components/GuessInput";
import GuessList from "./components/GuessList";
import { songs } from "./data/songs";

export default function App() {
  const [currentSong, setCurrentSong] = useState(songs[0]);
  const [guesses, setGuesses] = useState([]);
  const [revealStep, setRevealStep] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  const revealTimes = [1, 3, 7, 12, 20, 30]; // seconds allowed per step
  const maxSteps = revealTimes.length - 1;

  const correctAnswer = `${currentSong.title} - ${currentSong.artist}`;

  // Play preview but stop at revealTimes[revealStep]
  const playPreview = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();

      const stopAt = revealTimes[revealStep];
      const checkTime = setInterval(() => {
        if (audioRef.current.currentTime >= stopAt) {
          audioRef.current.pause();
          clearInterval(checkTime);
        }
      }, 100);
    }
  };

  // Handle time updates for progress bar
  useEffect(() => {
    const audio = audioRef.current;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentSong]);

  // Seek function to handle user scrubbing on the progress bar
  const handleSeek = (e) => {
    const seekPercent = e.target.value;
    const allowedMax = revealTimes[revealStep];
    const seekTime = (seekPercent / 100) * allowedMax;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Guess handling etc. (same as before)
  const handleGuess = (guess) => {
    const isCorrect = guess.toLowerCase() === correctAnswer.toLowerCase();
    setGuesses([...guesses, guess]);

    if (isCorrect) {
      setGameWon(true);
    } else if (revealStep >= maxSteps) {
      setGameOver(true);
    } else {
      setRevealStep(revealStep + 1);
    }
  };

  const handleSkip = () => {
    if (revealStep >= maxSteps) {
      setGameOver(true);
    } else {
      setRevealStep(revealStep + 1);
    }
  };

  const restartGame = () => {
    setCurrentSong(songs[Math.floor(Math.random() * songs.length)]);
    setGuesses([]);
    setRevealStep(0);
    setGameWon(false);
    setGameOver(false);
    setCurrentTime(0);
  };

  // Format mm:ss for display
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">🎵 The Masucci Heardle Special 🎵</h1>

      {(gameWon || gameOver) ? (
        <div className="text-center space-y-4">
          {gameWon && <h2 className="text-green-400 text-2xl">🎉 Correct! 🎉</h2>}
          {gameOver && !gameWon && (
            <>
              <h2 className="text-red-400 text-2xl">❌ Out of tries!</h2>
              <p className="text-gray-300">The song was: {correctAnswer}</p>
            </>
          )}
          <button
            onClick={restartGame}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <audio ref={audioRef} src={currentSong.previewUrl} preload="auto" />

          {/* Controls */}
          <div className="space-x-2 mt-4">
            <button
              onClick={playPreview}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
            >
              ▶ Play {revealTimes[revealStep]}s
            </button>
            <button
              onClick={handleSkip}
              className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded"
            >
              Skip
            </button>
          </div>

          <GuessInput songs={songs} onGuess={handleGuess} />
          <GuessList guesses={guesses} correctAnswer={correctAnswer} />

          {/* Progress Bar */}
          <div className="w-full max-w-md mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / revealTimes[revealStep]) * 100 : 0}
                onChange={handleSeek}
                className="w-full accent-green-500"
                step="0.1"
              />
              <span>{formatTime(revealTimes[revealStep])}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
