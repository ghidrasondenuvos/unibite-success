<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';

// Παίρνουμε όλες τις αγγελίες που έχουν μερίδες > 0
$stmt = $pdo->query("
    SELECT fa.id, fa.title, fa.portions, fa.pickup_location, u.username AS cook_name 
    FROM food_ads fa 
    JOIN users u ON fa.cook_id = u.id 
    WHERE fa.portions > 0 
    ORDER BY fa.created_at DESC
");

$ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Επιστρέφουμε τα δεδομένα σε μορφή JSON
echo json_encode(['status' => 'success', 'data' => $ads]);
?>