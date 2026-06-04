<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';

$user_id = $_GET['user_id'] ?? 1;

// Φέρνει τα requests του χρήστη μαζί με τον τίτλο του φαγητού
$stmt = $pdo->query("
    SELECT r.id, r.status, f.title 
    FROM requests r 
    JOIN food_ads f ON r.ad_id = f.id 
    WHERE r.consumer_id = $user_id 
    ORDER BY r.created_at DESC
");
$requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['status'=>'success', 'data'=>$requests]);
?>