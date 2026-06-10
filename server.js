// Αρχείο: server.js
const express = require('express');
const mysql = require('mysql2/promise'); 
const path = require('path');

// Εδώ ορίζεται το "app" που έψαχνε και δεν έβρισκε!
const app = express();
const PORT = 3000;

// Να διαβάζει τα JSON δεδομένα που στέλνει το Frontend
app.use(express.json());

// Να σερβίρει τα αρχεία (HTML, CSS, JS) από τον φάκελο public
app.use(express.static(path.join(__dirname, 'public')));

// === ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ (XAMPP MySQL) ===
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'unibite_db'
};

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Φέρνει όλα τα διαθέσιμα γεύματα
app.get('/api/ads', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT fa.id, fa.title, fa.portions, fa.pickup_location, u.username AS cook_name 
            FROM food_ads fa 
            JOIN users u ON fa.cook_id = u.id 
            WHERE fa.portions > 0 
            ORDER BY fa.created_at DESC
        `);
        await connection.end();
        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Σφάλμα βάσης δεδομένων' });
    }
});

// 2. Δημιουργία Γεύματος (Προσφορά)
app.post('/api/create_ad', async (req, res) => {
    const { title, portions, pickup_location } = req.body;
    const cook_id = 1; // Σταθερό για την ώρα (ο student_john)
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO food_ads (cook_id, title, portions, pickup_location) VALUES (?, ?, ?, ?)',
            [cook_id, title, parseInt(portions), pickup_location]
        );
        await connection.end();
        res.json({ status: 'success', message: 'Το γεύμα δημοσιεύτηκε επιτυχώς!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Σφάλμα κατά τη δημοσίευση' });
    }
});

// 3. Δέσμευση Μερίδας (Transaction)
app.post('/api/request_food', async (req, res) => {
    const { ad_id, consumer_id } = req.body;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Έλεγχος credits και μερίδων
        const [users] = await connection.execute('SELECT credits FROM users WHERE id = ?', [consumer_id]);
        const [ads] = await connection.execute('SELECT portions FROM food_ads WHERE id = ?', [ad_id]);
        
        if (users[0].credits < 1) throw new Error("Δεν έχετε αρκετά credits!");
        if (ads[0].portions < 1) throw new Error("Οι μερίδες εξαντλήθηκαν!");

        // Αφαιρούμε credit και μερίδα
        await connection.execute('UPDATE users SET credits = credits - 1 WHERE id = ?', [consumer_id]);
        await connection.execute('UPDATE food_ads SET portions = portions - 1 WHERE id = ?', [ad_id]);
        
        // Καταγράφουμε το αίτημα
        await connection.execute("INSERT INTO requests (ad_id, consumer_id, status) VALUES (?, ?, 'approved')", [ad_id, consumer_id]);

        await connection.commit();
        await connection.end();
        
        res.json({ status: 'success', message: 'Η μερίδα δεσμεύτηκε! (-1 Credit)' });
    } catch (error) {
        res.json({ status: 'error', message: error.message || 'Σφάλμα δέσμευσης' });
    }
});

// 4. Εμφάνιση του Ιστορικού παραγγελιών
app.get('/api/my_meals', async (req, res) => {
    const user_id = req.query.user_id || 1;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT r.id, r.status, f.title 
            FROM requests r 
            JOIN food_ads f ON r.ad_id = f.id 
            WHERE r.consumer_id = ? 
            ORDER BY r.created_at DESC
        `, [user_id]);
        await connection.end();
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Σφάλμα φόρτωσης ιστορικού' });
    }
});

// 5. Αξιολόγηση και ανταμοιβή του μάγειρα
app.post('/api/rate_meal', async (req, res) => {
    const { request_id, score } = req.body;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const [ads] = await connection.execute(`
            SELECT f.cook_id 
            FROM requests r 
            JOIN food_ads f ON r.ad_id = f.id 
            WHERE r.id = ?
        `, [request_id]);
        
        const cook_id = ads[0].cook_id;

        await connection.execute("UPDATE requests SET status = 'picked_up' WHERE id = ?", [request_id]);
        
        let bonus = 1;
        if (score > 3) bonus += 1;

        await connection.execute('UPDATE users SET credits = credits + ? WHERE id = ?', [bonus, cook_id]);

        await connection.commit();
        await connection.end();
        
        res.json({ status: 'success', message: `Ευχαριστούμε (${score}★)! Ο μάγειρας πήρε +${bonus} Credits.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Σφάλμα αξιολόγησης' });
    }
});

// ==========================================
// ΕΚΚΙΝΗΣΗ SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Ο Server τρέχει στο http://localhost:${PORT}`);
});