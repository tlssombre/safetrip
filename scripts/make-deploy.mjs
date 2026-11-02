// Assemble le dossier à envoyer sur cPanel : deploy/public_html (site + api + uploads) et deploy/sql (à importer, hors web).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'deploy');
const site = path.join(out, 'public_html');

if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('dist/ introuvable : lancez d\'abord "npm run build".');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });
fs.cpSync(path.join(root, 'dist'), site, { recursive: true });

// API : jamais le vrai config.php (secrets), uniquement le modèle.
fs.cpSync(path.join(root, 'server', 'api'), path.join(site, 'api'), {
  recursive: true,
  filter: (src) => path.basename(src) !== 'config.php',
});
fs.cpSync(path.join(root, 'server', 'uploads'), path.join(site, 'uploads'), { recursive: true });

fs.mkdirSync(path.join(out, 'sql'));
for (const f of ['schema.sql', 'data.sql']) fs.copyFileSync(path.join(root, 'server', f), path.join(out, 'sql', f));

console.log('deploy/ prêt :');
console.log('  deploy/public_html -> à envoyer dans public_html (ou le dossier du domaine)');
console.log('  deploy/sql         -> à importer dans phpMyAdmin (ne pas mettre en ligne)');

// Le zip est créé par PowerShell (vrai format zip lisible par cPanel).
import { execFileSync } from 'node:child_process';
if (process.platform === 'win32') {
  const dst = path.join(out, 'safetrip-public_html.zip');
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', 'make-zip.ps1'), site, dst], { stdio: 'inherit' });
  console.log('  deploy/safetrip-public_html.zip -> zip prêt à téléverser');
}
