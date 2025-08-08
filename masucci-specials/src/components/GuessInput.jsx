import { useState } from "react";

export default function GuessInput({ songs, onGuess }) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = songs.filter(
    s =>
      s.title.toLowerCase().includes(input.toLowerCase()) ||
      s.artist.toLowerCase().includes(input.toLowerCase())
  );

  const handleSelect = (song) => {
    setInput("");
    setShowSuggestions(false);
    onGuess(`${song.title} - ${song.artist}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onGuess(input.trim());
      setInput("");
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mt-4">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          placeholder="Type a song or artist..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
        />
      </form>
      {showSuggestions && input && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded mt-1 max-h-40 overflow-y-auto">
          {suggestions.map((song, index) => (
            <li
              key={index}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelect(song)}
            >
              {song.title} - {song.artist}
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className="px-3 py-2 text-gray-400">No matches found</li>
          )}
        </ul>
      )}
    </div>
  );
}
