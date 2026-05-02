# Production Deployment on a 1 GB Raspberry Pi

This is a focused runbook for the exact hardware you have:

- **Raspberry Pi with 1 GB RAM** (most likely Pi 3B / 3B+ — also works on Pi 4 1 GB).
- **8 GB microSD** for OS only.
- **256 GB SSD over USB** for everything else (database, app code, builds, swap).

It's tight but it works. The trick is: **don't build on the Pi**. You build on your laptop and rsync the result. That removes the only step that would otherwise OOM.

> If you ever upgrade to a 4 GB+ Pi, switch to [`deployment-raspberry-pi.md`](deployment-raspberry-pi.md) — that guide covers building on the device.

## Honest expectations

- Page latency is fine once it's running (Next.js renders cached TMDB data fast).
- Cold start after `pm2 restart` is ~5–10 seconds.
- Concurrent users: realistically 5–15 simultaneously without sweating. More than that and the 1 GB box will swap.
- TMDB cache hits hard on RAM. We'll cap Node heap at 384 MB to keep room for Postgres and the OS.
- **Pi 3 has USB 2.0 only**, so the SSD tops out around 30 MB/s. Still 10x faster than the SD card, and DB writes won't burn through your SD.

## What you need on your laptop

- This repo cloned with the same Node major version we'll run on the Pi (20.x).
- An SSH key set up for the Pi (`ssh-keygen -t ed25519` if you don't have one).
- `rsync` (built into macOS/Linux; on Windows use WSL).
- A TMDB v3 API key.

## What you need on the Pi side

- Pi connected to power and Ethernet (Wi-Fi works but is less reliable for a server).
- The 256 GB SSD on a USB cable that can carry power (a self-powered enclosure is ideal — bus-powered enclosures sometimes brown-out a Pi 3).

---

# Part 1 — One-time Pi setup

## Step 1. Flash the OS to the 8 GB SD

1. Install **Raspberry Pi Imager** on your laptop: https://www.raspberrypi.com/software/
2. Choose:
   - **Device**: your Pi model.
   - **OS**: `Raspberry Pi OS Lite (64-bit)` (Bookworm). Lite means no desktop. Critical on a 1 GB device.
   - **Storage**: your 8 GB microSD.
3. Click the gear (advanced settings):
   - Hostname: `campus`
   - Enable SSH with **public-key only** (paste your laptop's `~/.ssh/id_ed25519.pub`).
   - Username: pick one (not `pi`). Strong password.
   - Locale + Wi-Fi if needed.
4. Write. Eject.
5. Boot the Pi from the SD with Ethernet plugged in. Find its IP from your router's DHCP table or `ping campus.local`.

```bash
ssh <username>@campus.local
sudo apt update && sudo apt full-upgrade -y && sudo apt autoremove -y
sudo reboot
```

## Step 2. Mount the 256 GB SSD

Plug in the SSD. Then:

```bash
lsblk                                       # confirm the SSD shows as /dev/sda
sudo mkfs.ext4 -L campusdata /dev/sda1      # destroys data on the SSD!
sudo mkdir /data
sudo blkid /dev/sda1                        # copy the UUID
sudo nano /etc/fstab
```

Add this line to `/etc/fstab` (replace `<UUID>`):

```
UUID=<UUID> /data ext4 defaults,noatime 0 2
```

```bash
sudo mount -a
df -h /data                                  # should show ~256 GB free
sudo chown $USER:$USER /data
```

If your SSD is brand new and didn't auto-create a partition, run `sudo fdisk /dev/sda` first (`n` → defaults → `w`).

## Step 3. Add 2 GB swap on the SSD

**Critical for a 1 GB Pi.** Don't put swap on the SD card — it'll burn out fast. Disable the default SD-card swap and add a swapfile on the SSD:

```bash
sudo dphys-swapfile swapoff
sudo systemctl disable --now dphys-swapfile

sudo fallocate -l 2G /data/swapfile
sudo chmod 600 /data/swapfile
sudo mkswap /data/swapfile
sudo swapon /data/swapfile

# make permanent
echo '/data/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

free -h                                      # confirm 2 GB swap
```

Set swappiness low so it only swaps under real pressure:

```bash
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Step 4. System hardening

Same minimums as the bigger guide:

```bash
# disable SSH password auth (you already use a key)
sudo sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable

# auto security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# brute-force protection
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

We deliberately are **not** opening 80/443 yet — we'll use a Cloudflare Tunnel below, which doesn't need any inbound ports.

## Step 5. Install Node 20, Postgres 16, PM2

```bash
# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs git

# Postgres
sudo apt install -y postgresql postgresql-contrib

# PM2
sudo npm install -g pm2

node -v       # v20.x
psql --version
pm2 -v
```

We are **not** installing `build-essential` or `caddy` here. We won't build on the Pi, and we'll use Cloudflare Tunnel instead of Caddy. That saves ~250 MB of disk and a chunk of RAM.

## Step 6. Move Postgres data dir onto the SSD

The DB will live on the SSD, not the SD card.

```bash
sudo systemctl stop postgresql
sudo rsync -av /var/lib/postgresql/ /data/postgresql/
sudo chown -R postgres:postgres /data/postgresql
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Update this line:

```
data_directory = '/data/postgresql/16/main'
```

While you're in that file, paste this aggressive 1 GB-friendly tuning (replace existing values for these keys):

```
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 20
wal_compression = on
checkpoint_timeout = 15min
wal_buffers = 8MB
random_page_cost = 1.5
effective_io_concurrency = 100
```

Save and start Postgres:

```bash
sudo systemctl start postgresql
psql -U postgres -c 'SHOW data_directory;'    # should print /data/postgresql/16/main
```

## Step 7. Create the app database

```bash
sudo -u postgres psql <<SQL
CREATE ROLE campus WITH LOGIN PASSWORD 'change-this-strong-password';
CREATE DATABASE streaming_app OWNER campus;
GRANT ALL PRIVILEGES ON DATABASE streaming_app TO campus;
SQL

PGPASSWORD='change-this-strong-password' psql -h 127.0.0.1 -U campus -d streaming_app -c 'SELECT 1;'
```

You'll need that password again in `.env.local`.

## Step 8. Prepare the app directory on the SSD

```bash
sudo mkdir -p /data/campusstream
sudo chown $USER:$USER /data/campusstream
mkdir -p /data/campusstream/backups
```

We won't `git clone` on the Pi — we'll rsync from your laptop in the next part.

---

# Part 2 — Build on your laptop, deploy to the Pi

This is the part that makes a 1 GB Pi feasible. We do all the heavy lifting on your laptop and push the result.

## Step 9. Build the app on your laptop

On your **laptop**:

```bash
cd /path/to/Streaming\ Website
git pull --ff-only

# install with the exact lockfile
npm ci

# Make sure your laptop's Node major matches the Pi (Node 20).
node -v       # should be v20.x

# build
npm run build

# also generate a Pi-runtime-only Prisma client
# (Prisma's client includes platform-specific binaries; we'll let the Pi regenerate
# its own client during the deploy. Don't ship node_modules from your laptop.)
```

## Step 10. Rsync the app to the Pi

We push only what's needed to run, not 1.5 GB of `node_modules` from your laptop. The Pi will run its own `npm ci` once.

On your **laptop**, in the repo root:

```bash
rsync -av --delete \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=backups \
  --exclude=tests \
  ./ <username>@campus.local:/data/campusstream/
```

This pushes:
- `package.json`, `package-lock.json`
- `prisma/` (schema + migrations)
- `src/`, `public/`, `next.config.mjs`, `tsconfig.json`, etc.
- The freshly built `.next/` directory
- `scripts/` and `docs/`

Now SSH into the Pi:

```bash
ssh <username>@campus.local
cd /data/campusstream
```

## Step 11. Install runtime deps on the Pi

We install with `npm ci --omit=dev` so devDependencies (TypeScript, ESLint, Playwright, etc.) are skipped. Saves ~700 MB.

```bash
npm ci --omit=dev
npm run prisma:generate           # builds Prisma's ARM client
```

This step is RAM-light because there's no compilation; it's all download + extract. It takes 5–10 minutes on a Pi 3.

## Step 12. Configure `.env.local` on the Pi

```bash
nano /data/campusstream/.env.local
```

Paste:

```env
ENABLE_DATABASE="true"
DATABASE_URL="postgresql://campus:change-this-strong-password@127.0.0.1:5432/streaming_app"

TMDB_API_KEY="<your-tmdb-v3-key>"
ADMIN_INTERNAL_KEY="<32-char-random-secret>"

NEXT_PUBLIC_PLAY_HOST="https://www.playimdb.com"
NEXT_PUBLIC_VIDKING_BASE="https://www.vidking.net"
NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD="false"

UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
SENTRY_DSN=""

PREFLIGHT_STRICT_EXTERNALS="false"
```

Generate a strong admin key on your laptop and paste it:

```bash
openssl rand -hex 32
```

Lock down the file:

```bash
chmod 600 /data/campusstream/.env.local
```

## Step 13. Apply database migrations

```bash
cd /data/campusstream
npm run prisma:migrate:deploy
npm run prisma:status              # everything 'applied'
```

## Step 14. Smoke test before PM2

```bash
npm run preflight:prod
NODE_OPTIONS="--max-old-space-size=384" npm run start:prod &
sleep 8
curl -sS http://127.0.0.1:3000/api/system/readiness | head
kill %1
```

Look for `"ok": true`. Some `tmdb` warnings are tolerable; database must be `ok`.

## Step 15. Run under PM2 with a capped heap

This is the step that keeps the 1 GB Pi alive. We cap Node's old-space heap at 384 MB. With Postgres around 200 MB, OS around 150 MB, and Node at 384 MB, we have headroom:

```bash
cd /data/campusstream
pm2 start npm --name campusstream \
  --node-args="--max-old-space-size=384" \
  -- run start:prod:checked
pm2 logs campusstream
```

Auto-start on boot:

```bash
pm2 save
pm2 startup systemd -u $USER --hp $HOME
# copy/paste the command it prints (needs sudo)
sudo systemctl enable pm2-$USER
```

Reboot to verify it survives:

```bash
sudo reboot
# after it comes back:
ssh <username>@campus.local
pm2 status                           # campusstream should be 'online'
curl -sS http://127.0.0.1:3000/api/system/readiness
```

---

# Part 3 — Make it reachable from the internet

For a 1 GB Pi sitting at home, we strongly recommend Cloudflare Tunnel. It needs no port forwarding and adds an edge HTTPS + DDoS layer for free.

If you want LAN-only access, skip this section and just hit `http://campus.local:3000` from machines on the same network.

## Step 16. Cloudflare Tunnel

Prereqs:
- A domain on Cloudflare (a free `*.cloudflareaccess.com` tunnel works for testing too).
- A Cloudflare account.

On the Pi:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
```

In the Cloudflare dashboard:

1. Zero Trust → Networks → Tunnels → Create a tunnel.
2. Name it `campusstream`. Copy the install token shown.
3. On the Pi:

```bash
sudo cloudflared service install <token-from-dashboard>
sudo systemctl status cloudflared
```

4. Back in the dashboard, add a Public Hostname:
   - Subdomain: `campus`
   - Domain: your domain
   - Service type: `HTTP`
   - URL: `localhost:3000`

Visit `https://campus.<your-domain>`. Cloudflare terminates HTTPS at the edge and tunnels to your Pi. No router config needed.

## Step 16b. Pure LAN-only access (skip if you set up Cloudflare)

```bash
# allow Pi-LAN connections to port 3000
sudo ufw allow from 192.168.0.0/16 to any port 3000
```

Visit `http://campus.local:3000` from any machine on your home Wi-Fi.

---

# Part 4 — Backups, monitoring, ongoing operations

## Step 17. Daily Postgres backup

```bash
crontab -e
```

Append:

```
30 3 * * * cd /data/campusstream && DATABASE_URL='postgresql://campus:<password>@127.0.0.1:5432/streaming_app' BACKUP_DIR=/data/campusstream/backups npm run db:backup >> /data/campusstream/backups/backup.log 2>&1
0 4 * * 0 find /data/campusstream/backups -name 'streaming-app-*.sql' -mtime +30 -delete
```

Backups land on the SSD. **Strongly** recommend copying them off-Pi too — install `rclone`, configure a free backend (Google Drive / B2 / Dropbox), and add an `rclone copy` to the cron.

## Step 18. Healthcheck cron (auto-restart on hang)

A 1 GB box can occasionally OOM and leave Node in a half-dead state. This catches it:

```
*/5 * * * * curl -sf http://127.0.0.1:3000/api/system/readiness > /dev/null || pm2 restart campusstream
```

## Step 19. Log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 25M
pm2 set pm2-logrotate:retain 14
```

## Step 20. Optional: Sentry for error capture

In `/data/campusstream/.env.local`:

```env
SENTRY_DSN="https://<...>@sentry.io/<project-id>"
```

```bash
pm2 restart campusstream
```

Free Sentry tier covers a small deployment comfortably.

---

# Part 5 — Update flow

This is what you'll actually run when you push code changes. **All builds happen on your laptop, never the Pi.**

On your **laptop**:

```bash
cd /path/to/Streaming\ Website
git pull --ff-only
npm ci
npm run verify:release         # lint + typecheck + build

rsync -av --delete \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=backups \
  --exclude=tests \
  ./ <username>@campus.local:/data/campusstream/
```

Then on the **Pi**:

```bash
ssh <username>@campus.local
cd /data/campusstream

# only re-run if package-lock changed
npm ci --omit=dev
npm run prisma:generate

# only re-run if there's a new migration
npm run prisma:migrate:deploy

pm2 restart campusstream
pm2 logs campusstream --lines 100
curl -sS http://127.0.0.1:3000/api/system/readiness | head
```

Total time per update: usually 2–5 minutes.

---

# Troubleshooting

**`pm2 status` shows the app `errored`.**
`pm2 logs campusstream --err --lines 200`. Most common cause on 1 GB: OOM. Verify Node heap cap (`pm2 describe campusstream | grep -i max-old-space-size`) — should be 384.

**`/api/system/readiness` returns 503.**
Check the JSON body. `database: not ok` → `sudo systemctl status postgresql`. `tmdb: not ok` and persistent → bad/missing API key. Transient TMDB warnings are tolerable.

**Pi reboots randomly.**
Power supply or SSD brown-out. Use the official Pi power supply. If the SSD enclosure is bus-powered, switch to a self-powered one or a powered USB hub.

**Build runs out of memory on the Pi.**
You're not supposed to build on the Pi at all. Build on your laptop and rsync.

**Site is sluggish under load.**
1 GB box. Check `top` while reproducing. If `node` is at >90 % consistently, you're past the realistic ceiling for this hardware. Postgres being CPU-bound usually means a missing index — check pg_stat_statements.

**SD card stops booting after a few months.**
Expected if you ever ran swap from it. We avoided that. If it does happen, the OS is on the SD but **all your data is on the SSD** — reflash a new SD with the same hostname/user, plug everything back in, and the Pi will pick up `/data/postgresql` and `/data/campusstream` automatically.

**`npm ci` on the Pi takes forever.**
It will take 5–10 min the first time on Pi 3 with USB 2.0. Subsequent runs are mostly cache hits.

---

# What we cut compared to the standard guide

For honesty, here's what this 1 GB path drops compared to [`deployment-raspberry-pi.md`](deployment-raspberry-pi.md):

- No Caddy on the Pi. Cloudflare handles HTTPS at the edge. (You can still run Caddy if you must — it costs ~30 MB RAM.)
- No on-device builds. You build on the laptop and rsync.
- No `build-essential`. Saves disk and rules out source-build deps.
- No multi-instance PM2. One worker only.
- Trimmed Postgres tuning (less aggressive `shared_buffers`, smaller `work_mem`).

Everything else — TV shows, ratings, watch tracking, mini-player, calendar, themes (if you re-enable them), Sentry, backups — works identically.
