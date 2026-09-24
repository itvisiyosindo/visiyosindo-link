<?php
// API Sederhana untuk Hosting cPanel / Apache (PHP)
// Data disimpan secara otomatis di file links.json
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$dataFile = __DIR__ . '/links.json';

// Inisialisasi file JSON jika belum ada
if (!file_exists($dataFile)) {
    $initialData = [
        [
            "id" => "link-1",
            "title" => "WhatsApp CS",
            "slug" => "wa-admin",
            "targetUrl" => "https://wa.me/6281234567890",
            "clicks" => 0,
            "createdAt" => date("c"),
            "updatedAt" => date("c")
        ]
    ];
    file_put_contents($dataFile, json_encode($initialData, JSON_PRETTY_PRINT));
}

function getStoredLinks($file) {
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function saveStoredLinks($file, $links) {
    return file_put_contents($file, json_encode(array_values($links), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

$action = $_GET['action'] ?? 'get';
$links = getStoredLinks($dataFile);

// 1. Ambil Semua Link
if ($action === 'get') {
    echo json_encode(["status" => "success", "links" => $links]);
    exit;
}

// 2. Tambah Link Baru
if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['slug']) || empty($input['targetUrl'])) {
        http_response_code(400);
        echo json_encode(["error" => "Slug dan target URL wajib diisi"]);
        exit;
    }

    $cleanSlug = strtolower(preg_replace('/[^a-zA-Z0-9-_]/', '', trim($input['slug'])));

    // Cek duplikasi
    foreach ($links as $l) {
        if (strtolower($l['slug']) === $cleanSlug) {
            http_response_code(400);
            echo json_encode(["error" => "Slug sudah dipakai"]);
            exit;
        }
    }

    $newLink = [
        "id" => "link-" . time() . "-" . substr(md5(uniqid()), 0, 4),
        "title" => $input['title'] ?? $cleanSlug,
        "slug" => $cleanSlug,
        "targetUrl" => $input['targetUrl'],
        "clicks" => 0,
        "createdAt" => date("c"),
        "updatedAt" => date("c")
    ];

    array_unshift($links, $newLink);
    saveStoredLinks($dataFile, $links);
    echo json_encode(["status" => "success", "link" => $newLink]);
    exit;
}

// 3. Update Link
if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $found = false;

    foreach ($links as &$l) {
        if ($l['id'] === $id) {
            $l['title'] = $input['title'] ?? $l['title'];
            if (!empty($input['slug'])) {
                $l['slug'] = strtolower(preg_replace('/[^a-zA-Z0-9-_]/', '', trim($input['slug'])));
            }
            if (!empty($input['targetUrl'])) {
                $l['targetUrl'] = $input['targetUrl'];
            }
            $l['updatedAt'] = date("c");
            $found = true;
            break;
        }
    }

    if ($found) {
        saveStoredLinks($dataFile, $links);
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Link tidak ditemukan"]);
    }
    exit;
}

// 4. Hapus Link
if ($action === 'delete') {
    $id = $_GET['id'] ?? '';
    $newLinks = array_filter($links, function($l) use ($id) {
        return $l['id'] !== $id;
    });
    saveStoredLinks($dataFile, $newLinks);
    echo json_encode(["status" => "success"]);
    exit;
}

// 5. Catat Klik
if ($action === 'click') {
    $slug = strtolower(trim($_GET['slug'] ?? ''));
    foreach ($links as &$l) {
        if (strtolower($l['slug']) === $slug) {
            $l['clicks'] = ($l['clicks'] ?? 0) + 1;
            break;
        }
    }
    saveStoredLinks($dataFile, $links);
    echo json_encode(["status" => "success"]);
    exit;
}

echo json_encode(["status" => "unknown_action"]);
