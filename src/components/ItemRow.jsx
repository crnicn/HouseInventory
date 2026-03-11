import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function ItemRow({ item, userName }) {
  const toggle = async () => {
    await updateDoc(doc(db, 'inventory', item.id), {
      isLow: !item.isLow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Unknown',
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
          {item.category}
          {item.updatedBy ? `  ·  Updated by ${item.updatedBy}` : ''}
        </div>
      </div>
      <div className="item-status">
        {item.isLow ? 'Needs Refill' : 'In Stock'}
      </div>
    </button>
  );
}
