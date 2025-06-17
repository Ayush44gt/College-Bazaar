import { Link } from "react-router-dom";
import Header from "./Header";
import { useState } from "react";
import axios from "axios";
import API_URL from "../constants";
import { FaUser, FaPhone, FaEnvelope, FaLock } from "react-icons/fa";

function Signup() {

    const [username, setusername] = useState('');
    const [password, setpassword] = useState('');
    const [email, setemail] = useState('');
    const [mobile, setmobile] = useState('');


    const handleApi = () => {
        const url = API_URL + '/signup';
        const data = { username, password, mobile, email };
        axios.post(url, data)
            .then((res) => {
                if (res.data.message) {
                    alert(res.data.message);
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
            <h3 className="text-center mb-4 text-primary">Welcome to Signup Page</h3>
  
            <div className="mb-3">
              <label className="form-label">Username</label>
              <div className="input-group">
                <span className="input-group-text"><FaUser /></span>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  placeholder="Enter username"
                  onChange={(e) => setusername(e.target.value)}
                />
              </div>
            </div>
  
            <div className="mb-3">
              <label className="form-label">Mobile</label>
              <div className="input-group">
                <span className="input-group-text"><FaPhone /></span>
                <input
                  type="text"
                  className="form-control"
                  value={mobile}
                  placeholder="Enter mobile number"
                  onChange={(e) => setmobile(e.target.value)}
                />
              </div>
            </div>
  
            <div className="mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                <span className="input-group-text"><FaEnvelope /></span>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  placeholder="Enter email"
                  onChange={(e) => setemail(e.target.value)}
                />
              </div>
            </div>
  
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  placeholder="Enter password"
                  onChange={(e) => setpassword(e.target.value)}
                />
              </div>
            </div>
  
            <button className="btn btn-success w-100 mb-3" onClick={handleApi}>
              Sign Up
            </button>
  
            <div className="text-center">
              <span>Already have an account?</span>
              <Link className="ms-2 text-decoration-none text-primary" to="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
}

export default Signup;