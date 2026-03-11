import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SUGGESTIONS from '../data/suggestions';

const CATEGORIES = ['Kitchen', 'Fridge', 'Bathroom', 'Pharmacy'];

const getMatches = (query) => {
  if (!query || query.length < 2) return [];
  return SUGGESTIONS
    .filter(s => s.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 5);
};

export default function AddItemModal({ visible, onClose, userName }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kitchen');
  const [needNow, setNeedNow] = useState(false);
  const [matches, setMatches] = useState([]);

  const onChangeName = (text) => {
    setName(text);
    setMatches(getMatches(text));
  };

  const onSelectSuggestion = (suggestion) => {
    setName(suggestion);
    setMatches([]);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addDoc(collection(db, 'inventory'), {
      name: name.trim(),
      category,
      isLow: needNow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Unknown',
    });
    setName(''); setCategory('Kitchen'); setNeedNow(false); setMatches([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Item</h2>

        <input
          className="modal-input"
          placeholder="Item name..."
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />

        {matches.length > 0 && (
          <div className="suggestions">
            {matches.map(s => (
              <button key={s} className="suggestion" onClick={() => onSelectSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <label className="modal-label">Category</label>
        <div className="category-picker">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? 'cat-btn-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="need-now-row">
          <span className="modal-label">Add to shopping list now?</span>
          <label className="switch">
            <input type="checkbox" checked={needNow} onChange={(e) => setNeedNow(e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-add" onClick={handleAdd}>Add Item</button>
        </div>
      </div>
    </div>
  );
}
