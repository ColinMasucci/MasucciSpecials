import { useRef, useEffect, useState } from "react";

function GuessInput({ suggestions, setGuess, setSuggestions }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <input
        type="text"
        placeholder="Guess song or artist"
        className="w-full p-2 rounded border text-black"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setGuess(e.target.value)
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
                setGuess(s.name);
                setSuggestions([]);
                setOpen(false); // close after selecting
              }}
            >
              {s.type === "track" ? `${s.name} - ${s.artists}` : s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GuessInput;