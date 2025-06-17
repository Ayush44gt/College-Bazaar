import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import { useState } from "react";
import axios from "axios";
import API_URL from "../constants";
import { FaUser, FaLock } from "react-icons/fa";

function Login() {
    const navigate = useNavigate()

    const [username, setusername] = useState('');
    const [password, setpassword] = useState('');

    const handleApi = () => {
        const url = API_URL + '/login';
        const data = { username, password };
        axios.post(url, data)
            .then((res) => {
                if (res.data.message) {
                    if (res.data.token) {
                        localStorage.setItem('token', res.data.token);
                        localStorage.setItem('userId', res.data.userId);
                        navigate('/');
                    }
                }
            })
            .catch((err) => {
                alert('SERVER ERR')
            })
    }
    return (
        <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        <Header />
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
          <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
            <h3 className="text-center mb-4 text-primary">Welcome to Login Page</h3>
  
            <div className="mb-3">
              <label className="form-label">Username</label>
              <div className="input-group">
                <span className="input-group-text"><FaUser /></span>
                <input
                  className="form-control"
                  type="text"
                  value={username}
                  placeholder="Enter username"
                  onChange={(e) => setusername(e.target.value)}
                />
              </div>
            </div>
  
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <input
                  className="form-control"
                  type="password"
                  value={password}
                  placeholder="Enter password"
                  onChange={(e) => setpassword(e.target.value)}
                />
              </div>
            </div>
  
            <button className="btn btn-primary w-100 mb-3" onClick={handleApi}>
              Login
            </button>
  
            <div className="text-center">
              <span>Don't have an account?</span>
              <Link className="ms-2 text-decoration-none text-success" to="/signup">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
}

export default Login;