import { useState } from 'react';
import ItemRow from './ItemRow';

const CATEGORY_LABELS = {
  Kitchen: 'Kuhinja',
  Fridge: 'Frižider',
  Bathroom: 'Kupatilo',
  Pharmacy: 'Apoteka',
};

export default function CategorySection({ group, userName, onEdit, onUndo }) {
  const [collapsed, setCollapsed] = useState(false);
  const lowCount = group.items.filter(i => i.isLow).length;

  return (
    <div className="category-section">
      <button className="category-header" onClick={() => setCollapsed(!collapsed)}>
        <span>
          <strong>{CATEGORY_LABELS[group.category] || group.category}</strong>
          <span className="category-count"> ({group.items.length})</span>
          {lowCount > 0 && <span className="category-low"> {lowCount} nedostaje</span>}
        </span>
        <span className="chevron">{collapsed ? '▶' : '▼'}</span>
      </button>
      {!collapsed && (
        group.items.length > 0 ? (
          group.items.map(item => (
            <ItemRow key={item.id} item={item} userName={userName} onEdit={onEdit} onUndo={onUndo} />
          ))
        ) : (
          <p className="category-empty">Nema stavki</p>
        )
      )}
    </div>
  );
}
