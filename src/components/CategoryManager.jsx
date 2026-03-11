import { useState } from 'react';

export default function CategoryManager({ categories, onAdd, onRemove, onClose, itemCounts }) {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    // Generate an ID from the label (capitalize first letter, remove spaces)
    const id = label.charAt(0).toUpperCase() + label.slice(1).replace(/\s+/g, '');
    // Check for duplicate
    if (categories.some(c => c.id === id || c.label.toLowerCase() === label.toLowerCase())) {
      alert('Kategorija već postoji!');
      return;
    }
    onAdd({ id, label });
    setNewLabel('');
  };

  const handleRemove = (cat) => {
    const count = itemCounts[cat.id] || 0;
    const msg = count > 0
      ? `Kategorija "${cat.label}" ima ${count} stavki. Stavke neće biti obrisane ali neće imati kategoriju. Obrisati?`
      : `Obrisati kategoriju "${cat.label}"?`;
    if (window.confirm(msg)) {
      onRemove(cat.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Kategorije</h2>

        <div className="category-list-manage">
          {categories.map(cat => (
            <div key={cat.id} className="category-manage-row">
              <span className="category-manage-label">
                {cat.label}
                {(itemCounts[cat.id] || 0) > 0 && (
                  <span className="category-manage-count"> ({itemCounts[cat.id]})</span>
                )}
              </span>
              <button className="category-remove-btn" onClick={() => handleRemove(cat)} title="Obriši">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="category-add-row">
          <input
            className="modal-input"
            placeholder="Nova kategorija..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-add category-add-btn" onClick={handleAdd}>Dodaj</button>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Zatvori</button>
        </div>
      </div>
    </div>
  );
}
