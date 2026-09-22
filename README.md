# Pip-Boy 3000 Portfolio // Sanjiv Raote

An authentic **Fallout Pip-Boy 3000** interactive web portfolio built with pure HTML5, CSS3, and JavaScript. Featuring a RobCo Industries BIOS boot terminal, CRT scanlines & phosphor glow, browser-synthesized audio effects (Web Audio API), and responsive navigation tabs.

---

## How to Deploy to GitHub Pages (100% Free & 24/7)

### Method 1: Via GitHub Web Interface (No command line required!)
1. Go to [GitHub.com](https://github.com) and create a new public repository named **`sanjivraote023.github.io`** (replace with your GitHub username).
2. Click **"Add file"** $\rightarrow$ **"Upload files"**.
3. Drag and drop all files from this folder (`index.html`, `styles.css`, `app.js`, `README.md`).
4. Click **"Commit changes"**.
5. Go to **Settings** $\rightarrow$ **Pages** (on the left menu).
6. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
7. In ~60 seconds, your site will be live at:
   ```
   https://<your-username>.github.io/
   ```

### Method 2: Via Git Command Line
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Pip-Boy 3000 Portfolio"

# Link to your GitHub repo (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
git push -u origin main
```

---

## Features Included

- **RobCo BIOS Boot Sequence**: Line-by-line terminal boot-up sequence with typewriter sounds and a click/spacebar skip option.
- **Synthesized Audio (Web Audio API)**: Real retro mechanical clicks and terminal beeps without any external `.mp3` files (zero loading latency, 100% reliable). Includes an on-screen mute/unmute toggle.
- **Authentic Pip-Boy Tabs**:
  - `[ STAT ]`: Character profile, motto, Vault 305 affiliation, HP/AP/XP bars, and S.P.E.C.I.A.L. stats.
  - `[ EXP ]`: Quest log featuring **Handshake** (AI Trainer), **Rearc** (Cloud Intern), **Flynn's Pub House**, and **Dunkin'**.
  - `[ PERKS ]`: Equipped skills including AWS Cloud, AI/ML, Python, Behavioral Psychology, and Customer Service.
  - `[ DATA ]`: Academic records for the **University of Miami** and **The Wardlaw + Hartridge School**.
  - `[ RADIO ]`: Direct transmission frequencies for email (`sraote23@gmail.com`), LinkedIn, and dossier export.
- **Fallout Keyboard Controls**:
  - `1`, `2`, `3`, `4`, `5`: Quick switch between tabs.
  - `←` and `→`: Cycle tabs left and right.
  - `Space` or `Enter`: Skip boot sequence.
