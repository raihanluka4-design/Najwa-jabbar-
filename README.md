# Online Hall Booking System

A client-side hall booking web app — register/login, browse halls, check live
availability, book/update/cancel, and an admin panel to manage halls and view
all bookings. No backend or build step required; data is saved in the
browser's local storage.

## Files

- `app.html` — the working application (open this to use the app)
- `script.js` — application logic (auth, halls, bookings, admin, reports)
- `project-report.html` + `style.css` + `report-script.js` — the original
  academic project-review page (problem statement, UML diagrams, etc.)

## Run it

Just open `app.html` in a browser — no install, no server.

Optional local server (some browsers restrict local files slightly):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/app.html
```

## Demo admin login

- Email: `admin@hallbook.app`
- Password: `admin123`

## Push this to GitHub

If you don't already have a repo:

```bash
cd hall-booking-system
git init
git add .
git commit -m "Initial commit: working hall booking system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If you already have a repo, just copy these files into it, then:

```bash
git add .
git commit -m "Add functional booking app"
git push
```

### Free hosting (optional)

Once pushed, you can serve it for free with **GitHub Pages**:

1. Repo → Settings → Pages
2. Source: `main` branch, root folder
3. Rename `app.html` to `index.html` (or add a redirect) so it loads at the
   root URL, since GitHub Pages serves `index.html` by default.

## Notes

- This is a front-end-only demo: accounts and bookings live in each visitor's
  own browser (`localStorage`), not a shared database. For real multi-device
  use (accounts shared across users), it would need a small backend — ask if
  you want that built next.
