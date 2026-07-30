# Bizmate AI

Bizmate AI is a small-business command center for shops. It helps owners manage sales, stock, expenses, staff attendance, salary calculation, and printable bills from one responsive web app.

## Highlights

- Demo Mode with no login or Firebase dependency
- Multiple shop management
- Inventory with SKU, quantity, purchase price, selling price, and reorder level
- Sales entry with inventory item selection and automatic price calculation
- Printable bill generation
- Expense tracking
- Staff attendance with present/absent counts
- Salary payable calculation from daily wage and present days
- CSV export and print support
- Light/dark glassmorphic UI
- Firebase Authentication and Cloud Firestore support for real deployments

## Demo Mode

Click `Try demo` on the sign-in screen to launch the app with seeded sample data. Demo changes are saved in browser `localStorage`, so judges can test the product without creating an account or relying on backend setup.

## Tech Stack

- HTML
- CSS
- JavaScript modules
- Vite
- Firebase Authentication
- Cloud Firestore
- localStorage demo fallback

## Run Locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open:

```text
http://127.0.0.1:5173/
```

## Firebase Setup

Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

Add your Firebase web app credentials to `.env`.

Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore --project bizmate-c4bbf
```

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## Hackathon Notes

The app keeps Firebase for the production backend story, but Demo Mode is designed for reliable hackathon judging. Judges can use all core features immediately without registration, network-sensitive Firestore setup, or billing/rules issues.
