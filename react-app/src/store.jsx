import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_URL from "./constants";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const readSession = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  if (!token || !userId) return null;
  return {
    userId,
    username: localStorage.getItem('username') || 'You',
    role: localStorage.getItem('role') || 'user',
  };
};

export const clearSession = () => {
  ['token', 'userId', 'username', 'role'].forEach((key) => localStorage.removeItem(key));
};

// Holds what every page needs: who is logged in, saved listings, chosen city and toasts.
export function AppProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const [liked, setLiked] = useState(() => new Set());
  const [loc, setLocState] = useState(() => localStorage.getItem('userLoc') || '');
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (!user) {
      setLiked(new Set());
      return;
    }
    axios.get(API_URL + '/liked-ids')
      .then((res) => setLiked(new Set(res.data.ids)))
      .catch(() => { });
  }, [user]);

  const login = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    setUser({ userId: data.userId, username: data.username, role: data.role });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const setLoc = useCallback((value) => {
    localStorage.setItem('userLoc', value);
    setLocState(value);
  }, []);

  // returns false when the user has to log in first
  const toggleLike = useCallback((productId) => {
    if (!user) {
      toast('Log in to save listings.', 'info');
      return false;
    }
    const wasLiked = liked.has(productId);
    const apply = (add) => setLiked((current) => {
      const next = new Set(current);
      if (add) next.add(productId); else next.delete(productId);
      return next;
    });

    apply(!wasLiked);
    axios.post(API_URL + (wasLiked ? '/unlike-product' : '/like-product'), { productId })
      .then(() => toast(wasLiked ? 'Removed from saved.' : 'Saved to your list.'))
      .catch(() => {
        apply(wasLiked);
        toast('Could not update your saved list.', 'error');
      });
    return true;
  }, [user, liked, toast]);

  const value = useMemo(
    () => ({ user, login, logout, liked, toggleLike, loc, setLoc, toast }),
    [user, login, logout, liked, toggleLike, loc, setLoc, toast]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast toast-' + t.type}>{t.message}</div>
        ))}
      </div>
    </AppContext.Provider>
  );
}
