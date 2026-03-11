import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useUserName } from './hooks/useUserName';
import ItemRow from './components/ItemRow';
import CategorySection from './components/CategorySection';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import ShoppingToggle from './components/ShoppingToggle';
import SearchBar from './components/SearchBar';
import UndoToast from './components/UndoToast';

const CATEGORIES = ['Kitchen', 'Fridge', 'Bathroom', 'Pharmacy'];
const CATEGORY_LABELS = {
  Kitchen: 'Kuhinja',
  Fridge: 'Frižider',
  Bathroom: 'Kupatilo',
  Pharmacy: 'Apoteka',
};

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [userName, saveUserName] = useUserName();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [undoInfo, setUndoInfo] = useState(null);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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

  // Undo handler
  const handleUndo = useCallback((itemId, prevIsLow, name) => {
    setUndoInfo({ itemId, prevIsLow, name });
  }, []);

  const executeUndo = async () => {
    if (!undoInfo) return;
    await updateDoc(doc(db, 'inventory', undoInfo.itemId), {
      isLow: undoInfo.prevIsLow,
      lastUpdated: serverTimestamp(),
      updatedBy: userName || 'Nepoznato',
    });
    setUndoInfo(null);
  };

  const dismissUndo = useCallback(() => setUndoInfo(null), []);

  // Filter by search
  const filtered = search
    ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : inventory;

  const lowCount = inventory.filter(i => i.isLow).length;

  // Shopping Mode: grouped by category
  const shoppingGrouped = CATEGORIES.map(cat => ({
    category: cat,
    items: filtered.filter(i => i.isLow && i.category === cat).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(g => g.items.length > 0);

  // Normal Mode: grouped by category
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: filtered
      .filter(i => i.category === cat)
      .sort((a, b) => b.isLow - a.isLow || a.name.localeCompare(b.name))
  }));

  // Share shopping list
  const shareList = async () => {
    const lines = CATEGORIES
      .map(cat => {
        const items = inventory.filter(i => i.isLow && i.category === cat);
        if (items.length === 0) return null;
        return `${CATEGORY_LABELS[cat]}:\n${items.map(i => `  - ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}`;
      })
      .filter(Boolean);

    const text = `Lista za kupovinu\n\n${lines.join('\n\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    alert('Lista kopirana!');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-top">
          <h1 className="title">
            Kućni Inventar
            {lowCount > 0 && <span className="badge">{lowCount}</span>}
          </h1>
          <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)} title="Tamni režim">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <ShoppingToggle
          value={shoppingMode}
          onValueChange={setShoppingMode}
          itemCount={lowCount}
        />
        {shoppingMode && lowCount > 0 && (
          <button className="share-btn" onClick={shareList}>
            Podeli listu
          </button>
        )}
      </header>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* List */}
      <main className="list">
        {shoppingMode ? (
          shoppingGrouped.length > 0 ? (
            shoppingGrouped.map(group => (
              <div key={group.category} className="category-section">
                <div className="category-header shopping-cat-header">
                  <strong>{CATEGORY_LABELS[group.category]}</strong>
                  <span className="category-count"> ({group.items.length})</span>
                </div>
                {group.items.map(item => (
                  <ItemRow key={item.id} item={item} userName={userName} onEdit={setEditItem} onUndo={handleUndo} />
                ))}
              </div>
            ))
          ) : (
            <p className="empty">Sve je na stanju!</p>
          )
        ) : (
          grouped.map(group => (
            <CategorySection key={group.category} group={group} userName={userName} onEdit={setEditItem} onUndo={handleUndo} />
          ))
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAddModal(true)}>+</button>

      {/* Modals */}
      <AddItemModal visible={showAddModal} onClose={() => setShowAddModal(false)} userName={userName} />
      <EditItemModal item={editItem} onClose={() => setEditItem(null)} userName={userName} />

      {/* Undo Toast */}
      {undoInfo && (
        <UndoToast
          message="Status promenjen"
          onUndo={executeUndo}
          onDismiss={dismissUndo}
        />
      )}

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
