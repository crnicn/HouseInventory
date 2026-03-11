import { useState } from 'react';

export default function LocationInput({ value, onChange, locations }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = value
    ? locations.filter(l => l.toLowerCase().includes(value.toLowerCase()) && l.toLowerCase() !== value.toLowerCase())
    : locations;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault();
      onChange(filtered[0]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="location-wrapper">
      <input
        className="modal-input"
        placeholder="npr. Maxi, DM, Apoteka..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="suggestions location-suggestions">
          {filtered.map(loc => (
            <button
              key={loc}
              className="suggestion"
              onMouseDown={(e) => { e.preventDefault(); onChange(loc); setShowSuggestions(false); }}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
