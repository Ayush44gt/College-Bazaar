import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiEdit2, FiPlus, FiRotateCcw, FiTag, FiTrash2 } from "react-icons/fi";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage, formatPrice, imageUrl, timeAgo } from "../utils";
import { ConfirmDialog, State } from "./ui";

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
];

function MyProducts() {
  const { toast } = useApp();
  const [products, setproducts] = useState([]);
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');
  const [tab, settab] = useState('all');
  const [busyId, setbusyId] = useState(null);
  const [toDelete, settoDelete] = useState(null);

  const load = useCallback(() => {
    setstatus('loading');
    axios.post(API_URL + '/my-products', {})
      .then((res) => {
        setproducts(res.data.products);
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

  const handleStatus = (item) => {
    const next = item.status === 'sold' ? 'available' : 'sold';
    setbusyId(item._id);
    axios.post(`${API_URL}/product-status/${item._id}`, { status: next })
      .then((res) => {
        setproducts((list) => list.map((p) => (p._id === item._id ? { ...p, status: next } : p)));
        toast(res.data.message);
      })
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setbusyId(null));
  };

  const handleDelete = () => {
    const item = toDelete;
    setbusyId(item._id);
    axios.post(`${API_URL}/delete-product/${item._id}`)
      .then((res) => {
        setproducts((list) => list.filter((p) => p._id !== item._id));
        toast(res.data.message);
      })
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => {
        setbusyId(null);
        settoDelete(null);
      });
  };

  const count = (value) => (value === 'all' ? products.length : products.filter((p) => p.status === value).length);
  const shown = tab === 'all' ? products : products.filter((p) => p.status === tab);

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1>My listings</h1>
          <span className="muted small">Everything you have put up for sale.</span>
        </div>
        <Link className="btn" to="/add-product"><FiPlus /> New listing</Link>
      </div>

      {status === 'loading' && (
        <div className="list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div className="list-item" key={i}>
              <div className="list-thumb skeleton" />
              <div className="list-main">
                <div className="skeleton skeleton-line" style={{ width: '50%', marginTop: 0 }} />
                <div className="skeleton skeleton-line" style={{ width: '25%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <State error icon={<FiAlertTriangle />} title="Could not load your listings" text={error}>
          <button className="btn" onClick={load}>Try again</button>
        </State>
      )}

      {status === 'ready' && products.length === 0 && (
        <State icon={<FiTag />} title="You have not listed anything yet" text="Got books or gadgets you no longer need? List them in under a minute.">
          <Link className="btn" to="/add-product">Sell an item</Link>
        </State>
      )}

      {status === 'ready' && products.length > 0 && (
        <>
          <div className="tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.value}
                role="tab"
                aria-selected={tab === item.value}
                className={tab === item.value ? 'active' : ''}
                onClick={() => settab(item.value)}
              >
                {item.label} ({count(item.value)})
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <State icon={<FiTag />} title={'No ' + tab + ' listings'} text="Nothing in this tab right now." />
          ) : (
            <div className="list">
              {shown.map((item) => (
                <div className="list-item" key={item._id}>
                  <Link className="list-thumb" to={'/product/' + item._id}>
                    <img src={imageUrl(item.pimage)} alt="" loading="lazy" />
                  </Link>
                  <div className="list-main">
                    <Link className="list-title" to={'/product/' + item._id}>{item.pname}</Link>
                    <div className="inline" style={{ marginTop: 6 }}>
                      <strong>{formatPrice(item.price)}</strong>
                      <span className={'pill ' + (item.status === 'sold' ? 'pill-danger' : 'pill-success')}>
                        {item.status === 'sold' ? 'Sold' : 'Available'}
                      </span>
                      <span className="muted small">{item.category} · {timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="list-actions">
                    <Link className="btn btn-ghost btn-sm" to={'/edit-product/' + item._id}><FiEdit2 /> Edit</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleStatus(item)} disabled={busyId === item._id}>
                      {item.status === 'sold' ? <><FiRotateCcw /> Relist</> : <><FiCheckCircle /> Mark sold</>}
                    </button>
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => settoDelete(item)}
                      disabled={busyId === item._id}
                      aria-label={'Delete ' + item.pname}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          danger
          title="Delete this listing?"
          text={`“${toDelete.pname}” will be removed for everyone. This cannot be undone.`}
          confirmLabel="Delete"
          busy={busyId === toDelete._id}
          onConfirm={handleDelete}
          onCancel={() => settoDelete(null)}
        />
      )}
    </div>
  );
}

export default MyProducts;
