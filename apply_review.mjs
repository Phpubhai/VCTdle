import fs from 'fs';
const dir = 'C:/Users/BLUEPE~1/AppData/Local/Temp/claude/C--Users-bluepepperMaison-Desktop-phai-demo/6519b8d3-0d41-461b-8afa-d423345c0e7e/scratchpad/vct/';
const read = (f) => JSON.parse(fs.readFileSync(dir + f, 'utf8'));
const players = JSON.parse(fs.readFileSync('players.json', 'utf8'));
const byHandle = new Map(players.map(p => [p.handle, p]));

// ROLE: apply verified regions only (Americas/EMEA/Pacific). China role skipped (unverified 0-fetch run).
const roleFiles = ['roles_americas.json', 'roles_emea.json', 'roles_pacific.json'];
const roleDiffs = [];
for (const f of roleFiles) for (const e of read(f)) {
  const p = byHandle.get(e.handle);
  if (p && p.role !== e.role) { roleDiffs.push(`${p.handle}: ${p.role} -> ${e.role}`); p.role = e.role; }
}

// IGL: apply all 4 regions
const iglFiles = ['igl_americas.json', 'igl_emea.json', 'igl_pacific.json', 'igl_china.json'];
const iglDiffs = [];
for (const f of iglFiles) for (const e of read(f)) {
  const p = byHandle.get(e.handle);
  if (p && p.igl !== e.igl) { iglDiffs.push(`${p.handle} (${p.team}): ${p.igl} -> ${e.igl}`); p.igl = e.igl; }
}

fs.writeFileSync('players.json', JSON.stringify(players, null, 2));

console.log('=== ROLE changes (' + roleDiffs.length + ') ===');
console.log(roleDiffs.join('\n'));
console.log('\n=== IGL changes (' + iglDiffs.length + ') ===');
console.log(iglDiffs.join('\n'));
const iglTrue = players.filter(p => p.igl).length;
console.log('\nTotal IGLs flagged:', iglTrue);
