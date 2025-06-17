import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { FaSearch } from "react-icons/fa";
import { useState } from "react";

function Header(props) {
  const [loc, setLoc] = useState(null);
  const [showOver, setshowOver] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  let locations = [
    {
      latitude: 28.6139,
      longitude: 77.209,
      placeName: "New Delhi, Delhi",
    },
    {
      latitude: 19.076,
      longitude: 72.8777,
      placeName: "Mumbai, Maharashtra",
    },
  ];

  return (
    <div className="header-container d-flex justify-content-between">
      <div className="header">
        <Link className="links p-2" to="/">
          CollegeBazaar 
        </Link>
        <select
          value={loc}
          onChange={(e) => {
            localStorage.setItem("userLoc", e.target.value);
            setLoc(e.target.value);
          }}
        >
          {locations.map((item, index) => {
            return (
              <option value={`${item.latitude},${item.longitude}`}>
                {item.placeName}
              </option>
            );
          })}
        </select>
        <input
          className="search"
          type="text"
          value={props && props.search}
          onChange={(e) =>
            props.handlesearch && props.handlesearch(e.target.value)
          }
        />
        <button
          className="search-btn"
          onClick={() => props.handleClick && props.handleClick()}
        >
          {" "}
          <FaSearch />{" "}
        </button>
      </div>

      <div>
        <div
          onClick={() => {
            setshowOver(!showOver);
          }}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#002f34",
            width: "40px",
            height: "40px",
            color: "#fff",
            fontSize: "14px",
            borderRadius: "50%",
          }}
        >
          {" "}
          N{" "}
        </div>

        {showOver && (
  <div
    style={{
      position: "absolute",
      top: "60px",
      right: "20px",
      zIndex: 10,
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "10px",
      boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
      width: "220px",
      padding: "10px",
    }}
  >
    {!!localStorage.getItem("token") && (
      <>
        <Link to="/add-product" className="dropdown-item">
          <button className="btn btn-outline-primary w-100 mb-2">Add Product</button>
        </Link>
        <Link to="/liked-products" className="dropdown-item">
          <button className="btn btn-outline-primary w-100 mb-2">Favourites</button>
        </Link>
        <Link to="/my-products" className="dropdown-item">
          <button className="btn btn-outline-primary w-100 mb-2">My Ads</button>
        </Link>
      </>
    )}

    {!localStorage.getItem("token") ? (
      <Link to="/login" className="text-decoration-none text-center d-block">
        <button className="btn btn-success w-100">Login</button>
      </Link>
    ) : (
      <button className="btn btn-danger w-100" onClick={handleLogout}>
        Logout
      </button>
    )}
  </div>
)}

      </div>
    </div>
  );
}

export default Header;
