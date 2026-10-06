import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { useApp } from "../store";
import { formatPrice, imageUrl, timeAgo } from "../utils";

export function ProductCard({ item }) {
  const { liked, toggleLike } = useApp();
  const isLiked = liked.has(item._id);
  const sold = item.status === 'sold';

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(item._id);
  };

  return (
    <Link to={'/product/' + item._id} className={'card' + (sold ? ' sold' : '')}>
      <div className="card-media">
        {sold && <span className="pill pill-dark badge-float">Sold</span>}
        <button
          className={'like-btn' + (isLiked ? ' liked' : '')}
          onClick={handleLike}
          aria-label={isLiked ? 'Remove from saved' : 'Save listing'}
          aria-pressed={isLiked}
        >
          <FiHeart />
        </button>
        <img src={imageUrl(item.pimage)} alt={item.pname} loading="lazy" />
      </div>
      <div className="card-body">
        <div className="price">{formatPrice(item.price)}</div>
        <div className="card-title">{item.pname}</div>
        <div className="card-meta">
          <span>{item.city || item.category}</span>
          <span>{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading listings">
      {Array.from({ length: count }).map((_, index) => (
        <div className="card" key={index}>
          <div className="card-media skeleton" style={{ borderRadius: 0 }} />
          <div className="card-body">
            <div className="skeleton skeleton-line" style={{ width: '40%', height: 18, marginTop: 0 }} />
            <div className="skeleton skeleton-line" style={{ width: '90%' }} />
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// One component for both "nothing here" and "something broke".
export function State({ icon, title, text, error, children }) {
  return (
    <div className={'state' + (error ? ' error' : '')}>
      <div className="state-icon">{icon}</div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function ConfirmDialog({ title, text, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="overlay" onMouseDown={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={'btn' + (danger ? ' btn-danger' : '')} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
