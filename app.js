// === ΝΕΟΣ ΚΩΔΙΚΑΣ: ΥΠΟΒΟΛΗ ΦΟΡΜΑΣ ΦΑΓΗΤΟΥ ===
    const createForm = document.getElementById('create-ad-form');
    const notification = document.getElementById('notification');

    // Συνάρτηση για εμφάνιση ειδοποιήσεων
    function showNotification(msg, type) {
        notification.textContent = msg;
        notification.style.color = type === 'success' ? '#10b981' : '#ff4d4d';
        notification.style.backgroundColor = type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(255,77,77,0.2)';
        notification.classList.remove('hidden');
        
        // Κρύψιμο μετά από 4 δευτερόλεπτα
        setTimeout(() => notification.classList.add('hidden'), 4000);
    }

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Αποτρέπει το page reload (Απαίτηση Ε1)

        // Συγκέντρωση των δεδομένων από τα inputs
        const data = {
            title: document.getElementById('ad-title').value,
            portions: document.getElementById('ad-portions').value,
            allergens: document.getElementById('ad-allergens').value,
            pickup_location: document.getElementById('ad-location').value
        };

        try {
            // Αποστολή στο PHP Backend με Fetch API (Απαίτηση Ε2)
            const response = await fetch('api/create_ad.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.status === 'success') {
                showNotification(result.message, 'success');
                createForm.reset(); // Καθαρίζουμε τη φόρμα
                btnFeed.click();    // Μιμούμαστε κλικ για να τον γυρίσουμε πίσω στο Feed!
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Σφάλμα σύνδεσης με τον διακομιστή.', 'error');
        }
    });