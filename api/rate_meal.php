<?php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';
$input = json_decode(file_get_contents('php://input'), true);

$req_id = (int)$input['request_id'];
$score = (int)$input['score'];

try {
    $pdo->beginTransaction();
    
    // Βρίσκουμε ποιος ήταν ο μάγειρας
    $stmt = $pdo->query("SELECT f.cook_id FROM requests r JOIN food_ads f ON r.ad_id = f.id WHERE r.id = $req_id");
    $ad = $stmt->fetch();
    $cook_id = $ad['cook_id'];

    // Αλλάζουμε το status του request σε picked_up (παρελήφθη)
    $pdo->exec("UPDATE requests SET status = 'picked_up' WHERE id = $req_id");
    
    // Αποθήκευση της αξιολόγησης (για απλότητα παραλείπω το INSERT στον πίνακα ratings αν δεν τον έχεις φτιάξει, κάνουμε απευθείας τη λογική credits)
    
    // Βασική ανταμοιβή: +1 credit στον μάγειρα
    $bonus = 1;
    // Αν η βαθμολογία είναι > 3 (δηλαδή 4 ή 5), παίρνει +1 έξτρα credit!
    if ($score > 3) $bonus += 1; 

    $pdo->exec("UPDATE users SET credits = credits + $bonus WHERE id = $cook_id");

    $pdo->commit();
    echo json_encode(['status'=>'success', 'message'=>"Ευχαριστούμε για την αξιολόγηση ($score★)! Ο μάγειρας κέρδισε +$bonus Credits!"]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status'=>'error', 'message'=>'Σφάλμα αξιολόγησης.']);
}
?>