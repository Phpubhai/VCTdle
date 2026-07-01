import fs from 'fs';
import path from 'path';

const players = JSON.parse(fs.readFileSync('players.json', 'utf8'));
fs.mkdirSync('assets/photos', { recursive: true });
fs.mkdirSync('assets/teamlogos', { recursive: true });

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');

async function dl(url, dest) {
  if (fs.existsSync(dest)) return true;
  try {
    const r = await fetch(url, { headers: { 'Referer': 'https://www.vlr.gg/', 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return false; // likely error page
    fs.writeFileSync(dest, buf);
    return true;
  } catch (e) { return false; }
}

// dedupe team logos by URL
const teamLogoFile = new Map(); // url -> local path
for (const p of players) {
  if (p.teamLogoUrl && !teamLogoFile.has(p.teamLogoUrl)) {
    teamLogoFile.set(p.teamLogoUrl, `assets/teamlogos/${slug(p.team)}.png`);
  }
}

let okPhoto = 0, failPhoto = 0, okLogo = 0, failLogo = 0;

// team logos
for (const [url, dest] of teamLogoFile) {
  const ok = await dl(url, dest);
  if (ok) okLogo++; else { failLogo++; console.log('LOGO FAIL', url); }
}

// player photos (by index to avoid name collisions)
for (let i = 0; i < players.length; i++) {
  const p = players[i];
  if (p.photoUrl) {
    const dest = `assets/photos/${slug(p.handle)}_${i}.png`;
    const ok = await dl(p.photoUrl, dest);
    if (ok) { p._localPhoto = dest; okPhoto++; }
    else { failPhoto++; }
  }
  // rewrite logo to local if downloaded
  if (p.teamLogoUrl && teamLogoFile.has(p.teamLogoUrl)) {
    const lp = teamLogoFile.get(p.teamLogoUrl);
    if (fs.existsSync(lp)) p._localLogo = lp;
  }
}

// build final local-path dataset (fallback to remote if local missing)
const local = players.map(p => ({
  ...p,
  photoUrl: p._localPhoto || p.photoUrl,
  teamLogoUrl: p._localLogo || p.teamLogoUrl,
}));
for (const p of local) { delete p._localPhoto; delete p._localLogo; }

fs.writeFileSync('players-data.js', 'window.__PLAYERS__ = ' + JSON.stringify(local) + ';\n');

console.log(`\nDONE. photos ok=${okPhoto} fail=${failPhoto} | logos ok=${okLogo} fail=${failLogo}`);
console.log('players-data.js rewritten with local paths (remote fallback kept where download failed).');
