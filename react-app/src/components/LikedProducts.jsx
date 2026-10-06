import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiHeart } from "react-icons/fi";
import API_URL from "../constants";
import { useApp } from "../store";
import { errorMessage } from "../utils";
import { GridSkeleton, ProductCard, State } from "./ui";

function LikedProducts() {
  const { liked } = useApp();
  const [products, setproducts] = useState([]);
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');

  const load = useCallback(() => {
    setstatus('loading');
    axios.post(API_URL + '/liked-products', {})
      .then((res) => {
        setproducts(res.data.products);
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

  // listings disappear from this page as soon as they are un-saved
  const shown = products.filter((item) => liked.has(item._id));

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1>Saved listings</h1>
          <span className="muted small">
            {status === 'ready' ? `${shown.length} saved` : 'Items you saved to come back to.'}
          </span>
        </div>
      </div>

      {status === 'loading' && <GridSkeleton count={4} />}

      {status === 'error' && (
        <State error icon={<FiAlertTriangle />} title="Could not load your saved listings" text={error}>
          <button className="btn" onClick={load}>Try again</button>
        </State>
      )}

      {status === 'ready' && shown.length === 0 && (
        <State icon={<FiHeart />} title="No saved listings yet" text="Tap the heart on any listing to keep it here for later.">
          <Link className="btn" to="/">Browse listings</Link>
        </State>
      )}

      {status === 'ready' && shown.length > 0 && (
        <div className="grid">
          {shown.map((item) => <ProductCard key={item._id} item={item} />)}
        </div>
      )}
    </div>
  );
}

export default LikedProducts;
