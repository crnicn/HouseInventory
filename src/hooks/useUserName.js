import { useState, useEffect } from 'react';

export function useUserName() {
  const [name, setName] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('userName');
    setName(stored || '');
  }, []);

  const saveName = (n) => {
    localStorage.setItem('userName', n);
    setName(n);
  };

  return [name, saveName];
}
