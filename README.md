# World Cup Log

Track your personal journey through the 2026 FIFA World Cup. Logs which matches you've watched (highlights and/or full match) with a note per match, displays live scores, and tracks your viewing streak.

## Stack

| Layer           | Technology                               |
| --------------- | ---------------------------------------- |
| Frontend        | React 19 + Vite 8 + Tailwind CSS 4       |
| Backend         | Node.js + Express 5                      |
| Database        | SQLite via better-sqlite3                |
| Auth            | JWT in HTTP-only cookie, bcrypt password |
| Match data      | football-data.org API v4                 |
| Process manager | PM2                                      |
| Reverse proxy   | Nginx                                    |

## Features

- All 104 World Cup matches (group stage + knockout rounds)
- Two independent checkboxes per match: Highlights and Full Match
- Inline note editing per match
- Live score updates (2-min refresh during live matches, 30-min baseline)
- Progress dashboard: completion %, current streak, longest streak
- Dark/light mode following system preference
- Export personal data as JSON; re-import after server rebuild
- Public read-only view; owner-only writes

## Environment Variables

All in `server/.env` (see `server/.env.example`):

| Variable                | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `PORT`                  | Express port (default 3003)                                   |
| `NODE_ENV`              | `development` or `production`                                 |
| `DB_PATH`               | Path to SQLite file (default `./data/worldcuplog.db`)         |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key                                     |
| `JWT_SECRET`            | Random secret for signing JWTs                                |
| `OWNER_USERNAME`        | Login username                                                |
| `OWNER_PASSWORD_HASH`   | bcrypt hash of your password                                  |
| `CORS_ORIGIN`           | Allowed CORS origin (e.g. `https://worldcuplog.romitraj.dev`) |

Generate a password hash:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 12));"
```

## Local Development

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure server environment
cp server/.env.example server/.env
# Edit server/.env with your values

# 3. Start the backend
cd server && npm run dev

# 4. Start the frontend (separate terminal)
cd client && npm run dev

# Frontend: http://localhost:5173
# API:      http://localhost:3003
```

## Deployment (Ubuntu 24.04)

### 1. Server setup

```bash
# Install Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Install SQLite3 CLI (for backups)
sudo apt install -y sqlite3
```

### 2. Deploy code

```bash
# Clone / copy the repo to the server
git clone <your-repo> /var/www/worldcuplog
cd /var/www/worldcuplog

# Install server deps
cd server && npm install --production

# Build the frontend
cd ../client && npm install && npm run build
```

### 3. Configure environment

```bash
cp /var/www/worldcuplog/server/.env.example /var/www/worldcuplog/server/.env
# Edit with production values:
nano /var/www/worldcuplog/server/.env
# Set NODE_ENV=production, real API key, strong JWT_SECRET, etc.
```

### 4. PM2 process manager

```bash
cd /var/www/worldcuplog/server
pm2 start src/index.js --name worldcuplog
pm2 save
pm2 startup   # follow the printed command to enable on reboot
```

### 5. Nginx

```bash
sudo cp /var/www/worldcuplog/nginx/worldcuplog.conf /etc/nginx/sites-available/worldcuplog.conf
sudo ln -s /etc/nginx/sites-available/worldcuplog.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

### 6. HTTPS with Certbot

```bash
sudo certbot --nginx -d worldcuplog.romitraj.dev
# Certbot auto-inserts SSL config and sets up renewal cron
```

### 7. Database backups

```bash
# Make the backup script executable
chmod +x /var/www/worldcuplog/scripts/backup-db.sh

# Test it
/var/www/worldcuplog/scripts/backup-db.sh

# Add to cron for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /var/www/worldcuplog/scripts/backup-db.sh >> /var/log/wcl-backup.log 2>&1
```

## Data Architecture

Two distinct concerns in SQLite:

- **`matches`** — fixture and score data from football-data.org. Disposable: the server re-fetches it automatically and on every restart.
- **`personal`** — your watched status, notes, and streak dates. Irreplaceable. Export this regularly.

The personal layer is keyed by football-data.org match ID. If the server is rebuilt from scratch: re-fetch matches (happens on startup), then import your JSON backup via the UI.

## Export / Backup Strategy

Two complementary approaches:

1. **JSON export** (UI) — exports your `personal` table as a portable JSON file. Re-importable against any fresh DB that has had its matches populated. Use this to survive a full server rebuild.
2. **SQLite file backup** (`scripts/backup-db.sh`) — copies the raw `.db` file. Fastest restore; fails if the new server uses a different schema version.

Both are recommended. Run the JSON export occasionally from the UI; run the shell backup daily via cron.
