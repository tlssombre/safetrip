# Safe Trip CI

Site de location de résidences à Abidjan : React + Vite + Tailwind (front) et PHP + MySQL (API, hébergement cPanel).

## Structure

| Dossier | Rôle |
|---|---|
| `src/` | Application React |
| `server/api/` | API PHP (`index.php`, `config.sample.php`) |
| `server/uploads/` | Photos des résidences (migrées depuis Supabase) |
| `server/schema.sql`, `server/data.sql` | Tables MySQL + données migrées |
| `legacy-supabase/` | Anciens fichiers Supabase, à supprimer une fois le nouveau site validé |
| `deploy/` | Généré par `npm run package` : ce qu'il faut envoyer sur cPanel |

## Publier sur cPanel (Namecheap)

1. **Base MySQL** : cPanel > *Bases de données MySQL* > créer une base, un utilisateur, l'associer avec *tous les privilèges*.
2. **Importer les tables** : cPanel > *phpMyAdmin* > choisir la base > *Importer* : d'abord `deploy/sql/schema.sql`, puis `deploy/sql/data.sql`.
3. **Envoyer le site** : *Gestionnaire de fichiers* > `public_html` > *Téléverser* `deploy/safetrip-public_html.zip` > clic droit *Extraire*. (Activer « Afficher les fichiers cachés » pour voir `.htaccess`.)
4. **Configurer l'API** : dans `public_html/api/`, copier `config.sample.php` en `config.php` et renseigner :
   - `db_name`, `db_user`, `db_pass` (valeurs créées à l'étape 1) ;
   - `admin_password_hash` : générer avec `php -r "echo password_hash('VOTRE_MOT_DE_PASSE', PASSWORD_DEFAULT);"` (ou *Terminal* cPanel).
5. **SSL** : cPanel > *SSL/TLS Status* > *Run AutoSSL* pour le domaine, puis tester `https://votre-domaine/`.
6. Le dossier `deploy/sql` et le fichier `config.php` ne doivent jamais être accessibles publiquement (ne pas les mettre dans un dossier web, sauf `config.php` dans `api/` qui est bloqué par `.htaccess`).

À chaque nouveau déploiement : incrémenter `CACHE_NAME` dans `public/sw.js`, puis `npm run package`.
Le dossier `uploads/` du serveur contient les photos ajoutées depuis l'admin : ne pas l'écraser en redéployant (ne ré-extraire que `assets/`, `index.html`, `sw.js`, `api/index.php`).

## Développement

```bash
npm install
cp server/api/config.sample.php server/api/config.php   # puis renseigner une base MySQL locale
npm run dev:api   # API PHP sur http://localhost:8080
npm run dev       # site sur http://localhost:3000 (proxy /api et /uploads)
npm run lint
```
