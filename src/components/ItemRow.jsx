import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORY_LABELS = {
  Kitchen: 'Kuhinja',
  Fridge: 'Frižider',
  Bathroom: 'Kupatilo',
  Pharmacy: 'Apoteka',
};

export default function ItemRow({ item, userName }) {
  const toggle = async () => {
    await updateDoc(doc(db, 'inventory', item.id), {
      isLow: !item.isLow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Nepoznato',
    });
  };

  return (
    <button
      className={`item-row ${item.isLow ? 'item-low' : 'item-ok'}`}
      onClick={toggle}
    >
      <div>
        <div className="item-name">{item.name}</div>
        <div className="item-meta">
          {CATEGORY_LABELS[item.category] || item.category}
          {item.updatedBy ? `  ·  Ažurirao/la ${item.updatedBy}` : ''}
        </div>
      </div>
      <div className="item-status">
        {item.isLow ? 'Dopuniti' : 'Na stanju'}
      </div>
    </button>
  );
}
