import { useRef, useEffect, useState } from "react";
import { fetchSpotifySuggestions } from "../api"; // your Spotify API helper

function GuessInput({ token, onSelect }) {
  const [guess, setGuess] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch suggestions when user types
  useEffect(() => {
    if (!guess || !token) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      const results = await fetchSpotifySuggestions(guess, token);
      setSuggestions(results);
    }, 300);

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
    <div ref={dropdownRef} className="relative w-full">
      <input
        type="text"
        placeholder="Guess song or artist"
        className="w-full p-2 rounded border text-black"
        value={guess}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setGuess(e.target.value);
          setOpen(true);
        }}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white text-black rounded shadow mt-1 max-h-40 overflow-auto z-10">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                const selected = `${s.name} - ${s.artists}`;
                setGuess(selected);
                setSuggestions([]);
                setOpen(false);
                if (onSelect) onSelect(selected);
              }}
            >
              {`${s.name} - ${s.artists}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GuessInput;
