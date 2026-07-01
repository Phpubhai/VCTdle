// Regenerate players-data.js from players.json, pointing image URLs to local
// files in assets/ when they exist (falls back to remote URL otherwise).
// Run after editing players.json:  node sync-data.mjs
import fs from 'fs';

const players = JSON.parse(fs.readFileSync('players.json', 'utf8'));
const slug = (s) => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');

const local = players.map((p, i) => {
  const photoLocal = `assets/photos/${slug(p.handle)}_${i}.png`;
  const logoLocal  = `assets/teamlogos/${slug(p.team)}.png`;
  return {
    ...p,
    photoUrl: (p.photoUrl && fs.existsSync(photoLocal)) ? photoLocal : p.photoUrl,
    teamLogoUrl: (p.teamLogoUrl && fs.existsSync(logoLocal)) ? logoLocal : p.teamLogoUrl,
  };
});

fs.writeFileSync('players-data.js', 'window.__PLAYERS__ = ' + JSON.stringify(local) + ';\n');
console.log('players-data.js synced from players.json (' + local.length + ' players).');
