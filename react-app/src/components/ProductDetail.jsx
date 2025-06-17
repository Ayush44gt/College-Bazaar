import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import API_URL from "../constants";

function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [showContact, setShowContact] = useState(false);

  const { productId } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/get-product/${productId}`);
        if (res.data.product) {
          setProduct(res.data.product);
        }
      } catch {
        alert("Server error fetching product.");
      }
    };
    fetchProduct();
  }, [productId]);

  const handleContact = async (addedBy) => {
    try {
      const res = await axios.get(`${API_URL}/get-user/${addedBy}`);
      if (res.data.user) {
        setUser(res.data.user);
        setShowContact(true);
      }
    } catch {
      alert("Server error fetching user.");
    }
  };

  return (
    <>
      <Header />
      <div className="container mt-4">
        {product ? (
          <div className="row">
            {/* Images and description */}
            <div className="col-md-7">
              <div className="mb-3">
                <img
                  className="img-fluid mb-2"
                  style={{ maxHeight: "200px", objectFit: "cover", width: "70%" }}
                  src={`${API_URL}/${product.pimage}`}
                  alt="Product"
                />
                {product.pimage2 && (
                  <img
                    className="img-fluid"
                    style={{ maxHeight: "200px", objectFit: "cover", width: "70%" }}
                    src={`${API_URL}/${product.pimage2}`}
                    alt="Product"
                  />
                )}
              </div>
              <h5 className="fw-semibold">Product Description:</h5>
              <p className="text-muted">{product.pdesc}</p>
            </div>

            {/* Price & seller details */}
            <div className="col-md-5">
              <div className="border rounded p-3 shadow-sm">
                <h3 className="text-danger">₹ {product.price}</h3>
                <p className="fw-bold mb-2">
                  {product.pname} | <span className="text-secondary">{product.category}</span>
                </p>

                {product.addedBy && !showContact && (
                  <button
                    onClick={() => handleContact(product.addedBy)}
                    className="btn btn-primary mt-3"
                  >
                    Show Contact Details
                  </button>
                )}

                {showContact && user && (
                  <div className="mt-3">
                    <h5 className="mb-1">Seller: {user.username}</h5>
                    <p className="mb-1">📞 {user.mobile}</p>
                    <p className="text-muted">📧 {user.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center mt-5">Loading product details...</p>
        )}
      </div>
    </>
  );
}

export default ProductDetail;
