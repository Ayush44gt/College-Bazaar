import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle } from "react-icons/fi";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage, formatDate } from "../utils";
import { Field, State } from "./ui";

function MyProfile() {
  const { toast } = useApp();

  const [user, setuser] = useState(null);
  const [stats, setstats] = useState({ listings: 0, sold: 0, saved: 0 });
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');

  const [form, setform] = useState({ email: '', mobile: '', college: '' });
  const [errors, seterrors] = useState({});
  const [saving, setsaving] = useState(false);

  const [passwords, setpasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setpasswordError] = useState('');
  const [changing, setchanging] = useState(false);

  const load = useCallback(() => {
    setstatus('loading');
    axios.get(API_URL + '/my-profile')
      .then((res) => {
        setuser(res.data.user);
        setstats(res.data.stats);
        setform({
          email: res.data.user.email || '',
          mobile: res.data.user.mobile || '',
          college: res.data.user.college || ''
        });
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

  const set = (key) => (e) => {
    setform({ ...form, [key]: e.target.value });
    if (errors[key]) seterrors({ ...errors, [key]: undefined });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const found = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) found.email = 'Enter a valid email address.';
    if (!/^[0-9]{10}$/.test(form.mobile)) found.mobile = 'Enter a 10-digit mobile number.';
    if (form.college.trim().length < 2) found.college = 'Enter your college name.';
    seterrors(found);
    if (Object.keys(found).length) return;

    setsaving(true);
    axios.post(API_URL + '/update-profile', form)
      .then((res) => {
        setuser(res.data.user);
        toast(res.data.message);
      })
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setsaving(false));
  };

  const handlePassword = (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      setpasswordError('Enter your current password.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setpasswordError('New password must be at least 6 characters.');
      return;
    }
    setpasswordError('');
    setchanging(true);
    axios.post(API_URL + '/change-password', passwords)
      .then((res) => {
        setpasswords({ currentPassword: '', newPassword: '' });
        toast(res.data.message);
      })
      .catch((err) => setpasswordError(errorMessage(err)))
      .finally(() => setchanging(false));
  };

  if (status === 'loading') {
    return (
      <div className="page page-narrow">
        <div className="panel" aria-busy="true">
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 20 }} />
          <div className="skeleton skeleton-line" style={{ height: 44, marginTop: 24 }} />
          <div className="skeleton skeleton-line" style={{ height: 44 }} />
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="page">
        <State error icon={<FiAlertTriangle />} title="Could not load your profile" text={error}>
          <button className="btn" onClick={load}>Try again</button>
        </State>
      </div>
    );
  }

  const changed = form.email !== (user.email || '') || form.mobile !== (user.mobile || '') || form.college !== (user.college || '');

  return (
    <div className="page page-narrow">
      <div className="profile-head">
        <span className="avatar avatar-lg">{user.username[0]}</span>
        <div>
          <h1>{user.username}</h1>
          <div className="inline" style={{ marginTop: 6 }}>
            <span className={'pill ' + (user.role === 'admin' ? 'pill-accent' : '')}>
              {user.role === 'admin' ? 'Administrator' : 'Student'}
            </span>
            <span className="muted small">Member since {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="stats">
        <Link className="stat" to="/my-products"><span>Listings</span><strong>{stats.listings}</strong></Link>
        <Link className="stat" to="/my-products"><span>Sold</span><strong>{stats.sold}</strong></Link>
        <Link className="stat" to="/liked-products"><span>Saved</span><strong>{stats.saved}</strong></Link>
      </div>

      <form className="panel" onSubmit={handleSave} noValidate>
        <div className="panel-head">
          <div>
            <h2>Contact details</h2>
            <span className="muted small">Buyers see these when they ask for your contact.</span>
          </div>
        </div>
        <Field label="College" error={errors.college}>
          <input className={'input' + (errors.college ? ' invalid' : '')} type="text" value={form.college} onChange={set('college')} />
        </Field>
        <div className="row-2">
          <Field label="Email" error={errors.email}>
            <input className={'input' + (errors.email ? ' invalid' : '')} type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Mobile" error={errors.mobile}>
            <input className={'input' + (errors.mobile ? ' invalid' : '')} type="tel" maxLength={10} value={form.mobile} onChange={set('mobile')} />
          </Field>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving || !changed}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>

      <form className="panel" onSubmit={handlePassword} noValidate>
        <div className="panel-head"><h2>Change password</h2></div>
        {passwordError && <div className="alert" role="alert">{passwordError}</div>}
        <div className="row-2">
          <Field label="Current password">
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(e) => setpasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) => setpasswords({ ...passwords, newPassword: e.target.value })}
            />
          </Field>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" type="submit" disabled={changing}>{changing ? 'Updating…' : 'Update password'}</button>
        </div>
      </form>
    </div>
  );
}

export default MyProfile;
