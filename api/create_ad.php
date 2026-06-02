<?php
// api/create_ad.php
header('Content-Type: application/json; charset=utf-8');
require 'db.php';

// Διαβάζουμε τα δεδομένα JSON που μας έστειλε η JavaScript
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Έλεγχος ότι ήρθαν τα απαραίτητα πεδία
if (!isset($input['title']) || !isset($input['portions']) || !isset($input['pickup_location'])) {
    echo json_encode(['status' => 'error', 'message' => 'Λείπουν στοιχεία φόρμας!']);
    exit;
}

// Για τώρα, βάζουμε "καρφωτά" ότι μαγειρεύει ο χρήστης με id = 1 (student_john)
$cook_id = 1; 
$title = $input['title'];
$portions = (int)$input['portions'];
$location = $input['pickup_location'];

try {
    // Εισαγωγή στη βάση δεδομένων
    $stmt = $pdo->prepare("INSERT INTO food_ads (cook_id, title, portions, pickup_location) VALUES (?, ?, ?, ?)");
    $stmt->execute([$cook_id, $title, $portions, $location]);
    
    // Απάντηση επιτυχίας στη JavaScript
    echo json_encode(['status' => 'success', 'message' => 'Το γεύμα δημοσιεύτηκε επιτυχώς!']);
} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Σφάλμα βάσης: Ίσως λείπει κάποιο πεδίο.']);
}
?>