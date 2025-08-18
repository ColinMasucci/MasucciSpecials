import { useState, useEffect, useRef } from "react";
import { joinGame, subscribeToSong, submitGuess } from "./playerLogic";
import { supabase } from './supabaseClient';
import { fetchSpotifySuggestions } from "./api";


function validateGuess(guess, currentSong) {
  if (!currentSong) return { correct: false, type: null };

  const normalizedGuess = guess.trim().toLowerCase();
  const correctTrack = currentSong.trackName.toLowerCase();
  const correctArtist = currentSong.artistName.toLowerCase();

  const isTrackCorrect = normalizedGuess.includes(correctTrack);
  const isArtistCorrect = normalizedGuess.includes(correctArtist);

  return {
    correct: isTrackCorrect || isArtistCorrect,
    type: isTrackCorrect && isArtistCorrect ? "full" : isArtistCorrect ? "artist" : null
  };
}

function calculatePoints(type, startTime) {
  const elapsedSeconds = (Date.now() - startTime) / 1000;

  if (type === "full") {
    // Full points decrease over time (e.g., max 25, min 5)
    return Math.max(5, Math.round(25 - elapsedSeconds / 2));
  } else if (type === "artist") {
    // Artist only (max 10, min 2)
    return Math.max(2, Math.round(10 - elapsedSeconds / 5));
  }
  return 0;
}


function Player() {
  const [gameId, setGameId] = useState(""); // Game code the player enters
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [guess, setGuess] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [score, setScore] = useState(0);
  const [token, setToken] = useState(null); // Spotify access token
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [startTime, setStartTime] = useState(null);



  // Join lobby
  const handleJoin = async () => {
    if (!gameId || !playerName) {
        return alert("Enter both a name and game code");
    }

    try {
        console.log("Attempting to join game:", gameId, "as player:", playerName);

        // 1. Join the game
        const player = await joinGame(gameId, playerName);
        if (!player || !player.id) throw new Error("Failed to create player entry");
        setPlayerId(player.id);
        console.log("Joined as player:", player);

        // 2. Fetch the Host's Spotify token
        const { data, error } = await supabase
        .from('games')
        .select('spotify_token')
        .eq('id', gameId)
        .single();

        if (error) throw new Error("Failed to fetch Spotify token: " + error.message);
        if (!data || !data.spotify_token) throw new Error("No Spotify token found for this game");

        setToken(data.spotify_token);
        console.log("Received Host Spotify token:", data.spotify_token);

        // 3. Subscribe to song updates
        subscribeToSong(gameId, (songUri) => {
        console.log("Received song update:", songUri);
        setCurrentSong(songUri);
        });

        // 4. Optionally, indicate player has successfully joined
        console.log("Player successfully joined and listening for updates!");

    } catch (err) {
        console.error(err);
        alert("Failed to join game: " + err.message);
    }
  };

  useEffect(() => {
    if (!currentSong) return;

    setHasGuessedCorrectly(false);
    setStartTime(Date.now()); // start the timer
  }, [currentSong]);


  const handleSubmitGuess = async () => {
  if (!guess || !playerId || !gameId || hasGuessedCorrectly) return;

  const { correct, type } = validateGuess(guess, currentSong);
    if (!correct) {
        alert("Incorrect! Try again.");
        return;
    }

    const points = calculatePoints(type, startTime);
    setScore(prev => prev + points);
    setHasGuessedCorrectly(true);

    await submitGuess(playerId, gameId, guess); // record it in database if needed
    setGuess("");
    setSuggestions([]);

    alert(`Correct! You earned ${points} points.`);
  };


  useEffect(() => {
    if (!guess || !token) return setSuggestions([]);

    const handler = setTimeout(async () => {
        const results = await fetchSpotifySuggestions(guess, token);
        setSuggestions(results);
    }, 300); // wait 300ms after user stops typing

    return () => clearTimeout(handler);
  }, [guess, token]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-blue-900 p-4">
      {/* Title */}
      <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2 text-center">
        🎵 The Masucci Heardle Special 🎵
      </h1>

      {/* Game ID display */}
      {gameId && (
        <p className="text-gray-300 text-sm mb-4 self-end">
          Lobby ID: {gameId}
        </p>
      )}

      {/* Join game section */}
      {!playerId && (
        <div className="flex flex-col w-full max-w-md gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="p-2 rounded text-black"
          />
          <input
            type="text"
            placeholder="Enter game code"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="p-2 rounded text-black"
          />
          <button
            onClick={handleJoin}
            className="bg-green-500 text-white p-2 rounded font-bold"
          >
            Join Game
          </button>
        </div>
      )}

      {/* Current Song */}
      {playerId && (
        <div className="flex flex-col w-full max-w-md bg-gray-900 rounded p-4 gap-2">
          <p className="text-white text-sm">Current song is playing...</p>

          {/* Guess input */}
          <div ref={dropdownRef} className="relative w-full">
            <input
                type="text"
                placeholder="Guess song or artist"
                value={guess}
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                setGuess(e.target.value);
                setOpen(true); // open dropdown whenever typing
                }}
                className="w-full p-2 rounded text-black"
            />

            {open && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white text-black rounded shadow mt-1 max-h-40 overflow-auto z-10">
                {suggestions.map((s, i) => (
                    <li
                    key={i}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                        setGuess(s.display);
                        setSuggestions([]);
                        setOpen(false); // close dropdown after selection
                    }}
                    >
                    {s.display}
                    </li>
                ))}
                </ul>
            )}
          </div>


          {/* Submit button */}
          <button
            onClick={handleSubmitGuess}
            className="bg-green-500 text-white p-2 rounded font-bold mt-2"
          >
            Submit Guess
          </button>

          {/* Score */}
          <div className="mt-2 text-white font-bold">
            Score: {score}
          </div>
        </div>
      )}
    </div>
  );
}

export default Player;