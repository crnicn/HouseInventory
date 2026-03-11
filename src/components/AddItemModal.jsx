import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SUGGESTIONS from '../data/suggestions';
import LocationInput from './LocationInput';

const getMatches = (query) => {
  if (!query || query.length < 2) return [];
  return SUGGESTIONS
    .filter(s => s.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 5);
};

export default function AddItemModal({ visible, onClose, userName, locations = [], categories = [] }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [needNow, setNeedNow] = useState(false);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
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
    const item = {
      name: name.trim(),
      category: category || categories[0]?.id || '',
      isLow: needNow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Nepoznato',
    };
    if (notes.trim()) item.notes = notes.trim();
    if (location.trim()) item.location = location.trim();
    await addDoc(collection(db, 'inventory'), item);
    setName(''); setCategory(categories[0]?.id || ''); setNeedNow(false); setNotes(''); setLocation(''); setMatches([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Dodaj stavku</h2>

        <input
          className="modal-input"
          placeholder="Naziv stavke..."
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

        <label className="modal-label">Kategorija</label>
        <div className="category-picker">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-btn ${category === cat.id ? 'cat-btn-active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <label className="modal-label">Lokacija</label>
        <LocationInput value={location} onChange={setLocation} locations={locations} />

        <label className="modal-label">Beleška (opciono)</label>
        <input
          className="modal-input"
          placeholder="npr. plava pakovanja, 2 komada..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="need-now-row">
          <span className="modal-label">Dodaj na listu za kupovinu?</span>
          <label className="switch">
            <input type="checkbox" checked={needNow} onChange={(e) => setNeedNow(e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Otkaži</button>
          <button className="btn-add" onClick={handleAdd}>Dodaj</button>
        </div>
      </div>
    </div>
  );
}
