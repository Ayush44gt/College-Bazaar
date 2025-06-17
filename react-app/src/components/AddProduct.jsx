import { useEffect, useState } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import categories from "./CategoriesList";
import API_URL from "../constants";

function AddProduct() {
  const navigate = useNavigate();
  const [pname, setpname] = useState('');
  const [pdesc, setpdesc] = useState('');
  const [price, setprice] = useState('');
  const [category, setcategory] = useState('');
  const [pimage, setpimage] = useState('');
  const [pimage2, setpimage2] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleApi = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      const formData = new FormData();
      formData.append('plat', position.coords.latitude);
      formData.append('plong', position.coords.longitude);
      formData.append('pname', pname);
      formData.append('pdesc', pdesc);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('pimage', pimage);
      formData.append('pimage2', pimage2);
      formData.append('userId', localStorage.getItem('userId'));

      axios.post(API_URL + '/add-product', formData)
        .then((res) => {
          if (res.data.message) {
            alert(res.data.message);
            navigate('/');
          }
        })
        .catch(() => alert('Server error'));
    });
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Header />
      <div className="container mt-5 d-flex justify-content-center">
        <div className="card shadow p-4 w-100" style={{ maxWidth: "600px" }}>
          <h3 className="text-center text-primary mb-4">Add Product</h3>

          <div className="mb-3">
            <label className="form-label">Product Name</label>
            <input className="form-control" type="text" value={pname} onChange={(e) => setpname(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Product Description</label>
            <textarea className="form-control" rows={3} value={pdesc} onChange={(e) => setpdesc(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Product Price</label>
            <input className="form-control" type="number" value={price} onChange={(e) => setprice(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Product Category</label>
            <select className="form-select" value={category} onChange={(e) => setcategory(e.target.value)}>
              <option disabled value="">-- Select Category --</option>
              {categories?.map((item, index) => (
                <option key={'option' + index} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Product Image</label>
            <input className="form-control" type="file" onChange={(e) => setpimage(e.target.files[0])} />
          </div>

          <div className="mb-3">
            <label className="form-label">Product Second Image</label>
            <input className="form-control" type="file" onChange={(e) => setpimage2(e.target.files[0])} />
          </div>

          <button onClick={handleApi} className="btn btn-primary w-100 mt-2">
            Submit Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
