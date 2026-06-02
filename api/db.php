<?php
$host = '127.0.0.1';
$db   = 'unibite_db';
$user = 'root'; // Προεπιλογή στο XAMPP
$pass = '';     // Προεπιλογή στο XAMPP (κενό)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Αποτυχία σύνδεσης στη βάση.']);
    exit;
}
?>