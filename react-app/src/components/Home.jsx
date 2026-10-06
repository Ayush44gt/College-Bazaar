import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FiAlertTriangle, FiSearch, FiX } from "react-icons/fi";
import API_URL, { CITIES, SORTS } from "../constants";
import { useApp } from "../store";
import { errorMessage } from "../utils";
import { GridSkeleton, ProductCard, State } from "./ui";

function Home() {
  const { catName } = useParams();
  const [params, setParams] = useSearchParams();
  const { loc, setLoc, user } = useApp();

  const search = params.get('q') || '';
  const sort = params.get('sort') || 'newest';

  const [products, setproducts] = useState([]);
  const [total, settotal] = useState(0);
  const [page, setpage] = useState(1);
  const [pages, setpages] = useState(1);
  const [status, setstatus] = useState('loading');
  const [error, seterror] = useState('');
  const latest = useRef(0);

  const load = useCallback((nextPage) => {
    const request = ++latest.current;
    setstatus(nextPage === 1 ? 'loading' : 'more');

    axios.get(API_URL + '/get-products', { params: { catName, search, sort, loc, page: nextPage } })
      .then((res) => {
        // ignore answers to an older request
        if (request !== latest.current) return;
        setproducts((current) => (nextPage === 1 ? res.data.products : [...current, ...res.data.products]));
        settotal(res.data.total);
        setpage(res.data.page);
        setpages(res.data.pages);
        setstatus('ready');
      })
      .catch((err) => {
        if (request !== latest.current) return;
        seterror(errorMessage(err));
        setstatus('error');
      });
  }, [catName, search, sort, loc]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleSort = (value) => {
    const next = new URLSearchParams(params);
    if (value === 'newest') next.delete('sort'); else next.set('sort', value);
    setParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next);
  };

  const city = CITIES.find((item) => item.loc === loc);
  const title = search ? `Results for “${search}”` : catName ? catName : 'Fresh on campus';
  const showHero = !search && !catName;

  return (
    <div className="page">
      {showHero && (
        <section className="hero">
          <h1>Buy and sell with students on your campus.</h1>
          <p>Textbooks, laptops, cycles and hostel essentials — passed on by seniors, picked up by juniors.</p>
          <Link className="btn" to={user ? '/add-product' : '/signup'}>
            {user ? 'Sell something' : 'Create a free account'}
          </Link>
        </section>
      )}

      <div className="toolbar">
        <div>
          <h1>{title}</h1>
          <div className="inline" style={{ marginTop: 8 }}>
            <span className="muted small">
              {status === 'loading' ? 'Loading…' : `${total} ${total === 1 ? 'listing' : 'listings'}`}
            </span>
            {search && (
              <span className="tag">“{search}” <button onClick={clearSearch} aria-label="Clear search"><FiX /></button></span>
            )}
            {city && (
              <span className="tag">{city.name} <button onClick={() => setLoc('')} aria-label="Clear city"><FiX /></button></span>
            )}
          </div>
        </div>
        <select className="select" value={sort} onChange={(e) => handleSort(e.target.value)} aria-label="Sort listings">
          {SORTS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {status === 'loading' && <GridSkeleton />}

      {status === 'error' && (
        <State error icon={<FiAlertTriangle />} title="Could not load listings" text={error}>
          <button className="btn" onClick={() => load(1)}>Try again</button>
        </State>
      )}

      {(status === 'ready' || status === 'more') && products.length === 0 && (
        <State
          icon={<FiSearch />}
          title="Nothing here yet"
          text={search || city || catName
            ? 'No listings match what you picked. Try another city, category or search term.'
            : 'Be the first to list something for sale.'}
        >
          {(search || city) ? (
            <button className="btn btn-ghost" onClick={() => { clearSearch(); setLoc(''); }}>Clear filters</button>
          ) : (
            <Link className="btn" to="/add-product">Sell an item</Link>
          )}
        </State>
      )}

      {(status === 'ready' || status === 'more') && products.length > 0 && (
        <>
          <div className="grid">
            {products.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
          {page < pages && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button className="btn btn-ghost" onClick={() => load(page + 1)} disabled={status === 'more'}>
                {status === 'more' ? 'Loading…' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
