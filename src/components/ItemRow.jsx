import { useState, useRef } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORY_LABELS = {
  Kitchen: 'Kuhinja',
  Fridge: 'Frižider',
  Bathroom: 'Kupatilo',
  Pharmacy: 'Apoteka',
};

export default function ItemRow({ item, userName, onEdit, onUndo }) {
  const [swiped, setSwiped] = useState(false);
  const touchStartX = useRef(0);
  const longPressTimer = useRef(null);

  const toggle = async () => {
    const prevIsLow = item.isLow;
    await updateDoc(doc(db, 'inventory', item.id), {
      isLow: !item.isLow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Nepoznato',
    });
    if (onUndo) onUndo(item.id, prevIsLow, userName);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Obrisati "${item.name}"?`)) {
      await deleteDoc(doc(db, 'inventory', item.id));
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      if (onEdit) onEdit(item);
    }, 500);
  };

  const handleTouchMove = (e) => {
    clearTimeout(longPressTimer.current);
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 60) setSwiped(true);
    if (diff < -30) setSwiped(false);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  return (
    <div className={`item-row-wrapper ${swiped ? 'swiped' : ''}`}>
      <button
        className={`item-row ${item.isLow ? 'item-low' : 'item-ok'}`}
        onClick={toggle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); if (onEdit) onEdit(item); }}
      >
        <div className="item-info">
          <div className="item-name">{item.name}</div>
          {item.notes && <div className="item-notes">{item.notes}</div>}
          <div className="item-meta">
            {CATEGORY_LABELS[item.category] || item.category}
            {item.updatedBy ? `  ·  ${item.updatedBy}` : ''}
          </div>
        </div>
        <div className="item-status">
          {item.isLow ? 'Dopuniti' : 'Na stanju'}
        </div>
      </button>
      <button className="delete-btn" onClick={handleDelete} title="Obriši">
        ✕
      </button>
    </div>
  );
}
