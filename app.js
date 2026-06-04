document.addEventListener('DOMContentLoaded', () => {
    let currentUserCredits = 5; 
    const currentUserId = 1; // Το ID του student_john στη βάση

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

    // 1. Φόρτωση Αγγελιών (Feed)
    async function loadAds() {
        const grid = document.getElementById('ads-grid');
        grid.innerHTML = '<p>> Φόρτωση δεδομένων...</p>';
        try {
            const res = await fetch('api/ads.php');
            const result = await res.json();
            grid.innerHTML = '';
            if (!result.data || result.data.length === 0) {
                grid.innerHTML = '<p>> Καμία διαθέσιμη μερίδα.</p>'; return;
            }
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
        } catch (err) { grid.innerHTML = '<p style="color:red">> Σφάλμα δικτύου.</p>'; }
    }

    // 2. Δημιουργία Γεύματος
    document.getElementById('create-ad-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('ad-title').value,
            portions: document.getElementById('ad-portions').value,
            allergens: document.getElementById('ad-allergens').value,
            pickup_location: document.getElementById('ad-location').value
        };
        try {
            const res = await fetch('api/create_ad.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                document.getElementById('create-ad-form').reset();
                switchView('feed');
            } else showNotification(result.message, 'error');
        } catch (err) { showNotification('Network Error', 'error'); }
    });

    // 3. Δέσμευση Φαγητού (Request)
    window.requestFood = async (ad_id) => {
        if(currentUserCredits < 1) { showNotification('Insufficient Credits!', 'error'); return; }
        try {
            const res = await fetch('api/request_food.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ad_id: ad_id, consumer_id: currentUserId })
            });
            const result = await res.json();
            if (result.status === 'success') {
                currentUserCredits -= 1;
                document.getElementById('nav-credits').textContent = currentUserCredits;
                showNotification(result.message, 'success');
                loadAds(); // Ανανεώνει τις διαθέσιμες μερίδες
            } else showNotification(result.message, 'error');
        } catch (err) { showNotification('Network Error', 'error'); }
    };

    // 4. Φόρτωση Ιστορικού (Τα Γεύματά μου) & Αξιολόγηση
    async function loadMyMeals() {
        const grid = document.getElementById('mymeals-grid');
        grid.innerHTML = '<p>> Φόρτωση ιστορικού...</p>';
        try {
            const res = await fetch(`api/my_meals.php?user_id=${currentUserId}`);
            const result = await res.json();
            grid.innerHTML = '';
            if (!result.data || result.data.length === 0) {
                grid.innerHTML = '<p>> Δεν έχετε κάνει παραγγελίες.</p>'; return;
            }
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
        } catch (err) { grid.innerHTML = '<p style="color:red">> Σφάλμα δικτύου.</p>'; }
    }

    window.rateMeal = async (request_id, score) => {
        try {
            const res = await fetch('api/rate_meal.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ request_id: request_id, score: score })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showNotification(result.message, 'success');
                loadMyMeals(); // Κάνει refresh την καρτέλα για να κρύψει τα κουμπιά αξιολόγησης
            } else showNotification(result.message, 'error');
        } catch (err) { showNotification('Network Error', 'error'); }
    };

    loadAds(); // Αρχική φόρτωση
});