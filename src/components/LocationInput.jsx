import { useState, useRef } from 'react';

export default function LocationInput({ value = [], onChange, locations = [] }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // value is now an array of strings
  const selected = Array.isArray(value) ? value : (value ? [value] : []);

  // Filter: exclude already selected, match by input text
  const filtered = locations.filter(l =>
    !selected.includes(l) &&
    (!input || l.toLowerCase().includes(input.toLowerCase()))
  );

  const addLocation = (loc) => {
    const trimmed = loc.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeLocation = (loc) => {
    onChange(selected.filter(l => l !== loc));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addLocation(input);
    } else if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault();
      addLocation(filtered[0]);
    } else if (e.key === 'Backspace' && !input && selected.length > 0) {
      removeLocation(selected[selected.length - 1]);
    }
  };

  return (
    <div className="location-wrapper">
      <div className="location-chips-input" onClick={() => inputRef.current?.focus()}>
        {selected.map(loc => (
          <span key={loc} className="location-chip">
            {loc}
            <button
              type="button"
              className="location-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeLocation(loc); }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="location-chip-input"
          placeholder={selected.length === 0 ? 'npr. Maxi, DM, Apoteka...' : ''}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
        />
        {input.trim() && (
          <button
            type="button"
            className="location-add-btn"
            onMouseDown={(e) => { e.preventDefault(); addLocation(input); }}
          >
            +
          </button>
        )}
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="suggestions location-suggestions">
          {filtered.map(loc => (
            <button
              key={loc}
              className="suggestion"
              onMouseDown={(e) => { e.preventDefault(); addLocation(loc); }}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
