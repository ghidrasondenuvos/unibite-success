<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';
$input = json_decode(file_get_contents('php://input'), true);

if(!isset($input['ad_id']) || !isset($input['consumer_id'])) { echo json_encode(['status'=>'error','message'=>'Missing data']); exit; }

$ad_id = (int)$input['ad_id'];
$consumer_id = (int)$input['consumer_id'];

try {
    $pdo->beginTransaction();
    
    // 1. Έλεγχος credits και μερίδων
    $user = $pdo->query("SELECT credits FROM users WHERE id = $consumer_id")->fetch();
    $ad = $pdo->query("SELECT portions FROM food_ads WHERE id = $ad_id")->fetch();
    
    if($user['credits'] < 1) throw new Exception("Δεν έχετε αρκετά credits!");
    if($ad['portions'] < 1) throw new Exception("Οι μερίδες εξαντλήθηκαν!");

    // 2. Αφαίρεση 1 credit και 1 μερίδας
    $pdo->exec("UPDATE users SET credits = credits - 1 WHERE id = $consumer_id");
    $pdo->exec("UPDATE food_ads SET portions = portions - 1 WHERE id = $ad_id");
    
    // 3. Δημιουργία εγγραφής στον πίνακα requests
    $pdo->exec("INSERT INTO requests (ad_id, consumer_id, status) VALUES ($ad_id, $consumer_id, 'approved')");
    
    $pdo->commit();
    echo json_encode(['status'=>'success', 'message'=>'Η μερίδα δεσμεύτηκε! Σας αφαιρέθηκε 1 credit.']);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
}
?>