import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage } from "../utils";
import { Field } from "./ui";

function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login, toast } = useApp();

  const [username, setusername] = useState('');
  const [password, setpassword] = useState('');
  const [error, seterror] = useState('');
  const [busy, setbusy] = useState(false);

  // only follow links back into this site
  const requested = params.get('next') || '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  if (user) {
    return <Navigate to={next} replace />;
  }

  const handleApi = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      seterror('Enter your username and password.');
      return;
    }
    setbusy(true);
    seterror('');
    axios.post(API_URL + '/login', { username, password })
      .then((res) => {
        login(res.data);
        toast('Welcome back, ' + res.data.username + '.');
        navigate(next, { replace: true });
      })
      .catch((err) => {
        seterror(errorMessage(err));
        setbusy(false);
      });
  };

  return (
    <div className="auth">
      <form className="panel auth-card" onSubmit={handleApi} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Log in to sell, save listings and contact sellers.</p>

        {params.get('expired') && !error && (
          <div className="alert alert-info">Please log in again to continue.</div>
        )}
        {error && <div className="alert" role="alert">{error}</div>}

        <Field label="Username">
          <input
            className="input"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setusername(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
          />
        </Field>

        <button className="btn btn-block" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <div className="auth-foot">
          New here? <Link className="link" to="/signup">Create an account</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
