<?php
declare(strict_types=1);

/**
 * Safe Trip CI - API (PHP 8 + MySQL)
 * Routes : /api/index.php?r=<ressource>[&id=<id>]
 * Lecture publique ; toute écriture (hors visites/clics) exige une session admin.
 */

$config = require __DIR__ . '/config.php';
$uploadsRoot = dirname(__DIR__) . '/uploads';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400): never
{
    out(['error' => $message], $code);
}

set_exception_handler(function (Throwable $e) {
    error_log('[safetrip-api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    fail('Erreur serveur.', 500);
});

function db(): PDO
{
    global $config;
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $dsn = $config['db_dsn'] ?? sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    $pdo = new PDO($dsn, $config['db_user'] ?? null, $config['db_pass'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_name('safetrip_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function isAdmin(): bool
{
    // Pas de cookie de session = visiteur normal : on ne crée pas de session pour lui.
    if (session_status() !== PHP_SESSION_ACTIVE && !isset($_COOKIE['safetrip_admin'])) {
        return false;
    }
    startSession();
    return ($_SESSION['admin'] ?? false) === true && (($_SESSION['expires'] ?? 0) > time());
}

/** Session admin valide + en-tête personnalisé (bloque les requêtes cross-site). */
function requireAdmin(): void
{
    if (!isAdmin()) {
        fail('Non autorisé.', 401);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'safetrip') {
        fail('Requête refusée.', 403);
    }
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        fail('Corps de requête vide ou trop volumineux.');
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail('JSON invalide.');
    }
    return $data;
}

function uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function isUuid(?string $v): bool
{
    return $v !== null && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $v) === 1;
}

function str(mixed $v, int $max, bool $required = false, string $label = 'Champ'): string
{
    $s = is_string($v) ? trim($v) : '';
    if ($required && $s === '') {
        fail("$label est obligatoire.");
    }
    if (mb_strlen($s) > $max) {
        fail("$label est trop long.");
    }
    return $s;
}

function intIn(mixed $v, int $min, int $max, int $default): int
{
    if (!is_numeric($v)) {
        return $default;
    }
    return max($min, min($max, (int)$v));
}

function utc(string $sqlDate): string
{
    return gmdate('Y-m-d\TH:i:s\Z', strtotime($sqlDate . ' UTC'));
}

/* ------------------------------------------------------------------ images */

function residenceDir(string $id): string
{
    global $uploadsRoot;
    return $uploadsRoot . '/residences/' . $id;
}

/**
 * Transforme la liste d'images reçue : les data:URL sont enregistrées en fichiers,
 * les chemins /uploads/residences/<id>/... existants et les URL https sont conservés.
 */
function storeImages(array $images, string $id): array
{
    $result = [];
    foreach (array_slice($images, 0, 10) as $img) {
        if (!is_string($img) || $img === '') {
            continue;
        }
        if (preg_match('#^data:image/(?:jpeg|png|webp);base64,(.+)$#s', $img, $m)) {
            $bytes = base64_decode($m[1], true);
            if ($bytes === false || strlen($bytes) > 6 * 1024 * 1024) {
                fail('Image invalide ou trop lourde (6 Mo max).');
            }
            $info = @getimagesizefromstring($bytes);
            $ext = match ($info[2] ?? null) {
                IMAGETYPE_JPEG => 'jpg',
                IMAGETYPE_PNG => 'png',
                IMAGETYPE_WEBP => 'webp',
                default => null,
            };
            if ($ext === null) {
                fail('Format d\'image non supporté (JPEG, PNG ou WebP).');
            }
            $dir = residenceDir($id);
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new RuntimeException('Impossible de créer le dossier ' . $dir);
            }
            $name = bin2hex(random_bytes(8)) . '.' . $ext;
            if (file_put_contents($dir . '/' . $name, $bytes) === false) {
                throw new RuntimeException('Écriture image impossible.');
            }
            $result[] = "/uploads/residences/$id/$name";
        } elseif (preg_match('#^/uploads/residences/' . preg_quote($id, '#') . '/[A-Za-z0-9._-]+$#', $img) && strpos($img, '..') === false) {
            $result[] = $img;
        } elseif (preg_match('#^https://[^\s]{1,480}$#', $img)) {
            $result[] = $img;
        } else {
            fail('Image non autorisée.');
        }
    }
    return $result;
}

/** Supprime les fichiers du dossier de la résidence qui ne sont plus référencés. */
function pruneImages(string $id, array $keep): void
{
    $dir = residenceDir($id);
    if (!is_dir($dir)) {
        return;
    }
    $keepNames = array_map('basename', $keep);
    foreach (scandir($dir) ?: [] as $f) {
        if ($f !== '.' && $f !== '..' && is_file("$dir/$f") && !in_array($f, $keepNames, true)) {
            @unlink("$dir/$f");
        }
    }
}

function removeResidenceDir(string $id): void
{
    $dir = residenceDir($id);
    if (!isUuid($id) || !is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) ?: [] as $f) {
        if ($f !== '.' && $f !== '..' && is_file("$dir/$f")) {
            @unlink("$dir/$f");
        }
    }
    @rmdir($dir);
}

/* ------------------------------------------------------------------- rows */

function jsonList(?string $v): array
{
    $d = $v ? json_decode($v, true) : [];
    return is_array($d) ? array_values($d) : [];
}

function residenceRow(array $r): array
{
    return [
        'id' => $r['id'],
        'title' => $r['title'],
        'location' => $r['location'],
        'price' => $r['price'],
        'original_price' => $r['original_price'],
        'beds' => (int)$r['beds'],
        'baths' => (int)$r['baths'],
        'sqft' => $r['sqft'] === null ? null : (int)$r['sqft'],
        'image_url' => $r['image_url'],
        'images' => jsonList($r['images']),
        'tags' => jsonList($r['tags']),
        'blocked_dates' => jsonList($r['blocked_dates']),
        'created_at' => (int)$r['created_at'],
        'updated_at' => $r['updated_at'] === null ? null : (int)$r['updated_at'],
    ];
}

function residenceInput(array $in, string $id): array
{
    $images = storeImages(is_array($in['images'] ?? null) ? $in['images'] : [], $id);
    if (count($images) === 0) {
        fail('Au moins une image est requise.');
    }
    $tags = [];
    foreach (is_array($in['tags'] ?? null) ? $in['tags'] : [] as $t) {
        if (is_string($t) && trim($t) !== '') {
            $tags[] = mb_substr(trim($t), 0, 60);
        }
    }
    $dates = [];
    foreach (is_array($in['blockedDates'] ?? null) ? $in['blockedDates'] : [] as $d) {
        if (is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
            $dates[] = $d;
        }
    }
    $original = str($in['originalPrice'] ?? '', 50, false, 'Ancien prix');
    return [
        'title' => str($in['title'] ?? '', 255, true, 'Le titre'),
        'location' => str($in['location'] ?? '', 255, false, 'Le lieu'),
        'price' => str($in['price'] ?? '', 50, true, 'Le prix'),
        'original_price' => $original === '' ? null : $original,
        'beds' => intIn($in['beds'] ?? 0, 0, 100, 0),
        'baths' => intIn($in['baths'] ?? 0, 0, 100, 0),
        'sqft' => isset($in['sqft']) && is_numeric($in['sqft']) ? intIn($in['sqft'], 0, 100000, 0) : null,
        'image_url' => $images[0],
        'images' => json_encode($images, JSON_UNESCAPED_SLASHES),
        'tags' => json_encode($tags, JSON_UNESCAPED_UNICODE),
        'blocked_dates' => json_encode(array_values(array_unique($dates))),
    ];
}

/* ----------------------------------------------------------------- routes */

$r = $_GET['r'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$nowMs = (int)round(microtime(true) * 1000);

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

switch ($r) {
    /* ---- public ---- */
    case 'residences':
        if ($method === 'GET') {
            $rows = db()->query('SELECT * FROM residences ORDER BY created_at DESC')->fetchAll();
            out(array_map('residenceRow', $rows));
        }
        requireAdmin();
        if ($method === 'POST') {
            $newId = uuid();
            $f = residenceInput(body(), $newId);
            db()->prepare('INSERT INTO residences (id,title,location,price,original_price,beds,baths,sqft,image_url,images,tags,blocked_dates,created_at,updated_at)
                VALUES (:id,:title,:location,:price,:original_price,:beds,:baths,:sqft,:image_url,:images,:tags,:blocked_dates,:created_at,:created_at)')
                ->execute($f + ['id' => $newId, 'created_at' => $nowMs]);
            out(['id' => $newId], 201);
        }
        if (!isUuid($id)) {
            fail('Identifiant invalide.');
        }
        if ($method === 'PUT') {
            $exists = db()->prepare('SELECT 1 FROM residences WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetchColumn()) {
                fail('Résidence introuvable.', 404);
            }
            $f = residenceInput(body(), $id);
            db()->prepare('UPDATE residences SET title=:title,location=:location,price=:price,original_price=:original_price,beds=:beds,baths=:baths,sqft=:sqft,
                image_url=:image_url,images=:images,tags=:tags,blocked_dates=:blocked_dates,updated_at=:updated_at WHERE id=:id')
                ->execute($f + ['id' => $id, 'updated_at' => $nowMs]);
            pruneImages($id, jsonList($f['images']));
            out(['ok' => true]);
        }
        if ($method === 'DELETE') {
            db()->prepare('DELETE FROM residences WHERE id = ?')->execute([$id]);
            removeResidenceDir($id);
            out(['ok' => true]);
        }
        fail('Méthode non supportée.', 405);

    case 'testimonials':
        if ($method === 'GET') {
            $rows = db()->query('SELECT * FROM testimonials ORDER BY created_at DESC')->fetchAll();
            out(array_map(fn($t) => [
                'id' => $t['id'], 'name' => $t['name'], 'role' => $t['role'], 'text' => $t['text'],
                'rating' => (int)$t['rating'], 'created_at' => (int)$t['created_at'],
            ], $rows));
        }
        requireAdmin();
        $in = in_array($method, ['POST', 'PUT'], true) ? body() : [];
        $fields = $in ? [
            'name' => str($in['name'] ?? '', 255, true, 'Le nom'),
            'role' => str($in['role'] ?? '', 255, false, 'Le rôle'),
            'text' => str($in['text'] ?? '', 2000, true, 'Le texte'),
            'rating' => intIn($in['rating'] ?? 5, 1, 5, 5),
        ] : [];
        if ($method === 'POST') {
            $newId = uuid();
            db()->prepare('INSERT INTO testimonials (id,name,role,text,rating,created_at,updated_at) VALUES (:id,:name,:role,:text,:rating,:t,:t)')
                ->execute($fields + ['id' => $newId, 't' => $nowMs]);
            out(['id' => $newId], 201);
        }
        if (!isUuid($id)) {
            fail('Identifiant invalide.');
        }
        if ($method === 'PUT') {
            db()->prepare('UPDATE testimonials SET name=:name,role=:role,text=:text,rating=:rating,updated_at=:t WHERE id=:id')
                ->execute($fields + ['id' => $id, 't' => $nowMs]);
            out(['ok' => true]);
        }
        if ($method === 'DELETE') {
            db()->prepare('DELETE FROM testimonials WHERE id = ?')->execute([$id]);
            out(['ok' => true]);
        }
        fail('Méthode non supportée.', 405);

    case 'visit':
        if ($method !== 'POST') {
            fail('Méthode non supportée.', 405);
        }
        db()->prepare('INSERT INTO site_visits (created_at) VALUES (?)')->execute([gmdate('Y-m-d H:i:s')]);
        out(['ok' => true], 201);

    case 'click':
        if ($method !== 'POST') {
            fail('Méthode non supportée.', 405);
        }
        $in = body();
        $source = ($in['source'] ?? '') === 'details' ? 'details' : 'modal';
        $rid = isUuid($in['residence_id'] ?? null) ? $in['residence_id'] : null;
        $date = null;
        if (is_string($in['booking_date'] ?? null) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $in['booking_date'])) {
            $date = $in['booking_date'];
        }
        $nights = isset($in['nights']) && is_numeric($in['nights']) ? intIn($in['nights'], 1, 365, 1) : null;
        db()->prepare('INSERT INTO reservation_clicks (residence_id,residence_title,residence_location,source,booking_date,nights,status,created_at)
            VALUES (?,?,?,?,?,?,?,?)')
            ->execute([$rid, str($in['residence_title'] ?? '', 255) ?: null, str($in['residence_location'] ?? '', 255) ?: null,
                $source, $date, $nights, 'nouveau', gmdate('Y-m-d H:i:s')]);
        out(['ok' => true], 201);

    /* ---- session admin ---- */
    case 'me':
        out(['admin' => isAdmin()]);

    case 'login':
        if ($method !== 'POST') {
            fail('Méthode non supportée.', 405);
        }
        startSession();
        $ip = substr($_SERVER['REMOTE_ADDR'] ?? '0', 0, 45);
        $since = gmdate('Y-m-d H:i:s', time() - 900);
        db()->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute([$since]);
        $count = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at >= ?');
        $count->execute([$ip, $since]);
        if ((int)$count->fetchColumn() >= 5) {
            fail('Trop de tentatives. Réessayez dans 15 minutes.', 429);
        }
        $pwd = (string)(body()['password'] ?? '');
        $hash = (string)($config['admin_password_hash'] ?? '');
        if ($hash === '' || !password_verify($pwd, $hash)) {
            db()->prepare('INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)')->execute([$ip, gmdate('Y-m-d H:i:s')]);
            usleep(400000);
            fail($hash === '' ? 'Mot de passe admin non configuré sur le serveur.' : 'Mot de passe incorrect.', 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['expires'] = time() + 8 * 3600;
        out(['admin' => true]);

    case 'logout':
        startSession();
        $_SESSION = [];
        session_destroy();
        out(['admin' => false]);

    /* ---- admin ---- */
    case 'analytics':
        requireAdmin();
        $clicks = db()->query('SELECT residence_id, created_at FROM reservation_clicks')->fetchAll();
        $visits = db()->query('SELECT id, created_at FROM site_visits')->fetchAll();
        out([
            'clicks' => array_map(fn($c) => ['residence_id' => $c['residence_id'], 'created_at' => utc($c['created_at'])], $clicks),
            'visits' => array_map(fn($v) => ['id' => (int)$v['id'], 'created_at' => utc($v['created_at'])], $visits),
        ]);

    case 'requests':
        requireAdmin();
        if ($method === 'GET') {
            $rows = db()->query('SELECT * FROM reservation_clicks ORDER BY created_at DESC, id DESC')->fetchAll();
            out(array_map(fn($c) => [
                'id' => (int)$c['id'],
                'residence_id' => $c['residence_id'],
                'residence_title' => $c['residence_title'],
                'residence_location' => $c['residence_location'],
                'source' => $c['source'],
                'booking_date' => $c['booking_date'],
                'nights' => $c['nights'] === null ? null : (int)$c['nights'],
                'status' => $c['status'],
                'created_at' => utc($c['created_at']),
            ], $rows));
        }
        if ($method === 'PUT') {
            $status = body()['status'] ?? '';
            if (!in_array($status, ['nouveau', 'contacte', 'confirme', 'annule'], true) || !ctype_digit((string)$id)) {
                fail('Statut invalide.');
            }
            db()->prepare('UPDATE reservation_clicks SET status = ? WHERE id = ?')->execute([$status, (int)$id]);
            out(['ok' => true]);
        }
        fail('Méthode non supportée.', 405);

    default:
        fail('Route inconnue.', 404);
}
