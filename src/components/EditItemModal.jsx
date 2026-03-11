import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import LocationInput from './LocationInput';

export default function EditItemModal({ item, onClose, userName, locations = [], categories = [] }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || categories[0]?.id || '');
      setNotes(item.notes || '');
      setLocation(item.location || '');
    }
  }, [item]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateDoc(doc(db, 'inventory', item.id), {
      name: name.trim(),
      category,
      notes: notes.trim(),
      location: location.trim(),
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Nepoznato',
    });
    onClose();
  };

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Izmeni stavku</h2>

        <input
          className="modal-input"
          placeholder="Naziv stavke..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

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

        <label className="modal-label">Beleška</label>
        <input
          className="modal-input"
          placeholder="npr. plava pakovanja, 2 komada..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Otkaži</button>
          <button className="btn-add" onClick={handleSave}>Sačuvaj</button>
        </div>
      </div>
    </div>
  );
}
