import { useEffect } from 'react';

export default function UndoToast({ message, onUndo, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="undo-toast">
      <span>{message}</span>
      <button className="undo-btn" onClick={onUndo}>Poništi</button>
    </div>
  );
}
