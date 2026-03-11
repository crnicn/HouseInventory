export default function ShoppingToggle({ value, onValueChange, itemCount }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">
        Režim kupovine {value ? `(${itemCount})` : ''}
      </span>
      <label className="switch">
        <input type="checkbox" checked={value} onChange={(e) => onValueChange(e.target.checked)} />
        <span className="slider"></span>
      </label>
    </div>
  );
}
