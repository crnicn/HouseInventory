import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useUserName } from './hooks/useUserName';
import ItemRow from './components/ItemRow';
import CategorySection from './components/CategorySection';
import AddItemModal from './components/AddItemModal';
import ShoppingToggle from './components/ShoppingToggle';

const CATEGORIES = ['Kitchen', 'Fridge', 'Bathroom', 'Pharmacy'];

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userName, saveUserName] = useUserName();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Prompt for name on first launch
  useEffect(() => {
    if (userName === null) return;
    if (!userName) setShowNamePrompt(true);
  }, [userName]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      saveUserName(nameInput.trim());
      setShowNamePrompt(false);
      setNameInput('');
    }
  };

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const shoppingItems = inventory
    .filter(i => i.isLow)
    .sort((a, b) => a.name.localeCompare(b.name));

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: inventory
      .filter(i => i.category === cat)
      .sort((a, b) => b.isLow - a.isLow || a.name.localeCompare(b.name))
  }));

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="title">Kućni Inventar</h1>
        <ShoppingToggle
          value={shoppingMode}
          onValueChange={setShoppingMode}
          itemCount={shoppingItems.length}
        />
      </header>

      {/* List */}
      <main className="list">
        {shoppingMode ? (
          shoppingItems.length > 0 ? (
            shoppingItems.map(item => (
              <ItemRow key={item.id} item={item} userName={userName} />
            ))
          ) : (
            <p className="empty">Sve je na stanju!</p>
          )
        ) : (
          grouped.map(group => (
            <CategorySection key={group.category} group={group} userName={userName} />
          ))
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAddModal(true)}>+</button>

      {/* Add Item Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        userName={userName}
      />

      {/* Name Prompt */}
      {showNamePrompt && (
        <div className="modal-overlay">
          <div className="name-modal">
            <h2>Dobrodošli!</h2>
            <p>Unesite svoje ime kako bi partner znao ko je ažurirao stavke:</p>
            <input
              className="modal-input"
              placeholder="Vaše ime..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button className="btn-add" style={{ width: '100%' }} onClick={handleSaveName}>
              Nastavi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
