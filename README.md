# Spirit Admin

Static admin dashboard for the Spirit Clicker backend.

## What it shows

- online users
- total players
- current weekly season
- season history
- league counts
- top preview per league
- full top 50 per league
- winners and payouts for archived weeks
- admin form for setting weekly gross revenue and payout fund

## How to use

1. Open `index.html` locally or deploy this folder to Vercel / GitHub Pages.
2. Enter:
   - `API Base URL`, for example `https://ryoho.onrender.com`
   - `Admin Token`, which must match `ADMIN_DASHBOARD_TOKEN` on the backend
3. Click `Refresh`

## Backend endpoints used

- `GET /api/admin/overview`
- `GET /api/admin/weekly-tournament/seasons`
- `GET /api/admin/weekly-tournament/season/{season_key}`
- `POST /api/admin/weekly-tournament/season/{season_key}/fund`

## Notes

- this project is intentionally static, so it stays separate from the main game codebase
- settings are stored in `localStorage`
