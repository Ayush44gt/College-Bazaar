import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiSearch } from "react-icons/fi";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage, formatDate, formatPrice, imageUrl } from "../utils";
import { ConfirmDialog, State } from "./ui";

function Admin() {
  const { toast } = useApp();

  const [stats, setstats] = useState(null);
  const [users, setusers] = useState([]);
  const [products, setproducts] = useState([]);
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');
  const [tab, settab] = useState('users');
  const [filter, setfilter] = useState('');
  const [busy, setbusy] = useState(false);
  const [confirm, setconfirm] = useState(null);

  const load = useCallback((quiet) => {
    if (!quiet) setstatus('loading');
    Promise.all([
      axios.get(API_URL + '/admin/stats'),
      axios.get(API_URL + '/admin/users'),
      axios.get(API_URL + '/admin/products'),
    ])
      .then(([s, u, p]) => {
        setstats(s.data.stats);
        setusers(u.data.users);
        setproducts(p.data.products);
        setstatus('ready');
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setstatus('error');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runConfirmed = () => {
    const { type, item } = confirm;
    const request = type === 'delete'
      ? axios.post(`${API_URL}/delete-product/${item._id}`)
      : axios.post(`${API_URL}/admin/user-status/${item._id}`, { status: type === 'block' ? 'blocked' : 'active' });

    setbusy(true);
    request
      .then((res) => {
        toast(res.data.message);
        load(true);
      })
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => {
        setbusy(false);
        setconfirm(null);
      });
  };

  if (status === 'loading') {
    return (
      <div className="page" aria-busy="true">
        <h1>Admin</h1>
        <div className="stats" style={{ marginTop: 20 }}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="stat skeleton" style={{ height: 88 }} />)}
        </div>
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="page">
        <State error icon={<FiAlertTriangle />} title="Could not load the admin page" text={error}>
          <button className="btn" onClick={() => load()}>Try again</button>
        </State>
      </div>
    );
  }

  const text = filter.trim().toLowerCase();
  const shownUsers = users.filter((u) =>
    !text || [u.username, u.email, u.college].some((v) => (v || '').toLowerCase().includes(text)));
  const shownProducts = products.filter((p) =>
    !text || [p.pname, p.category, p.city, p.addedBy && p.addedBy.username].some((v) => (v || '').toLowerCase().includes(text)));
  const maxCategory = Math.max(...stats.byCategory.map((c) => c.count), 1);

  const dialogs = {
    block: (item) => ({ title: 'Block ' + item.username + '?', text: 'They will be logged out and their listings will be hidden from everyone.', label: 'Block user' }),
    unblock: (item) => ({ title: 'Unblock ' + item.username + '?', text: 'They will be able to log in again and their listings will be visible.', label: 'Unblock user' }),
    delete: (item) => ({ title: 'Delete this listing?', text: `“${item.pname}” will be removed for everyone. This cannot be undone.`, label: 'Delete' }),
  };
  const dialog = confirm && dialogs[confirm.type](confirm.item);

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1>Admin</h1>
          <span className="muted small">Keep the marketplace clean: manage users and listings.</span>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span>Users</span><strong>{stats.users}</strong></div>
        <div className="stat"><span>Blocked</span><strong>{stats.blocked}</strong></div>
        <div className="stat"><span>Listings</span><strong>{stats.listings}</strong></div>
        <div className="stat"><span>Available</span><strong>{stats.available}</strong></div>
        <div className="stat"><span>Sold</span><strong>{stats.sold}</strong></div>
        <div className="stat"><span>Saves</span><strong>{stats.saves}</strong></div>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-head"><h2>Listings by category</h2></div>
        <div className="bars">
          {stats.byCategory.map((c) => (
            <div className="bar-row" key={c.category}>
              <span>{c.category}</span>
              <div className="bar"><i style={{ width: (c.count / maxCategory) * 100 + '%' }} /></div>
              <strong>{c.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar" style={{ alignItems: 'center' }}>
        <div className="tabs" role="tablist" style={{ marginBottom: 0 }}>
          <button role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'active' : ''} onClick={() => settab('users')}>
            Users ({users.length})
          </button>
          <button role="tab" aria-selected={tab === 'listings'} className={tab === 'listings' ? 'active' : ''} onClick={() => settab('listings')}>
            Listings ({products.length})
          </button>
        </div>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          type="search"
          placeholder={tab === 'users' ? 'Filter users…' : 'Filter listings…'}
          value={filter}
          onChange={(e) => setfilter(e.target.value)}
          aria-label="Filter table"
        />
      </div>

      {tab === 'users' && (shownUsers.length === 0 ? (
        <State icon={<FiSearch />} title="No users match" text="Try a different filter." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>College</th><th>Mobile</th><th>Role</th><th>Status</th><th>Listings</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {shownUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="cell-user">
                      <span className="avatar">{u.username[0]}</span>
                      <div>
                        <strong>{u.username}</strong>
                        <div className="muted small">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.college || '—'}</td>
                  <td>{u.mobile || '—'}</td>
                  <td><span className={'pill ' + (u.role === 'admin' ? 'pill-accent' : '')}>{u.role}</span></td>
                  <td><span className={'pill ' + (u.status === 'blocked' ? 'pill-danger' : 'pill-success')}>{u.status}</span></td>
                  <td>{u.listings}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.role === 'admin' ? (
                      <span className="muted small">—</span>
                    ) : u.status === 'blocked' ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => setconfirm({ type: 'unblock', item: u })}>Unblock</button>
                    ) : (
                      <button className="btn btn-danger-ghost btn-sm" onClick={() => setconfirm({ type: 'block', item: u })}>Block</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === 'listings' && (shownProducts.length === 0 ? (
        <State icon={<FiSearch />} title="No listings match" text="Try a different filter." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Listing</th><th>Seller</th><th>Category</th><th>City</th><th>Price</th><th>Status</th><th>Posted</th><th></th></tr>
            </thead>
            <tbody>
              {shownProducts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="cell-user">
                      <img className="cell-thumb" src={imageUrl(p.pimage)} alt="" loading="lazy" />
                      <Link className="cell-title link" to={'/product/' + p._id} style={{ color: 'inherit' }}>{p.pname}</Link>
                    </div>
                  </td>
                  <td>
                    {p.addedBy ? p.addedBy.username : '—'}
                    {p.addedBy && p.addedBy.status === 'blocked' && <span className="pill pill-danger" style={{ marginLeft: 6 }}>blocked</span>}
                  </td>
                  <td>{p.category}</td>
                  <td>{p.city || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><strong>{formatPrice(p.price)}</strong></td>
                  <td><span className={'pill ' + (p.status === 'sold' ? 'pill-danger' : 'pill-success')}>{p.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger-ghost btn-sm" onClick={() => setconfirm({ type: 'delete', item: p })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {dialog && (
        <ConfirmDialog
          danger={confirm.type !== 'unblock'}
          title={dialog.title}
          text={dialog.text}
          confirmLabel={dialog.label}
          busy={busy}
          onConfirm={runConfirmed}
          onCancel={() => setconfirm(null)}
        />
      )}
    </div>
  );
}

export default Admin;
