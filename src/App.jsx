import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { useUserName } from './hooks/useUserName';
import ItemRow from './components/ItemRow';
import CategorySection from './components/CategorySection';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import ShoppingToggle from './components/ShoppingToggle';
import SearchBar from './components/SearchBar';
import UndoToast from './components/UndoToast';
import CategoryManager from './components/CategoryManager';

const DEFAULT_CATEGORIES = [
  { id: 'Kitchen', label: 'Kuhinja' },
  { id: 'Fridge', label: 'Frižider' },
  { id: 'Bathroom', label: 'Kupatilo' },
  { id: 'Pharmacy', label: 'Apoteka' },
  { id: 'Kids', label: 'Deca' },
];

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
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
  const [locationFilter, setLocationFilter] = useState('');
  const [sortMode, setSortMode] = useState(() => localStorage.getItem('sortMode') || 'status');

  // Derived: category IDs and labels map
  const categoryIds = categories.map(c => c.id);
  const categoryLabels = Object.fromEntries(categories.map(c => [c.id, c.label]));

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

  const lowCount = inventory.filter(i => i.isLow).length;

  // Browser notification reminder
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Ask permission after a short delay
      const timer = setTimeout(() => Notification.requestPermission(), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Send notification when there are low items and app is in background
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (lowCount === 0) return;
    const handleVisChange = () => {
      if (document.hidden && lowCount > 0) {
        new Notification('Kućni Inventar', {
          body: `${lowCount} stavki treba dopuniti`,
          icon: '/icon-192.png',
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [lowCount]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      saveUserName(nameInput.trim());
      setShowNamePrompt(false);
      setNameInput('');
    }
  };

  // Real-time Firestore listener for inventory
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listener for categories
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'categories'), (snap) => {
      if (snap.exists() && snap.data().list) {
        setCategories(snap.data().list);
      }
    });
    return () => unsub();
  }, []);

  // Save categories to Firestore
  const saveCategories = async (newList) => {
    await setDoc(doc(db, 'settings', 'categories'), { list: newList });
  };

  const handleAddCategory = async (cat) => {
    const newList = [...categories, cat];
    await saveCategories(newList);
  };

  const handleRemoveCategory = async (catId) => {
    const newList = categories.filter(c => c.id !== catId);
    await saveCategories(newList);
  };

  // Remove a location from all items that have it
  const handleRemoveLocation = async (loc) => {
    const itemsWithLoc = inventory.filter(i => {
      const l = i.location;
      return Array.isArray(l) ? l.includes(loc) : l === loc;
    });
    await Promise.all(itemsWithLoc.map(item => {
      const l = item.location;
      if (Array.isArray(l)) {
        return updateDoc(doc(db, 'inventory', item.id), { location: arrayRemove(loc) });
      }
      // legacy string field — clear it
      return updateDoc(doc(db, 'inventory', item.id), { location: [] });
    }));
  };

  // Item counts per category (for category manager)
  const itemCounts = {};
  inventory.forEach(i => {
    itemCounts[i.category] = (itemCounts[i.category] || 0) + 1;
  });

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

  // Mark all items in a category (or all) as stocked
  const markAllStocked = async (categoryId) => {
    const items = inventory.filter(i => i.isLow && (!categoryId || i.category === categoryId));
    if (items.length === 0) return;
    const label = categoryId ? (categoryLabels[categoryId] || categoryId) : 'sve kategorije';
    if (!window.confirm(`Označiti ${items.length} stavki kao "Na stanju" (${label})?`)) return;
    const batch = writeBatch(db);
    items.forEach(item => {
      batch.update(doc(db, 'inventory', item.id), {
        isLow: false,
        lastUpdated: serverTimestamp(),
        lastStocked: serverTimestamp(),
        updatedBy: userName || 'Nepoznato',
      });
    });
    await batch.commit();
  };

  // Toggle sort mode
  const toggleSort = () => {
    const next = sortMode === 'status' ? 'az' : 'status';
    setSortMode(next);
    localStorage.setItem('sortMode', next);
  };

  // Filter by search
  const filtered = search
    ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : inventory;


  // Collect unique locations for autocomplete (handles both string and array)
  const knownLocations = [...new Set(
    inventory.flatMap(i => {
      const loc = i.location;
      if (Array.isArray(loc)) return loc;
      return loc ? [loc] : [];
    })
  )].sort();

  // Locations that have low items (for shopping filter)
  const shoppingLocations = [...new Set(
    inventory.filter(i => i.isLow).flatMap(i => {
      const loc = i.location;
      if (Array.isArray(loc)) return loc;
      return loc ? [loc] : [];
    })
  )].sort();

  // Shopping Mode: grouped by category, optionally filtered by location
  const shoppingGrouped = categoryIds.map(cat => ({
    category: cat,
    items: filtered
      .filter(i => i.isLow && i.category === cat && (!locationFilter || (Array.isArray(i.location) ? i.location.includes(locationFilter) : i.location === locationFilter)))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(g => g.items.length > 0);

  // Sort helper
  const sortItems = (items) => {
    if (sortMode === 'az') return [...items].sort((a, b) => a.name.localeCompare(b.name));
    return [...items].sort((a, b) => b.isLow - a.isLow || a.name.localeCompare(b.name));
  };

  // Normal Mode: grouped by category
  const grouped = categoryIds.map(cat => ({
    category: cat,
    items: sortItems(filtered.filter(i => i.category === cat))
  }));

  // Share shopping list
  const shareList = async () => {
    const lines = categoryIds
      .map(cat => {
        const items = inventory.filter(i => i.isLow && i.category === cat);
        if (items.length === 0) return null;
        return `${categoryLabels[cat] || cat}:\n${items.map(i => {
          const locStr = Array.isArray(i.location) ? i.location.join(', ') : (i.location || '');
          const extra = [i.quantity, i.notes, locStr].filter(Boolean).join(', ');
          return `  - ${i.name}${extra ? ` (${extra})` : ''}`;
        }).join('\n')}`;
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
          <div className="header-actions">
            <button className="dark-toggle" onClick={() => setShowCategoryManager(true)} title="Kategorije">
              ⚙️
            </button>
            <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)} title="Tamni režim">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
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

      {/* Sort & Search */}
      <div className="sort-search-row">
        <div className="search-flex">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <button className="sort-btn" onClick={toggleSort} title={sortMode === 'az' ? 'Sortiraj po statusu' : 'Sortiraj A-Ž'}>
          {sortMode === 'az' ? 'A-Ž' : '↕'}
        </button>
      </div>

      {/* Location Filter (shopping mode only) */}
      {shoppingMode && shoppingLocations.length > 0 && (
        <div className="location-filter">
          <button
            className={`loc-filter-btn ${!locationFilter ? 'loc-filter-active' : ''}`}
            onClick={() => setLocationFilter('')}
          >
            Sve
          </button>
          {shoppingLocations.map(loc => (
            <button
              key={loc}
              className={`loc-filter-btn ${locationFilter === loc ? 'loc-filter-active' : ''}`}
              onClick={() => setLocationFilter(locationFilter === loc ? '' : loc)}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <main className="list">
        {shoppingMode ? (
          shoppingGrouped.length > 0 ? (
            <>
            {shoppingGrouped.length > 1 && (
              <div className="mark-all-bar">
                <button className="mark-all-btn" onClick={() => markAllStocked()}>
                  Sve na stanju
                </button>
              </div>
            )}
            {shoppingGrouped.map(group => (
              <div key={group.category} className="category-section">
                <div className="category-header shopping-cat-header">
                  <span>
                    <strong>{categoryLabels[group.category] || group.category}</strong>
                    <span className="category-count"> ({group.items.length})</span>
                  </span>
                  <button className="mark-cat-btn" onClick={() => markAllStocked(group.category)}>
                    Na stanju
                  </button>
                </div>
                {group.items.map(item => (
                  <ItemRow key={item.id} item={item} userName={userName} onEdit={setEditItem} onUndo={handleUndo} categoryLabels={categoryLabels} />
                ))}
              </div>
            ))}
            </>
          ) : (
            <p className="empty">Sve je na stanju!</p>
          )
        ) : (
          grouped.map(group => (
            <CategorySection key={group.category} group={group} userName={userName} onEdit={setEditItem} onUndo={handleUndo} categoryLabels={categoryLabels} />
          ))
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAddModal(true)}>+</button>

      {/* Modals */}
      <AddItemModal visible={showAddModal} onClose={() => setShowAddModal(false)} userName={userName} locations={knownLocations} categories={categories} />
      <EditItemModal item={editItem} onClose={() => setEditItem(null)} userName={userName} locations={knownLocations} categories={categories} />

      {/* Category Manager */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory}
          onRemove={handleRemoveCategory}
          onClose={() => setShowCategoryManager(false)}
          itemCounts={itemCounts}
          locations={knownLocations}
          onRemoveLocation={handleRemoveLocation}
        />
      )}

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
