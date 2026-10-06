import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FiGrid, FiHeart, FiLogOut, FiPlus, FiSearch, FiShield, FiTag, FiUser } from "react-icons/fi";
import { useApp } from "../store";
import { CATEGORIES, CITIES } from "../constants";

// Sends visitors to the login page and brings them back afterwards.
export function RequireAuth({ children, admin }) {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to={'/login?next=' + encodeURIComponent(location.pathname)} replace />;
  }
  if (admin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function UserMenu() {
  const { user, logout, toast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    toast('You have been logged out.');
    navigate('/');
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="avatar" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}>
        {user.username[0]}
      </button>
      {open && (
        <div className="menu">
          <div className="menu-head">
            <strong>{user.username}</strong>
            <div className="muted small">{user.role === 'admin' ? 'Administrator' : 'Student account'}</div>
          </div>
          <Link className="menu-item" to="/my-profile"><FiUser /> My profile</Link>
          <Link className="menu-item" to="/my-products"><FiTag /> My listings</Link>
          <Link className="menu-item" to="/liked-products"><FiHeart /> Saved</Link>
          {user.role === 'admin' && <Link className="menu-item" to="/admin"><FiShield /> Admin</Link>}
          <button className="menu-item danger" onClick={handleLogout}><FiLogOut /> Log out</button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, loc, setLoc } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [search, setsearch] = useState(query);

  useEffect(() => setsearch(query), [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const text = search.trim();
    navigate(text ? '/?q=' + encodeURIComponent(text) : '/');
  };

  return (
    <header className="header">
      <div className="container header-row">
        <Link className="logo" to="/">
          <span className="logo-mark">CB</span>
          College Bazaar
        </Link>

        <form className="search" onSubmit={handleSearch} role="search">
          <select className="search-city" value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="City">
            <option value="">All cities</option>
            {CITIES.map((city) => (
              <option key={city.name} value={city.loc}>{city.name}</option>
            ))}
          </select>
          <span className="search-divider" />
          <input
            type="search"
            placeholder="Search books, laptops, cycles…"
            value={search}
            onChange={(e) => setsearch(e.target.value)}
            aria-label="Search listings"
          />
          <button type="submit" aria-label="Search"><FiSearch /></button>
        </form>

        <div className="header-actions">
          <Link className="btn" to="/add-product"><FiPlus /> <span className="sell-label">Sell an item</span></Link>
          {user ? <UserMenu /> : <Link className="btn btn-ghost" to="/login">Log in</Link>}
        </div>
      </div>
    </header>
  );
}

function CategoryBar() {
  return (
    <nav className="chips-bar" aria-label="Categories">
      <div className="container chips">
        <NavLink end to="/" className={({ isActive }) => 'chip' + (isActive ? ' active' : '')}>
          <FiGrid /> All
        </NavLink>
        {CATEGORIES.map((item) => (
          <NavLink
            key={item.name}
            to={'/category/' + item.name}
            className={({ isActive }) => 'chip' + (isActive ? ' active' : '')}
          >
            <span>{item.icon}</span> {item.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Header />
      <CategoryBar />
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer">College Bazaar · Buy and sell within your campus</footer>
    </>
  );
}

export default Layout;
