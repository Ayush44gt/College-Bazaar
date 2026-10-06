import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiEdit2, FiHeart, FiMail, FiPhone, FiRotateCcw, FiShare2, FiTrash2 } from "react-icons/fi";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage, formatDate, formatPrice, imageUrl, timeAgo } from "../utils";
import { ConfirmDialog, ProductCard, State } from "./ui";

function DetailSkeleton() {
  return (
    <div className="detail" aria-busy="true">
      <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 16 }} />
      <div className="panel">
        <div className="skeleton skeleton-line" style={{ width: '40%', height: 30, marginTop: 0 }} />
        <div className="skeleton skeleton-line" style={{ width: '85%', height: 18 }} />
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton skeleton-line" style={{ height: 42, marginTop: 24 }} />
      </div>
    </div>
  );
}

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, liked, toggleLike, toast } = useApp();

  const [product, setProduct] = useState(null);
  const [likes, setLikes] = useState(0);
  const [more, setMore] = useState([]);
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');
  const [photo, setPhoto] = useState(0);
  const [contact, setContact] = useState(null);
  const [busy, setbusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    setstatus('loading');
    setContact(null);
    setPhoto(0);
    axios.get(`${API_URL}/get-product/${productId}`)
      .then((res) => {
        setProduct(res.data.product);
        setLikes(res.data.likes);
        setstatus('ready');
        return axios.get(API_URL + '/get-products', { params: { seller: res.data.product.addedBy._id, limit: 5 } });
      })
      .then((res) => {
        setMore(res.data.products.filter((item) => item._id !== productId).slice(0, 4));
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setstatus((current) => (current === 'ready' ? current : 'error'));
      });
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return <div className="page"><DetailSkeleton /></div>;
  }
  if (status === 'error') {
    return (
      <div className="page">
        <State error icon={<FiAlertTriangle />} title="Listing unavailable" text={error}>
          <Link className="btn" to="/">Browse listings</Link>
        </State>
      </div>
    );
  }

  const seller = product.addedBy;
  const isOwner = user && user.userId === seller._id;
  const canManage = isOwner || (user && user.role === 'admin');
  const sold = product.status === 'sold';
  const isLiked = liked.has(product._id);
  const photos = [product.pimage, product.pimage2].filter(Boolean);

  const handleContact = () => {
    if (!user) {
      navigate('/login?next=' + encodeURIComponent('/product/' + productId));
      return;
    }
    setbusy(true);
    axios.get(`${API_URL}/seller-contact/${seller._id}`)
      .then((res) => setContact(res.data.contact))
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setbusy(false));
  };

  const handleLike = () => {
    if (toggleLike(product._id)) {
      setLikes(likes + (isLiked ? -1 : 1));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast('Link copied.'))
      .catch(() => toast('Could not copy the link.', 'error'));
  };

  const handleStatus = () => {
    const next = sold ? 'available' : 'sold';
    setbusy(true);
    axios.post(`${API_URL}/product-status/${productId}`, { status: next })
      .then((res) => {
        setProduct({ ...product, status: next });
        toast(res.data.message);
      })
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setbusy(false));
  };

  const handleDelete = () => {
    setbusy(true);
    axios.post(`${API_URL}/delete-product/${productId}`)
      .then((res) => {
        toast(res.data.message);
        navigate(isOwner ? '/my-products' : '/', { replace: true });
      })
      .catch((err) => {
        toast(errorMessage(err), 'error');
        setbusy(false);
        setConfirmDelete(false);
      });
  };

  return (
    <div className="page">
      <button className="back" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>

      <div className="detail">
        <div>
          <div className="gallery-main">
            {sold && <span className="pill pill-dark badge-float">Sold</span>}
            <img key={photos[photo]} src={imageUrl(photos[photo])} alt={product.pname} />
          </div>
          {photos.length > 1 && (
            <div className="thumbs">
              {photos.map((path, index) => (
                <button
                  key={path}
                  className={'thumb' + (index === photo ? ' active' : '')}
                  onClick={() => setPhoto(index)}
                  aria-label={'Photo ' + (index + 1)}
                >
                  <img src={imageUrl(path)} alt="" />
                </button>
              ))}
            </div>
          )}

          <div className="panel" style={{ marginTop: 18 }}>
            <h2>Description</h2>
            <p className="desc">{product.pdesc || 'The seller did not add a description.'}</p>
            <div className="facts">
              <div className="fact"><span>Category</span><strong>{product.category}</strong></div>
              <div className="fact"><span>Condition</span><strong>{product.condition}</strong></div>
              <div className="fact"><span>City</span><strong>{product.city || '—'}</strong></div>
              <div className="fact"><span>Posted</span><strong>{formatDate(product.createdAt)}</strong></div>
            </div>
          </div>
        </div>

        <aside className="detail-side">
          <div className="panel">
            <div className="detail-price">{formatPrice(product.price)}</div>
            <div className="detail-title">{product.pname}</div>
            <div className="detail-meta">
              <span className={'pill ' + (sold ? 'pill-danger' : 'pill-success')}>{sold ? 'Sold' : 'Available'}</span>
              <span className="pill">{product.condition}</span>
              <span className="pill">{timeAgo(product.createdAt)}</span>
              <span className="pill">{likes} {likes === 1 ? 'save' : 'saves'}</span>
            </div>

            <div className="inline" style={{ marginTop: 18 }}>
              <button className={'btn btn-ghost' + (isLiked ? ' saved' : '')} onClick={handleLike} style={{ flex: 1 }}>
                <FiHeart style={isLiked ? { fill: '#e11d48', color: '#e11d48' } : undefined} />
                {isLiked ? 'Saved' : 'Save'}
              </button>
              <button className="btn btn-ghost" onClick={handleShare} style={{ flex: 1 }}><FiShare2 /> Share</button>
            </div>
          </div>

          <div className="panel">
            <div className="seller">
              <span className="avatar">{seller.username[0]}</span>
              <div>
                <strong>{seller.username}</strong>
                <div className="muted small">{seller.college || 'Student'} · Member since {formatDate(seller.createdAt)}</div>
              </div>
            </div>

            {isOwner ? (
              <p className="muted small" style={{ marginTop: 14 }}>This is your listing.</p>
            ) : contact ? (
              <div className="contact-box">
                <a href={'tel:' + contact.mobile}><FiPhone /> {contact.mobile}</a>
                <a href={'mailto:' + contact.email}><FiMail /> {contact.email}</a>
              </div>
            ) : sold ? (
              <p className="muted small" style={{ marginTop: 14 }}>This item has been sold.</p>
            ) : (
              <button className="btn btn-block" style={{ marginTop: 16 }} onClick={handleContact} disabled={busy}>
                {user ? 'Show contact details' : 'Log in to contact seller'}
              </button>
            )}
          </div>

          {canManage && (
            <div className="panel">
              <h3 style={{ marginBottom: 12 }}>{isOwner ? 'Manage your listing' : 'Admin actions'}</h3>
              <div className="stack">
                <Link className="btn btn-ghost" to={'/edit-product/' + product._id}><FiEdit2 /> Edit listing</Link>
                <button className="btn btn-ghost" onClick={handleStatus} disabled={busy}>
                  {sold ? <><FiRotateCcw /> Mark as available</> : <><FiCheckCircle /> Mark as sold</>}
                </button>
                <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  <FiTrash2 /> Delete listing
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {more.length > 0 && (
        <>
          <h2 className="section-title">More from {seller.username}</h2>
          <div className="grid">
            {more.map((item) => <ProductCard key={item._id} item={item} />)}
          </div>
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          danger
          title="Delete this listing?"
          text="It will be removed for everyone, including people who saved it. This cannot be undone."
          confirmLabel="Delete"
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default ProductDetail;
