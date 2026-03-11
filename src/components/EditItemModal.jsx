import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = ['Kitchen', 'Fridge', 'Bathroom', 'Pharmacy'];
const CATEGORY_LABELS = {
  Kitchen: 'Kuhinja',
  Fridge: 'Frižider',
  Bathroom: 'Kupatilo',
  Pharmacy: 'Apoteka',
};

export default function EditItemModal({ item, onClose, userName }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kitchen');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'Kitchen');
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateDoc(doc(db, 'inventory', item.id), {
      name: name.trim(),
      category,
      notes: notes.trim(),
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
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? 'cat-btn-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

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
