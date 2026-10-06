# College Bazaar

> A campus marketplace where students buy and sell used books, electronics and hostel essentials.

Textbooks, cycles, laptops and hostel furniture change hands constantly on a
campus — usually through noisy WhatsApp groups where listings scroll away in a
day. College Bazaar gives that trade a searchable home.

```
React 18 · React Router · Node.js · Express · MongoDB · JWT · Multer
```

---

## Features

- **Browse** listings by category and city, **search** titles and descriptions, and **sort** by date or price
- **Post an item** with a title, description, price, category, condition, city and up to two photos
- **Manage your listings** — edit, mark as sold, relist or delete
- **Save** listings with the heart and find them again under Saved
- **Contact sellers** — phone and email are shown to logged-in users only
- **Profile** — update your contact details and change your password
- **Admin** — stats, a user table (block / unblock) and a listings table (delete)
- Responsive layout, light and dark themes, loading skeletons, empty and error states

---

## Architecture

```
college-bazaar/
├── node-app/                    # Express API
│   ├── controllers/
│   │   ├── productController.js # listings and images
│   │   └── userController.js    # accounts, saved listings, admin
│   ├── middleware/              # login check and error handling
│   ├── models/                  # User, Product, Image
│   ├── constants.js             # categories, conditions, cities
│   ├── seed.js                  # demo data
│   └── index.js                 # app wiring and routes
└── react-app/                   # React client
    └── src/
        ├── components/          # one file per page, plus Layout and shared ui
        ├── store.jsx            # logged-in user, saved listings, city, toasts
        ├── constants.js         # API URL, categories, cities
        └── index.css            # the whole design system
```

### Data model

| Model | Fields |
|---|---|
| **Users** | `username`, `email`, `mobile`, `college`, `password` (bcrypt hash), `role` (`user` / `admin`), `status` (`active` / `blocked`), `likedProducts[]` |
| **Products** | `pname`, `pdesc`, `price`, `category`, `condition`, `status` (`available` / `sold`), `pimage`, `pimage2`, `addedBy`, `city`, `pLoc` (GeoJSON `Point`, `2dsphere` indexed) |
| **Images** | `data` (binary), `contentType` |

Photos are stored in MongoDB, so nothing is written to the server's disk.
Listings from a blocked account are hidden from everyone.

---

## API

| Method | Route | Login | Purpose |
|---|---|---|---|
| `POST` | `/signup` | | Create an account |
| `POST` | `/login` | | Returns a JWT |
| `GET` | `/my-profile` | yes | The caller's profile and stats |
| `POST` | `/update-profile` | yes | Change email, mobile, college |
| `POST` | `/change-password` | yes | Change password |
| `GET` | `/get-user/:uId` | | A seller's public details |
| `GET` | `/seller-contact/:uId` | yes | A seller's phone and email |
| `GET` | `/get-products` | | Listings. Query: `catName`, `search`, `loc` (`lat,lng`), `sort`, `status`, `seller`, `page`, `limit` |
| `GET` | `/get-product/:pId` | | A single listing |
| `GET` | `/image/:imageId` | | A listing photo |
| `POST` | `/add-product` | yes | Create a listing (multipart: `pimage`, `pimage2`) |
| `POST` | `/edit-product/:pId` | owner / admin | Update a listing |
| `POST` | `/product-status/:pId` | owner / admin | Mark as `sold` or `available` |
| `POST` | `/delete-product/:pId` | owner / admin | Delete a listing |
| `POST` | `/my-products` | yes | The caller's listings |
| `POST` | `/like-product`, `/unlike-product` | yes | Save or un-save a listing |
| `POST` | `/liked-products` | yes | The caller's saved listings |
| `GET` | `/admin/stats`, `/admin/users`, `/admin/products` | admin | Admin page data |
| `POST` | `/admin/user-status/:uId` | admin | Block or unblock a user |

---

## Running it locally

**Prerequisites:** Node.js 18+ and a MongoDB database (Atlas or local).

**API**

```bash
cd node-app
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed              # optional: load demo data (wipes the database first)
npm run dev               # http://localhost:4000
```

**Client**

```bash
cd react-app
npm install
npm start                 # http://localhost:3000
```

### Demo data

`npm run seed` creates 15 users and about 70 listings across eight cities.
Every demo account uses the password `demo1234`:

| Username | What it shows |
|---|---|
| `admin` | The admin page |
| `aarav_sharma` | A seller with many listings, some sold |
| `newbie_01` | A new account with nothing listed or saved |
| `spam_seller` | A blocked account: cannot log in, listings hidden |

---

## Author

**Ayush Garg** — [GitHub](https://github.com/Ayush44gt) · [LinkedIn](https://www.linkedin.com/in/ayush44/)
