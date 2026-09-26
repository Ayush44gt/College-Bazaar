# College Bazaar

> A campus marketplace where students buy and sell used books, electronics and accessories within their own college.

Textbooks, cycles, laptops and hostel furniture change hands constantly on a
campus — usually through noisy WhatsApp groups where listings scroll away in a
day. College Bazaar gives that trade a searchable home, scoped to people you
actually share a campus with.

```
React 18 · React Router · Node.js · Express · MongoDB · JWT · Multer
```

---

## Features

- **Post an item** in seconds — title, description, price, category and up to two photos
- **Browse by category** — Bikes, Mobiles, Laptops, Electronics, Cloth, Plots, Rent, To Let, Sale
- **Search** across listing titles and descriptions
- **Location-aware listings** — each product carries GeoJSON coordinates, indexed for proximity queries
- **Like and save** items to revisit later
- **Seller profiles** — see everything a given student has listed, and contact them
- **My listings** — manage what you've posted

---

## Notable details

**Listings are geo-indexed, not just tagged with a place name.** Each product
stores its location as a GeoJSON `Point` with a `2dsphere` index on
`pLoc`, so "what's for sale near me" is a MongoDB proximity query rather than a
string match on a city field — and it stays correct across campuses in the same
city.

**Two images per listing, handled at the edge of the request.** `multer`'s
`upload.fields` accepts `pimage` and `pimage2` in one multipart request, so a
seller uploads a front and back shot in a single submit rather than a two-step
flow.

**Auth is stateless.** Signup hashes the password, login returns a JWT, and the
client attaches it to subsequent calls — no server-side session store to keep
in sync.

---

## Architecture

```
college-bazaar/
├── node-app/                    # Express API
│   ├── controllers/
│   │   ├── productController.js # listings: add, search, fetch, mine
│   │   └── userController.js    # signup, login, profile, likes
│   ├── uploads/                 # multipart image destination
│   └── index.js                 # app wiring and routes
└── react-app/                   # React client
    └── src/components/
        ├── Home.jsx             # feed
        ├── Categories.jsx       # category browsing
        ├── CategoryPage.jsx
        ├── AddProduct.jsx       # create a listing
        ├── ProductDetail.jsx
        ├── MyProducts.jsx
        ├── LikedProducts.jsx
        ├── MyProfile.jsx
        └── Login.jsx / Signup.jsx
```

### Data model

| Model | Fields |
|---|---|
| **Products** | `pname`, `pdesc`, `price`, `category`, `pimage`, `pimage2`, `addedBy`, `pLoc` (GeoJSON `Point`, `2dsphere` indexed) |
| **Users** | `name`, `email`, `password`, `likedProducts[]` |

---

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/signup` | Create an account |
| `POST` | `/login` | Authenticate, returns a JWT |
| `GET` | `/get-user/:uId` | Public profile for a seller |
| `GET` | `/my-profile/:userId` | The caller's profile |
| `POST` | `/add-product` | Create a listing (multipart: `pimage`, `pimage2`) |
| `GET` | `/get-products` | All listings |
| `GET` | `/get-product/:pId` | A single listing |
| `GET` | `/search?...` | Search listings |
| `POST` | `/my-products` | Listings created by a user |
| `POST` | `/like-product` | Like or unlike a listing |
| `POST` | `/liked-products` | The caller's liked listings |

---

## Running it locally

**Prerequisites:** Node.js 18+ and a MongoDB instance (local or Atlas).

```bash
git clone https://github.com/Ayush44gt/College-Bazaar.git
cd College-Bazaar
```

**API**

```bash
cd node-app
npm install
```

Create `node-app/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/college-bazaar
JWT_SECRET=your_jwt_signing_secret
```

```bash
npx nodemon index.js      # http://localhost:5000
```

**Client**

```bash
cd ../react-app
npm install
npm start                 # http://localhost:3000
```

The API base URL lives in `react-app/src/constants.js`.

---

## Tech stack

| Layer | Choices |
|---|---|
| **Frontend** | React 18, React Router 6, Axios, react-icons |
| **Backend** | Node.js, Express, Mongoose, JWT, multer, body-parser, CORS |
| **Database** | MongoDB with a `2dsphere` geospatial index |

---

## Author

**Ayush Garg** — [GitHub](https://github.com/Ayush44gt) · [LinkedIn](https://www.linkedin.com/in/ayush44/)
