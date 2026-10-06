import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiImage, FiX } from "react-icons/fi";
import API_URL, { CATEGORIES, CITIES, CONDITIONS } from "../constants";
import { useApp } from "../store";
import { errorMessage, imageUrl } from "../utils";
import { Field, State } from "./ui";

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

function PhotoInput({ label, file, existing, invalid, onPick, onRemove }) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || existing;

  return (
    <div className={'drop' + (invalid ? ' invalid' : '')}>
      {shown && <img src={shown} alt={label} />}
      {shown && onRemove && (
        <button type="button" className="icon-btn drop-remove" onClick={onRemove} aria-label={'Remove ' + label}><FiX /></button>
      )}
      {!shown && (
        <div>
          <FiImage size={22} />
          <div>{label}</div>
          <div className="small">JPG, PNG or WebP · up to 5 MB</div>
        </div>
      )}
      <input
        type="file"
        accept={IMAGE_TYPES.join(',')}
        aria-label={label}
        onChange={(e) => {
          onPick(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// Used for both "Sell an item" and "Edit listing".
function ProductForm() {
  const { productId } = useParams();
  const editing = Boolean(productId);
  const navigate = useNavigate();
  const { user, loc, toast } = useApp();

  const defaultCity = (CITIES.find((item) => item.loc === loc) || {}).name || '';
  const [form, setform] = useState({ pname: '', pdesc: '', price: '', category: '', condition: 'Good', city: defaultCity });
  const [pimage, setpimage] = useState(null);
  const [pimage2, setpimage2] = useState(null);
  const [existing, setexisting] = useState({ pimage: '', pimage2: '' });
  const [removeImage2, setRemoveImage2] = useState(false);
  const [errors, seterrors] = useState({});
  const [error, seterror] = useState('');
  const [busy, setbusy] = useState(false);
  const [status, setstatus] = useState(editing ? 'loading' : 'ready');

  useEffect(() => {
    if (!editing) return;
    axios.get(`${API_URL}/get-product/${productId}`)
      .then((res) => {
        const p = res.data.product;
        if (p.addedBy._id !== user.userId && user.role !== 'admin') {
          seterror('You can only edit your own listings.');
          setstatus('error');
          return;
        }
        setform({
          pname: p.pname, pdesc: p.pdesc || '', price: String(p.price),
          category: p.category, condition: p.condition, city: p.city || ''
        });
        setexisting({ pimage: imageUrl(p.pimage), pimage2: imageUrl(p.pimage2) });
        setstatus('ready');
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setstatus('error');
      });
  }, [editing, productId, user]);

  const set = (key) => (e) => {
    setform({ ...form, [key]: e.target.value });
    if (errors[key]) seterrors({ ...errors, [key]: undefined });
  };

  const pickPhoto = (setter, key) => (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast('Photos must be JPG, PNG, WebP or GIF.', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('Each photo must be under 5 MB.', 'error');
      return;
    }
    setter(file);
    if (key === 'pimage2') setRemoveImage2(false);
    if (errors[key]) seterrors({ ...errors, [key]: undefined });
  };

  const validate = () => {
    const found = {};
    const title = form.pname.trim();
    if (title.length < 3 || title.length > 80) found.pname = 'Title must be between 3 and 80 characters.';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) found.price = 'Enter a price (0 for free).';
    else if (Number(form.price) > 10000000) found.price = 'That price is too high.';
    if (!form.category) found.category = 'Choose a category.';
    if (!form.city) found.city = 'Choose a city.';
    if (!pimage && !existing.pimage) found.pimage = 'Add at least one photo.';
    return found;
  };

  const handleApi = (e) => {
    e.preventDefault();
    const found = validate();
    seterrors(found);
    if (Object.keys(found).length) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (pimage) formData.append('pimage', pimage);
    if (pimage2) formData.append('pimage2', pimage2);
    if (removeImage2) formData.append('removeImage2', 'true');

    setbusy(true);
    seterror('');
    axios.post(API_URL + (editing ? '/edit-product/' + productId : '/add-product'), formData)
      .then((res) => {
        toast(res.data.message);
        navigate('/product/' + res.data.productId);
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setbusy(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  if (status === 'loading') {
    return (
      <div className="page page-narrow">
        <div className="panel" aria-busy="true">
          <div className="skeleton skeleton-line" style={{ width: '50%', height: 24, marginTop: 0 }} />
          <div className="skeleton skeleton-line" style={{ height: 44, marginTop: 24 }} />
          <div className="skeleton skeleton-line" style={{ height: 110 }} />
          <div className="skeleton skeleton-line" style={{ height: 44 }} />
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="page">
        <State error icon={<FiAlertTriangle />} title="Cannot edit this listing" text={error}>
          <Link className="btn" to="/my-products">My listings</Link>
        </State>
      </div>
    );
  }

  const secondShown = removeImage2 ? '' : existing.pimage2;

  return (
    <div className="page page-narrow">
      <h1>{editing ? 'Edit listing' : 'Sell an item'}</h1>
      <p className="muted" style={{ margin: '6px 0 22px' }}>
        {editing ? 'Update the details buyers see.' : 'Good photos and a clear title help your item sell faster.'}
      </p>

      <form className="panel" onSubmit={handleApi} noValidate>
        {error && <div className="alert" role="alert">{error}</div>}

        <div className="label" style={{ marginBottom: 8 }}>Photos</div>
        <div className="photos">
          <PhotoInput
            label="Main photo"
            file={pimage}
            existing={existing.pimage}
            invalid={Boolean(errors.pimage)}
            onPick={pickPhoto(setpimage, 'pimage')}
            onRemove={pimage ? () => setpimage(null) : null}
          />
          <PhotoInput
            label="Second photo (optional)"
            file={pimage2}
            existing={secondShown}
            onPick={pickPhoto(setpimage2, 'pimage2')}
            onRemove={() => {
              if (pimage2) setpimage2(null); else setRemoveImage2(true);
            }}
          />
        </div>
        <div className="field">
          {errors.pimage && <span className="field-error">{errors.pimage}</span>}
        </div>

        <Field label="Title" error={errors.pname} hint={form.pname.length + '/80'}>
          <input
            className={'input' + (errors.pname ? ' invalid' : '')}
            type="text"
            maxLength={80}
            placeholder="e.g. Engineering Mathematics by B.S. Grewal"
            value={form.pname}
            onChange={set('pname')}
          />
        </Field>

        <Field label="Description" hint={form.pdesc.length + '/1000'}>
          <textarea
            className="textarea"
            maxLength={1000}
            placeholder="Age, condition, what is included, where to pick it up…"
            value={form.pdesc}
            onChange={set('pdesc')}
          />
        </Field>

        <div className="row-2">
          <Field label="Price (₹)" error={errors.price} hint="Enter 0 to give it away for free.">
            <input
              className={'input' + (errors.price ? ' invalid' : '')}
              type="number"
              min="0"
              inputMode="numeric"
              value={form.price}
              onChange={set('price')}
            />
          </Field>
          <Field label="Category" error={errors.category}>
            <select className={errors.category ? 'invalid' : ''} value={form.category} onChange={set('category')}>
              <option disabled value="">Select a category</option>
              {CATEGORIES.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="row-2">
          <Field label="City" error={errors.city}>
            <select className={errors.city ? 'invalid' : ''} value={form.city} onChange={set('city')}>
              <option disabled value="">Select a city</option>
              {CITIES.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Condition">
            <div className="segmented">
              {CONDITIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={form.condition === item ? 'active' : ''}
                  onClick={() => setform({ ...form, condition: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={busy}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Post listing'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
