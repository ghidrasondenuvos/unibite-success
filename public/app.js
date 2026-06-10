document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. STATE ΜΕΤΑΒΛΗΤΕΣ ===
    let currentUser = null; // Τώρα ξεκινάμε ΧΩΡΙΣ χρήστη!

// === 2. AUTHENTICATION LOGIC ===
    const authSection = document.getElementById('auth-section');
    const mainApp = document.getElementById('main-app');
    const authNotif = document.getElementById('auth-notification');

    document.getElementById('tab-login').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        authNotif.classList.add('hidden');
    });

    document.getElementById('tab-register').addEventListener('click', (e) => {
        e.target.classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
        authNotif.classList.add('hidden');
    });

    function showAuthMsg(msg, type) {
        authNotif.textContent = msg;
        authNotif.style.backgroundColor = type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)';
        authNotif.style.color = type === 'success' ? 'var(--primary)' : 'var(--accent)';
        authNotif.style.border = type === 'success' ? '1px solid var(--primary)' : '1px solid var(--accent)';
        
        authNotif.classList.remove('hidden', 'shake-animation');
        // Μικρό τρικ για να κάνει trigger το animation του σφάλματος κάθε φορά
        if (type === 'error') {
            void authNotif.offsetWidth; 
            authNotif.classList.add('shake-animation');
        }
    }

    // ΕΓΓΡΑΦΗ (REGISTER)
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        
        // 1. Οπτικό Feedback (Φόρτωση)
        btn.textContent = 'ΦΟΡΤΩΣΗ...';
        btn.disabled = true;

        const data = {
            username: document.getElementById('reg-username').value,
            password: document.getElementById('reg-password').value
        };
        try {
            const res = await fetch('/api/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                showAuthMsg(result.message, 'success');
                btn.textContent = 'ΕΠΙΤΥΧΙΑ!';
                document.getElementById('register-form').reset();
                
                // 2. Μετά από 2 δευτερόλεπτα τον πάμε αυτόματα στο Login
                setTimeout(() => {
                    document.getElementById('tab-login').click();
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
            } else {
                showAuthMsg(result.message, 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (err) { 
            showAuthMsg('Σφάλμα Δικτύου. Ελέγξτε τον Server.', 'error'); 
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // ΣΥΝΔΕΣΗ (LOGIN)
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        
        // 1. Οπτικό Feedback (Φόρτωση)
        btn.textContent = 'ΕΛΕΓΧΟΣ...';
        btn.disabled = true;

        const data = {
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        };
        try {
            const res = await fetch('/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                showAuthMsg('Επιτυχής σύνδεση! Είσοδος...', 'success');
                btn.textContent = 'ΕΙΣΟΔΟΣ ΕΠΙΤΡΕΠΕΤΑΙ';
                
                // 2. Μικρή καθυστέρηση (1 δευτερόλεπτο) για να δει το μήνυμα επιτυχίας
                setTimeout(() => {
                    currentUser = result.user; 
                    document.getElementById('nav-username').textContent = currentUser.username;
                    document.getElementById('nav-credits').textContent = currentUser.credits;
                    
                    authSection.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    document.getElementById('login-form').reset();
                    
                    // Επαναφορά του κουμπιού σε περίπτωση που κάνει Logout
                    btn.textContent = originalText;
                    btn.disabled = false;
                    authNotif.classList.add('hidden');
                    
                    loadAds(); 
                }, 1000);
            } else {
                showAuthMsg(result.message, 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } catch (err) { 
            showAuthMsg('Σφάλμα Δικτύου. Ελέγξτε τον Server.', 'error'); 
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // ΑΠΟΣΥΝΔΕΣΗ (LOGOUT)
    document.getElementById('btn-logout').addEventListener('click', () => {
        currentUser = null;
        mainApp.classList.add('hidden');
        authSection.classList.remove('hidden');
    });

    // === 3. ΥΠΟΛΟΙΠΗ ΛΟΓΙΚΗ (Χρησιμοποιεί πλέον το currentUser.id) ===
    const views = {
        feed: { btn: document.getElementById('btn-feed'), section: document.getElementById('view-feed') },
        create: { btn: document.getElementById('btn-create'), section: document.getElementById('view-create') },
        mymeals: { btn: document.getElementById('btn-mymeals'), section: document.getElementById('view-mymeals') }
    };

    function switchView(viewName) {
        Object.values(views).forEach(v => {
            v.section.classList.add('hidden');
            v.btn.classList.remove('active');
        });
        views[viewName].section.classList.remove('hidden');
        views[viewName].btn.classList.add('active');

        if (viewName === 'feed') loadAds();
        if (viewName === 'mymeals') loadMyMeals();
    }

    views.feed.btn.addEventListener('click', () => switchView('feed'));
    views.create.btn.addEventListener('click', () => switchView('create'));
    views.mymeals.btn.addEventListener('click', () => switchView('mymeals'));

    const notification = document.getElementById('notification');
    function showNotification(msg, type) {
        notification.innerHTML = type === 'success' ? `[OK] ${msg}` : `[ERR] ${msg}`;
        notification.style.color = type === 'success' ? 'var(--primary)' : 'var(--accent)';
        notification.style.borderColor = type === 'success' ? 'var(--primary)' : 'var(--accent)';
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('hidden'), 5000);
    }

    async function loadAds() {
        const grid = document.getElementById('ads-grid');
        grid.innerHTML = '<p>> Φόρτωση δεδομένων...</p>';
        try {
            const res = await fetch('/api/ads');
            const result = await res.json();
            grid.innerHTML = '';
            if (!result.data || result.data.length === 0) { grid.innerHTML = '<p>> Καμία διαθέσιμη μερίδα.</p>'; return; }
            result.data.forEach(ad => {
                const card = document.createElement('div');
                card.className = 'food-card';
                card.innerHTML = `
                    <h3 style="color:var(--primary); margin:0 0 10px 0;">${ad.title}</h3>
                    <p style="margin:5px 0;"><span class="badge">ΜΑΓΕΙΡΑΣ:</span> ${ad.cook_name}</p>
                    <p style="margin:5px 0;"><span class="badge">ΜΕΡΙΔΕΣ:</span> <strong style="color:white; font-size:1.2rem">${ad.portions}</strong></p>
                    <p style="margin:5px 0;"><span class="badge">ΤΟΠΟΘΕΣΙΑ:</span> ${ad.pickup_location}</p>
                    <div style="flex-grow:1;"></div>
                    <button class="btn btn-danger" style="margin-top:15px;" onclick="requestFood(${ad.id})">ΔΕΣΜΕΥΣΗ [-1 CREDIT]</button>
                `;
                grid.appendChild(card);
            });
        } catch (err) {}
    }

    document.getElementById('create-ad-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            cook_id: currentUser.id, // ΠΑΙΡΝΕΙ ΤΟ ID ΤΟΥ ΣΥΝΔΕΔΕΜΕΝΟΥ ΧΡΗΣΤΗ!
            title: document.getElementById('ad-title').value,
            portions: document.getElementById('ad-portions').value,
            allergens: document.getElementById('ad-allergens').value,
            pickup_location: document.getElementById('ad-location').value
        };
        try {
            const res = await fetch('/api/create_ad', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                document.getElementById('create-ad-form').reset();
                switchView('feed');
            } else showNotification(result.message, 'error');
        } catch (err) {}
    });

    window.requestFood = async (ad_id) => {
        if(currentUser.credits < 1) { showNotification('Insufficient Credits!', 'error'); return; }
        try {
            const res = await fetch('/api/request_food', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ad_id: ad_id, consumer_id: currentUser.id }) // ΔΕΣΜΕΥΣΗ ΜΕ ΤΟ ΣΩΣΤΟ ID!
            });
            const result = await res.json();
            if (result.status === 'success') {
                currentUser.credits -= 1;
                document.getElementById('nav-credits').textContent = currentUser.credits;
                showNotification(result.message, 'success');
                loadAds();
            } else showNotification(result.message, 'error');
        } catch (err) {}
    };

    async function loadMyMeals() {
        const grid = document.getElementById('mymeals-grid');
        grid.innerHTML = '<p>> Φόρτωση ιστορικού...</p>';
        try {
            const res = await fetch(`/api/my_meals?user_id=${currentUser.id}`); // ΦΕΡΝΕΙ ΜΟΝΟ ΤΑ ΔΙΚΑ ΤΟΥ!
            const result = await res.json();
            grid.innerHTML = '';
            if (!result.data || result.data.length === 0) { grid.innerHTML = '<p>> Δεν έχετε κάνει παραγγελίες.</p>'; return; }
            result.data.forEach(req => {
                const card = document.createElement('div');
                card.className = 'food-card';
                card.style.borderLeftColor = 'var(--warning)';
                card.innerHTML = `
                    <h3 style="color:var(--warning); margin:0 0 10px 0;">${req.title}</h3>
                    <p style="margin:5px 0;"><span class="badge">STATUS:</span> ${req.status.toUpperCase()}</p>
                    <div style="flex-grow:1;"></div>
                    ${req.status === 'approved' ? `
                        <div style="margin-top:15px; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                            <p style="margin:0 0 10px 0; font-size:0.85rem;">Αξιολογήστε τον μάγειρα:</p>
                            <div style="display:flex; gap:5px;">
                                <button class="btn btn-warning" onclick="rateMeal(${req.id}, 1)">1★</button>
                                <button class="btn btn-warning" onclick="rateMeal(${req.id}, 3)">3★</button>
                                <button class="btn btn-warning" onclick="rateMeal(${req.id}, 5)">5★</button>
                            </div>
                        </div>
                    ` : `<p style="color:var(--primary); font-weight:bold; margin-top:15px;">ΑΞΙΟΛΟΓΗΘΗΚΕ ✓</p>`}
                `;
                grid.appendChild(card);
            });
        } catch (err) {}
    }

    window.rateMeal = async (request_id, score) => {
        try {
            const res = await fetch('/api/rate_meal', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ request_id: request_id, score: score })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                loadMyMeals();
            } else showNotification(result.message, 'error');
        } catch (err) {}
    };
});