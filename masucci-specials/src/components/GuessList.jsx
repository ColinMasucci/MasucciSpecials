

export default function GuessList({ guesses, correctAnswer }) {
  return (
    <div className="mt-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-2">Guesses:</h3>
      <ul className="space-y-1">
        {guesses.map((guess, i) => (
          <li
            key={i}
            className={`p-2 rounded ${
              guess.toLowerCase() === correctAnswer.toLowerCase()
                ? "bg-green-700"
                : "bg-red-700"
            }`}
          >
            {guess}
          </li>
        ))}
      </ul>
    </div>
  );
}
