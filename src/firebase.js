import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD8g6VE0tfDeSht5eGBuBxTYpWVaooHreo",
  authDomain: "houseinventory-3ba8f.firebaseapp.com",
  projectId: "houseinventory-3ba8f",
  storageBucket: "houseinventory-3ba8f.firebasestorage.app",
  messagingSenderId: "754069647459",
  appId: "1:754069647459:web:9168eea256d1ffa6b98856"
};
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
