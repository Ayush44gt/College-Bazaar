import './index.css';
import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import axios from 'axios';
import { AppProvider, clearSession } from './store';
import Layout, { RequireAuth } from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ProductForm from './components/ProductForm';
import LikedProducts from './components/LikedProducts';
import ProductDetail from './components/ProductDetail';
import MyProducts from './components/MyProducts';
import MyProfile from './components/MyProfile';
import Admin from './components/Admin';
import NotFound from './components/NotFound';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

axios.interceptors.response.use((res) => res, (err) => {
  if (err.response && err.response.status === 401) {
    clearSession();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=1';
      // the page is leaving; keep callers pending so they don't show an error first
      return new Promise(() => { });
    }
  }
  return Promise.reject(err);
});

const router = createBrowserRouter([
  {
    element: (<AppProvider><Layout /></AppProvider>),
    children: [
      { path: "/", element: (<Home />) },
      { path: "/category/:catName", element: (<Home />) },
      { path: "/product/:productId", element: (<ProductDetail />) },
      { path: "/login", element: (<Login />) },
      { path: "/signup", element: (<Signup />) },
      { path: "/add-product", element: (<RequireAuth><ProductForm /></RequireAuth>) },
      { path: "/edit-product/:productId", element: (<RequireAuth><ProductForm /></RequireAuth>) },
      { path: "/liked-products", element: (<RequireAuth><LikedProducts /></RequireAuth>) },
      { path: "/my-products", element: (<RequireAuth><MyProducts /></RequireAuth>) },
      { path: "/my-profile", element: (<RequireAuth><MyProfile /></RequireAuth>) },
      { path: "/admin", element: (<RequireAuth admin><Admin /></RequireAuth>) },
      { path: "*", element: (<NotFound />) },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
