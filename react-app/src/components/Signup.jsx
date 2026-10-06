import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage } from "../utils";
import { Field } from "./ui";

const validate = ({ username, email, mobile, college, password }) => {
  const errors = {};
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) errors.username = '3-20 letters, numbers or underscores.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!/^[0-9]{10}$/.test(mobile)) errors.mobile = 'Enter a 10-digit mobile number.';
  if (college.trim().length < 2) errors.college = 'Enter your college name.';
  if (password.length < 6) errors.password = 'At least 6 characters.';
  return errors;
};

function Signup() {
  const navigate = useNavigate();
  const { user, toast } = useApp();

  const [form, setform] = useState({ username: '', email: '', mobile: '', college: '', password: '' });
  const [errors, seterrors] = useState({});
  const [error, seterror] = useState('');
  const [busy, setbusy] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const set = (key) => (e) => {
    setform({ ...form, [key]: e.target.value });
    if (errors[key]) seterrors({ ...errors, [key]: undefined });
  };

  const handleApi = (e) => {
    e.preventDefault();
    const found = validate(form);
    seterrors(found);
    if (Object.keys(found).length) return;

    setbusy(true);
    seterror('');
    axios.post(API_URL + '/signup', form)
      .then(() => {
        toast('Account created. Log in to get started.');
        navigate('/login');
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setbusy(false);
      });
  };

  const input = (key, props) => (
    <input className={'input' + (errors[key] ? ' invalid' : '')} value={form[key]} onChange={set(key)} {...props} />
  );

  return (
    <div className="auth">
      <form className="panel auth-card" onSubmit={handleApi} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Join your campus marketplace in a minute.</p>

        {error && <div className="alert" role="alert">{error}</div>}

        <Field label="Username" error={errors.username}>
          {input('username', { type: 'text', autoComplete: 'username', autoFocus: true })}
        </Field>
        <Field label="College" error={errors.college}>
          {input('college', { type: 'text', placeholder: 'e.g. IIT Delhi' })}
        </Field>
        <div className="row-2">
          <Field label="Email" error={errors.email}>
            {input('email', { type: 'email', autoComplete: 'email' })}
          </Field>
          <Field label="Mobile" error={errors.mobile}>
            {input('mobile', { type: 'tel', inputMode: 'numeric', maxLength: 10, autoComplete: 'tel' })}
          </Field>
        </div>
        <Field label="Password" error={errors.password} hint="At least 6 characters.">
          {input('password', { type: 'password', autoComplete: 'new-password' })}
        </Field>

        <button className="btn btn-block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <div className="auth-foot">
          Already have an account? <Link className="link" to="/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;
