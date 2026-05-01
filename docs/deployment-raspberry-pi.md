# Production Deployment on a Raspberry Pi

This is the complete, step-by-step runbook for taking CampusStream from a fresh Raspberry Pi to a real production deployment. It covers hardware, OS install, security hardening, database, app, reverse proxy, HTTPS, monitoring, backups, and a tested deploy/update flow.

You only have to do the **One-time** sections once. After that, daily operation is just the **Update flow** at the bottom.

> Audience: someone who can SSH into a Pi and copy/paste shell commands. No prior production-ops experience required.

## Table of contents

- [Hardware and prerequisites](#hardware-and-prerequisites)
- [Pick your access model](#pick-your-access-model)
- [One-time: OS install + initial boot](#one-time-os-install--initial-boot)
- [One-time: System hardening](#one-time-system-hardening)
- [One-time: Storage on an SSD](#one-time-storage-on-an-ssd)
- [One-time: Install Node, Postgres, PM2, Caddy](#one-time-install-node-postgres-pm2-caddy)
- [One-time: Postgres setup and tuning](#one-time-postgres-setup-and-tuning)
- [One-time: Clone and configure the app](#one-time-clone-and-configure-the-app)
- [One-time: Build and run with PM2 + systemd](#one-time-build-and-run-with-pm2--systemd)
- [One-time: Reverse proxy + HTTPS (3 options)](#one-time-reverse-proxy--https-3-options)
- [One-time: Backups and monitoring](#one-time-backups-and-monitoring)
- [One-time: Security checklist](#one-time-security-checklist)
- [Update flow](#update-flow)
- [Troubleshooting](#troubleshooting)
- [Disaster recovery](#disaster-recovery)
- [Appendix: tuning numbers for Pi 4 / Pi 5](#appendix-tuning-numbers-for-pi-4--pi-5)

---

## Hardware and prerequisites

### Minimum

- Raspberry Pi 4 Model B with **at least 4 GB RAM** (8 GB strongly recommended).
- 64 GB+ microSD card for boot (Class A2 or better) **only as a fallback**.
- Wired Ethernet to a router (Wi-Fi works but is less reliable for a server).
- Official Pi power supply (under-volting kills DBs).

### Strongly recommended

- **Raspberry Pi 5 with 8 GB or 16 GB RAM**. The 5 is roughly 2x the 4 and the difference is felt during `next build`.
- **External USB 3.0 SSD or NVMe HAT** for `/var/lib/postgresql` and `/srv/campusstream`. SD cards wear out under DB load; an SSD is the single biggest reliability upgrade you can make.
- **Active cooling**: a fan or heatsink case. Postgres + Node.js + a build will throttle a passively cooled Pi.
- **UPS / battery backup**: cheap insurance against power-loss DB corruption.

### On your laptop you need

- A way to write the Pi OS image (Raspberry Pi Imager).
- An SSH client (built into macOS, Linux; on Windows use the OpenSSH client or PuTTY).
- Your TMDB v3 API key.
- A domain name you control (only required for option B/C reverse proxy paths below; pure intranet works without one).

## Pick your access model

Decide this before you start. It changes a few later steps.

| Model | Best when | What you need |
| --- | --- | --- |
| **A. Public via router port-forwarding** | You own a domain and your ISP gives you a public IP. | Domain, port forward 80/443 → Pi. |
| **B. Public via Cloudflare Tunnel** *(recommended)* | You want the safest path with no port forwards. Pi stays invisible. | Cloudflare account + free domain on Cloudflare. |
| **C. Private via Tailscale (campus-only)** | Only logged-in members of your network/campus need it. | Tailscale account. No port forwarding, no public DNS. |

We'll cover all three under [Reverse proxy + HTTPS](#one-time-reverse-proxy--https-3-options).

---

## One-time: OS install + initial boot

1. Install **Raspberry Pi Imager** on your laptop: https://www.raspberrypi.com/software/
2. Insert your microSD card into your laptop.
3. In the Imager, choose:
   - Device: your Pi model.
   - OS: **Raspberry Pi OS Lite (64-bit)**. Lite means no desktop. We don't need it.
   - Storage: your microSD.
4. Click the gear icon (advanced settings) and configure:
   - **Hostname**: `campusstream`
   - **Enable SSH**: yes, with **public-key authentication only** (paste your laptop's `~/.ssh/id_ed25519.pub`; generate one with `ssh-keygen -t ed25519` if you don't have one).
   - **Username/password**: pick a unique username (not `pi`) and a strong password.
   - **Wireless LAN** (optional): only if you can't use Ethernet.
   - **Locale**: your time zone and keyboard.
5. Write the image. Eject the SD when done.
6. Insert the SD into the Pi, plug in Ethernet, then power.
7. Find the Pi's IP. Easiest: check your router's DHCP table for `campusstream`. Or run on your laptop:

```bash
ping campusstream.local        # works if your router supports mDNS
```

8. SSH in:

```bash
ssh <username>@campusstream.local
# or
ssh <username>@<pi-ip>
```

Update everything:

```bash
sudo apt update && sudo apt full-upgrade -y && sudo apt autoremove -y
sudo reboot
```

Reconnect after reboot.

## One-time: System hardening

These are minimum production-grade steps.

### Static IP (DHCP reservation is also fine)

If you want to set a static IP from the Pi side, edit `/etc/dhcpcd.conf`:

```
interface eth0
static ip_address=192.168.1.50/24
static routers=192.168.1.1
static domain_name_servers=1.1.1.1 8.8.8.8
```

`sudo systemctl restart dhcpcd && sudo reboot`. Reserving the IP at the router is usually simpler.

### Disable password SSH (you already use a key)

```bash
sudo nano /etc/ssh/sshd_config
```

Set:

```
PasswordAuthentication no
PermitRootLogin no
```

Then:

```bash
sudo systemctl restart ssh
```

Test from a *new* terminal before logging out.

### Firewall

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp                   # SSH
# Open 80/443 only if you'll port-forward (Option A). Skip for B/C.
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

### Automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Fail2ban (defense in depth)

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

## One-time: Storage on an SSD

If you're staying on the SD card you can skip this section, but it is highly recommended for any Pi that will run a database.

### Boot the Pi from USB SSD (Pi 4/5)

The simplest approach:

1. Power off the Pi.
2. Connect a USB 3.0 SSD (or use an NVMe HAT on Pi 5).
3. Use Raspberry Pi Imager again, this time targeting the SSD.
4. Pull the SD card out and boot. On Pi 4, ensure `boot_order` is set to USB first (`sudo raspi-config` → Advanced Options → Boot Order). Pi 5 boots from USB out of the box.

### Or: keep SD for boot, mount SSD for data

Format and mount the SSD at `/data`, then move Postgres and the app onto it:

```bash
sudo mkfs.ext4 /dev/sda1
sudo mkdir /data
sudo blkid /dev/sda1                                 # note the UUID
sudo nano /etc/fstab                                 # add: UUID=<uuid> /data ext4 defaults,noatime 0 2
sudo mount -a
```

We'll point Postgres' data dir at `/data/postgresql` later.

## One-time: Install Node, Postgres, PM2, Caddy

### Node.js 20 LTS via NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs build-essential git
node -v        # expect v20.x
npm -v
```

### Postgres 16

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
psql --version
```

### PM2 (process manager)

```bash
sudo npm install -g pm2
```

### Caddy (reverse proxy + automatic HTTPS)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
sudo systemctl enable --now caddy
```

### Optional: Cloudflare Tunnel client (if using Option B)

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
```

### Optional: Tailscale (if using Option C)

```bash
curl -fsSL https://tailscale.com/install.sh | sudo sh
sudo tailscale up
```

## One-time: Postgres setup and tuning

### Move data dir to the SSD (only if you mounted /data)

```bash
sudo systemctl stop postgresql
sudo rsync -av /var/lib/postgresql/ /data/postgresql/
sudo chown -R postgres:postgres /data/postgresql
sudo nano /etc/postgresql/16/main/postgresql.conf
# update: data_directory = '/data/postgresql/16/main'
sudo systemctl start postgresql
psql -U postgres -c 'SHOW data_directory;'   # verify
```

### Create the app role and database

```bash
sudo -u postgres psql <<SQL
CREATE ROLE campus WITH LOGIN PASSWORD 'change-this-strong-password';
CREATE DATABASE streaming_app OWNER campus;
GRANT ALL PRIVILEGES ON DATABASE streaming_app TO campus;
SQL
```

Test:

```bash
PGPASSWORD='change-this-strong-password' psql -h 127.0.0.1 -U campus -d streaming_app -c 'SELECT 1;'
```

### Tune for the Pi

Edit `/etc/postgresql/16/main/postgresql.conf` and adjust based on your RAM. Conservative starting values for **8 GB Pi**:

```
shared_buffers = 1GB
effective_cache_size = 4GB
work_mem = 16MB
maintenance_work_mem = 128MB
max_connections = 50
wal_compression = on
checkpoint_timeout = 15min
wal_buffers = 16MB
random_page_cost = 1.1     # SSD
effective_io_concurrency = 200
```

For a **4 GB Pi**, halve those (shared_buffers 512 MB, effective_cache_size 2 GB).

```bash
sudo systemctl restart postgresql
```

## One-time: Clone and configure the app

### Pick a system user

Don't run the app as root. Either use the user you created during install, or create a dedicated one:

```bash
sudo adduser --disabled-password --gecos "" campusstream
sudo usermod -aG sudo campusstream
sudo mkdir -p /srv/campusstream
sudo chown campusstream:campusstream /srv/campusstream
sudo -iu campusstream
```

(Or just keep using your install user. Either is fine for a single-tenant Pi.)

### Clone

```bash
cd /srv
git clone <your-repo-url> campusstream
cd campusstream
```

### Install dependencies

```bash
npm ci
```

(Use `npm ci` not `npm install` for production; it pins to `package-lock.json` exactly.)

### Create `.env.local`

```bash
nano .env.local
```

Paste and edit:

```env
ENABLE_DATABASE="true"
DATABASE_URL="postgresql://campus:change-this-strong-password@127.0.0.1:5432/streaming_app"

TMDB_API_KEY="<your-tmdb-v3-key>"
ADMIN_INTERNAL_KEY="<32-char-random-secret>"

NEXT_PUBLIC_PLAY_HOST="https://www.playimdb.com"
NEXT_PUBLIC_VIDKING_BASE="https://www.vidking.net"
NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD="false"

# Optional: enable if you have Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: Sentry
SENTRY_DSN=""

# Production preflight tolerance for transient TMDB outages
PREFLIGHT_STRICT_EXTERNALS="false"
```

Generate a strong admin key:

```bash
openssl rand -hex 32
```

### Apply migrations

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:status                  # all migrations should show "applied"
```

## One-time: Build and run with PM2 + systemd

### Add temporary swap (only needed on 4 GB Pi for the build)

If you're on a 4 GB model, the build step may OOM. Add 2 GB swap:

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile        # set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
free -m
```

You can leave it on permanently or revert after the first successful build.

### Build

```bash
npm run verify:release    # lint + typecheck + build (15–30 min on Pi 4, 5–10 min on Pi 5)
```

### Smoke test

```bash
npm run preflight:prod
npm run start:prod &
sleep 5
curl -sS http://127.0.0.1:3000/api/system/readiness | head
kill %1
```

You want `"ok": true` (or near-true with TMDB warnings if the network is jittery).

### Run under PM2

```bash
pm2 start "npm run start:prod:checked" --name campusstream --cwd /srv/campusstream
pm2 logs campusstream                  # watch logs
pm2 status
```

### Make PM2 auto-start on boot

```bash
pm2 save
pm2 startup systemd -u $USER --hp $HOME
# copy/paste the printed command (it requires sudo)
sudo systemctl enable pm2-$USER
sudo reboot
# after reboot:
pm2 status                             # campusstream should be 'online'
```

### Verify

```bash
curl -sS http://127.0.0.1:3000/api/system/readiness
```

## One-time: Reverse proxy + HTTPS (3 options)

You only need ONE of these. Pick based on the access model you chose at the start.

### Option A: Public domain + port forward + Caddy

Best when: you have a domain and a public IP.

1. In your router, forward TCP **80** and **443** to the Pi's local IP.
2. Make an A record: `campus.example.com → <your public IP>`.
3. On the Pi, replace `/etc/caddy/Caddyfile` with:

```Caddyfile
campus.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

4. `sudo systemctl restart caddy && sudo journalctl -u caddy -f`

Caddy will fetch a Let's Encrypt cert automatically. Visit `https://campus.example.com`.

### Option B: Cloudflare Tunnel *(recommended)*

Best when: safety matters, you don't want to open router ports, and your domain is on Cloudflare.

1. In Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create tunnel.
2. Choose Cloudflared, name it `campusstream`. Save the token shown.
3. On the Pi:

```bash
sudo cloudflared service install <token-from-dashboard>
sudo systemctl status cloudflared
```

4. Back in the dashboard, add a public hostname:
   - Subdomain: `campus`
   - Domain: `example.com`
   - Service type: `HTTP`
   - URL: `localhost:3000`
5. Cloudflare provisions HTTPS at the edge and tunnels to your Pi. No firewall changes needed. Visit `https://campus.example.com`.

In this model you can close port 80/443 in `ufw` since nothing inbound is needed.

### Option C: Tailscale (private only)

Best when: only members of your Tailnet should reach the app.

1. Already installed (`sudo tailscale up`). Note the Tailscale IP/hostname (`100.x.x.x` or `pi.<tailnet>.ts.net`).
2. Replace Caddyfile with:

```Caddyfile
campus.<tailnet>.ts.net {
    reverse_proxy 127.0.0.1:3000
    tls internal
}
```

3. Add MagicDNS in the Tailscale admin, or just hit `http://100.x.x.x:3000` directly.

Anyone on the Tailnet can reach it; nobody else can. No public DNS, no port forwarding.

## One-time: Backups and monitoring

### Daily Postgres backup

```bash
sudo mkdir -p /srv/backups && sudo chown $USER /srv/backups
crontab -e
```

Add (runs at 03:30 daily):

```
30 3 * * * cd /srv/campusstream && DATABASE_URL='postgresql://campus:<password>@127.0.0.1:5432/streaming_app' BACKUP_DIR=/srv/backups npm run db:backup >> /srv/backups/backup.log 2>&1
0 4 * * 0 find /srv/backups -name "streaming-app-*.sql" -mtime +30 -delete
```

The first line backs up nightly; the second prunes anything older than 30 days.

### Off-Pi backup copy (highly recommended)

If a flood/theft destroys the Pi, the backups go with it. Copy them off:

- Easiest: install `rclone`, configure a free backend (Google Drive, B2, Dropbox), and add `rclone copy /srv/backups remote:campusstream-backups` to the cron.

### Healthcheck cron

Catches dead servers before users do:

```
*/5 * * * * curl -sf http://127.0.0.1:3000/api/system/readiness > /dev/null || pm2 restart campusstream
```

Optional external uptime monitor: free tier on UptimeRobot or BetterStack hitting `https://campus.example.com/api/system/readiness`.

### Sentry

In `.env.local`:

```env
SENTRY_DSN="https://<...>@sentry.io/<project-id>"
```

`pm2 restart campusstream`. Errors will now appear in Sentry.

### Logs

PM2 keeps app logs at `~/.pm2/logs/`. Rotate them:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
```

## One-time: Security checklist

Run through this before going live:

- [ ] SSH password auth disabled.
- [ ] `ufw` enabled with only the ports you need open.
- [ ] `unattended-upgrades` running.
- [ ] `fail2ban` running.
- [ ] Postgres bound to `127.0.0.1` only (default).
- [ ] `ADMIN_INTERNAL_KEY` is at least 32 chars and stored only in `.env.local` (mode 600 if shared user).
- [ ] `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=false` unless you actually need the UI.
- [ ] HTTPS verified end-to-end (`curl -I https://campus.example.com`).
- [ ] Backups running and you've **tested a restore** (see Disaster recovery below).
- [ ] You can SSH to the Pi from a second machine using the key.

```bash
chmod 600 .env.local
```

---

## Update flow

Day-to-day workflow once everything is set up.

```bash
ssh campusstream@<pi>
cd /srv/campusstream

# 1) Pull
git fetch && git status
git pull --ff-only

# 2) Install any new deps
npm ci

# 3) Apply DB migrations (no-op if nothing new)
npm run prisma:migrate:deploy

# 4) Rebuild
npm run verify:release

# 5) Hot-reload the app
pm2 restart campusstream
pm2 logs campusstream --lines 100

# 6) Verify
curl -sS https://campus.example.com/api/system/readiness | head
```

If anything goes sideways:

```bash
git reset --hard <previous-commit>
npm ci
npm run prisma:migrate:deploy        # only if migrations were applied; otherwise skip
npm run build
pm2 restart campusstream
```

---

## Troubleshooting

**`pm2 status` shows the app as `errored` or repeatedly restarting.**
`pm2 logs campusstream --err --lines 200`. The two most common causes are missing env vars (preflight fails) and Postgres not running.

**`/api/system/readiness` returns `503`.**
The JSON body tells you which check failed: `database`, `tmdb`, or `providers`. Database failures usually mean Postgres is down or the password changed; restart with `sudo systemctl restart postgresql`.

**Build runs out of memory on Pi 4.**
Increase swap to 4 GB temporarily, run the build, set it back. Or build on a beefier machine and rsync the resulting `.next/` directory to `/srv/campusstream/.next/` on the Pi.

**HTTPS doesn't work.**
Caddy: `sudo journalctl -u caddy -f` shows ACME errors. Most common: port 80 not actually reachable from the internet, so Let's Encrypt can't validate. Verify with `curl -I http://campus.example.com` from outside your network.

**Site is slow.**
Run `top` on the Pi while you reproduce. If `node` is at >90 % CPU, add a 2nd PM2 instance: `pm2 scale campusstream 2`. If `postgres` is the hot process, retune `shared_buffers`/`work_mem`.

**Pi reboots randomly.**
Power supply. Use the official one. Check `dmesg | grep -i throttl` and `vcgencmd get_throttled` (anything other than `throttled=0x0` is bad).

**Postgres reports corruption after power loss.**
You skipped the UPS. Restore from your most recent backup:

```bash
DATABASE_URL='...' npm run db:restore -- /srv/backups/streaming-app-<latest>.sql
```

## Disaster recovery

Test this **before** you need it.

### Full restore from backup

1. Provision a fresh Pi using the One-time sections above, up through Postgres install.
2. Copy `streaming-app-<latest>.sql` and your `.env.local` to the new Pi.
3. Recreate the database role and empty database (Postgres setup section).
4. Restore:

```bash
DATABASE_URL='postgresql://campus:<password>@127.0.0.1:5432/streaming_app' \
  npm run db:restore -- /srv/backups/streaming-app-<latest>.sql
```

5. Skip migrations (the dump already includes the schema). If a newer migration was added since the backup, run `npm run prisma:migrate:deploy`.
6. Continue from "Build and run with PM2".

Time to recover from a clean Pi: roughly 60–90 minutes if you have the backup at hand.

## Appendix: tuning numbers for Pi 4 / Pi 5

| Setting | Pi 4 (4 GB) | Pi 4 (8 GB) | Pi 5 (8 GB) | Pi 5 (16 GB) |
| --- | --- | --- | --- | --- |
| `shared_buffers` | 512 MB | 1 GB | 1 GB | 2 GB |
| `effective_cache_size` | 1.5 GB | 4 GB | 4 GB | 8 GB |
| `work_mem` | 8 MB | 16 MB | 16 MB | 32 MB |
| `maintenance_work_mem` | 64 MB | 128 MB | 128 MB | 256 MB |
| `max_connections` | 30 | 50 | 50 | 80 |
| Build swap | 2 GB | 1 GB | 0 GB | 0 GB |
| PM2 instances | 1 | 1 | 2 | 2 |

Pi 4 (2 GB) is **not recommended** for production. The build will be miserable and Postgres + Node together will swap heavily.
