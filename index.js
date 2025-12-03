// ====================================
// CALORIE DEFICIT AI - ADVANCED JAVASCRIPT
// Google Auth + Chart.js + Complete Analytics
// ====================================

const API_BASE_URL = 'http://localhost:3000';

let usersDatabase = [];
let currentUser = null;
const GOOGLE_CLIENT_ID = '137570212811-eqkc9tbr9h11u85l25q2fctom0r5lgtv.apps.googleusercontent.com';
let userActivityData = {};

// Chart instances
let dailySummaryChart = null;
let activityTrendChart = null;
let calorieBalanceChart = null;
let activityDistributionChart = null;
let weeklyComparisonChart = null;

// Current analytics period
let currentPeriod = '7days';
let customStartDate = null;
let customEndDate = null;

// Google Auth variables
let gapi = null;
let auth2 = null;

// ====================================
// GOOGLE AUTHENTICATION
// ====================================
function initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
        // Initialize Google Sign-In
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        console.log('Google Auth initialized successfully');
    } else {
        console.warn('Google Auth library not loaded');
    }
}

function handleGoogleSignIn(response) {
    try {
        // Decode the JWT token
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        console.log('Google Sign-In successful:', payload);
        
        // Create user object from Google data
        const googleUser = {
            id: generateId(),
            name: payload.name,
            email: payload.email,
            googleId: payload.sub,
            picture: payload.picture,
            hasCompletedData: false,
            isGoogleUser: true
        };
        
        // Check if user already exists
        let existingUser = usersDatabase.find(u => u.email === googleUser.email);
        
        if (existingUser) {
            // Update existing user with Google data
            existingUser.picture = googleUser.picture;
            existingUser.googleId = googleUser.googleId;
            existingUser.isGoogleUser = true;
            currentUser = existingUser;
        } else {
            // Add new Google user
            usersDatabase.push(googleUser);
            currentUser = googleUser;
        }
        
        localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Navigate based on data completion
        if (currentUser.hasCompletedData) {
            goToDashboard();
        } else {
            goToInputData();
        }
        
    } catch (error) {
        console.error('Error handling Google Sign-In:', error);
        showError('loginError', 'Error saat login dengan Google. Silakan coba lagi.');
    }
}

function initGoogleSignUp() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('Google Sign-Up prompt not displayed');
            }
        });
    } else {
        alert('Google Auth tidak tersedia. Silakan gunakan form manual.');
    }
}

function signOutGoogle() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

// ====================================
// AI HELPER FUNCTIONS
// ====================================
async function callOpenAI(prompt, type = 'general') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, type })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 404) return '⚠️ Backend tidak ditemukan. Pastikan server running.';
            if (response.status === 401 || response.status === 403) return '❌ API Key tidak valid.';
            if (response.status === 429) return '⚠️ Terlalu banyak request.';
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.success ? data.response : '❌ Respons tidak valid.';
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            return '❌ Tidak dapat terhubung ke backend.';
        }
        return `❌ Error: ${error.message}`;
    }
}

function showAILoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<p>🤖 AI sedang menganalisis...</p><p style="opacity:0.6">⏳ Tunggu sebentar</p>';
    }
}

// ====================================
// CHART.JS FUNCTIONS
// ====================================
function initializeCharts() {
    createDailySummaryChart();
    createActivityTrendChart();
    createCalorieBalanceChart();
    createActivityDistributionChart();
    createWeeklyComparisonChart();
}

function createDailySummaryChart() {
    const ctx = document.getElementById('dailySummaryChart');
    if (!ctx) return;

    const data = getDailySummaryData();
    
    if (dailySummaryChart) {
        dailySummaryChart.destroy();
    }

    dailySummaryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Langkah', 'Lari (km)', 'Air (L)', 'Tidur (jam)', 'Gym (menit)'],
            datasets: [{
                data: data,
                backgroundColor: [
                    '#22c55e',
                    '#3b82f6',
                    '#06b6d4',
                    '#8b5cf6',
                    '#f59e0b'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

function createActivityTrendChart() {
    const ctx = document.getElementById('activityTrendChart');
    if (!ctx) return;

    const data = getActivityTrendData();
    
    if (activityTrendChart) {
        activityTrendChart.destroy();
    }

    activityTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Langkah (ribuan)',
                    data: data.steps,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Lari (km)',
                    data: data.running,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Air (L)',
                    data: data.water,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tanggal'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Nilai'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function createCalorieBalanceChart() {
    const ctx = document.getElementById('calorieBalanceChart');
    if (!ctx) return;

    const data = getCalorieBalanceData();
    
    if (calorieBalanceChart) {
        calorieBalanceChart.destroy();
    }

    calorieBalanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Kalori Masuk',
                    data: data.caloriesIn,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1
                },
                {
                    label: 'Kalori Keluar',
                    data: data.caloriesOut,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tanggal'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Kalori'
                    }
                }
            }
        }
    });
}

function createActivityDistributionChart() {
    const ctx = document.getElementById('activityDistributionChart');
    if (!ctx) return;

    const data = getActivityDistributionData();
    
    if (activityDistributionChart) {
        activityDistributionChart.destroy();
    }

    activityDistributionChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    '#22c55e',
                    '#3b82f6',
                    '#a855f7',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.r;
                            return `${label}: ${value} sesi`;
                        }
                    }
                }
            }
        }
    });
}

function createWeeklyComparisonChart() {
    const ctx = document.getElementById('weeklyComparisonChart');
    if (!ctx) return;

    const data = getWeeklyComparisonData();
    
    if (weeklyComparisonChart) {
        weeklyComparisonChart.destroy();
    }

    weeklyComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Langkah', 'Lari', 'Air', 'Tidur', 'Gym', 'Makanan'],
            datasets: [
                {
                    label: 'Minggu Ini',
                    data: data.thisWeek,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#22c55e'
                },
                {
                    label: 'Minggu Lalu',
                    data: data.lastWeek,
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    pointBackgroundColor: '#6b7280',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#6b7280'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Chart Data Functions
function getDailySummaryData() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return [0, 0, 0, 0, 0];
    }

    const todaySteps = getTodayTotal('steps') / 1000; // Convert to thousands
    const todayDistance = getTodayTotal('running');
    const todayWater = getTodayWaterTotal();
    const todaySleep = getLastSleep();
    const todayGym = getTodayGymTotal();

    return [todaySteps, todayDistance, todayWater, todaySleep, todayGym];
}

function getActivityTrendData() {
    const labels = [];
    const steps = [];
    const running = [];
    const water = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        labels.push(dateStr);

        if (currentUser && userActivityData[currentUser.email]) {
            const daySteps = getDayTotal('steps', date) / 1000; // Convert to thousands
            const dayRunning = getDayTotal('running', date);
            const dayWater = getDayWaterTotal(date);

            steps.push(daySteps);
            running.push(dayRunning);
            water.push(dayWater);
        } else {
            steps.push(0);
            running.push(0);
            water.push(0);
        }
    }

    return { labels, steps, running, water };
}

function getCalorieBalanceData() {
    const labels = [];
    const caloriesIn = [];
    const caloriesOut = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        labels.push(dateStr);

        if (currentUser && userActivityData[currentUser.email]) {
            const dayCaloriesIn = getDayTotal('food', date);
            const daySteps = getDayTotal('steps', date);
            const dayRunning = getDayTotal('running', date);
            const dayCaloriesOut = Math.round(daySteps * 0.04 + dayRunning * 60); // Estimation

            caloriesIn.push(dayCaloriesIn);
            caloriesOut.push(dayCaloriesOut);
        } else {
            caloriesIn.push(0);
            caloriesOut.push(0);
        }
    }

    return { labels, caloriesIn, caloriesOut };
}

function getActivityDistributionData() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return { labels: [], values: [] };
    }

    const userData = userActivityData[currentUser.email];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const categoryStats = {};
    
    if (userData.gym) {
        userData.gym
            .filter(item => new Date(item.date) >= weekAgo)
            .forEach(item => {
                const category = item.category || 'Other';
                categoryStats[category] = (categoryStats[category] || 0) + 1;
            });
    }

    // Convert to readable names
    const labels = Object.keys(categoryStats).map(key => {
        return gymExerciseData[key] ? gymExerciseData[key].name : key;
    });
    const values = Object.values(categoryStats);

    if (labels.length === 0) {
        return { labels: ['Belum ada data'], values: [1] };
    }

    return { labels, values };
}

function getWeeklyComparisonData() {
    const thisWeek = [
        Math.min(getWeeklyTotal('steps') / 70000 * 100, 100), // 70k steps = 100%
        Math.min(getWeeklyTotal('running') / 35 * 100, 100), // 35km = 100%
        Math.min(getWeeklyTotal('water') / 14 * 100, 100), // 14L (2L x 7 days) = 100%
        Math.min(getWeeklyAverage('sleep') / 8 * 100, 100), // 8 hours = 100%
        Math.min(getMonthlyGymSessions() / 12 * 100, 100), // 12 sessions/month = 100%
        Math.min(getWeeklyTotal('food') / 14000 * 100, 100) // 14k calories = 100%
    ];

    // For last week, we'll simulate some data (in real app, you'd store historical data)
    const lastWeek = thisWeek.map(value => Math.max(0, value - Math.random() * 30));

    return { thisWeek, lastWeek };
}

function getDayTotal(type, date) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }

    const data = userActivityData[currentUser.email][type];
    const dateStr = date.toDateString();

    if (type === 'food') {
        return data
            .filter(item => new Date(item.date).toDateString() === dateStr)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }

    return data
        .filter(item => new Date(item.date).toDateString() === dateStr)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getDayWaterTotal(date) {
    const dateStr = date.toDateString();
    return userActivityData[currentUser.email]?.water?.[dateStr] || 0;
}

// ====================================
// NAVIGATION FUNCTIONS
// ====================================
function showDashboard() {
    switchPage('dashboard');
    updateDashboardStats();
    updateProgressBars();
    
    // Initialize or update daily summary chart
    setTimeout(() => {
        createDailySummaryChart();
    }, 100);
}

function showAnalytics() {
    switchPage('analytics');
    initializeAnalytics();
    
    // Initialize all charts with delay to ensure elements are rendered
    setTimeout(() => {
        initializeCharts();
    }, 100);
}

function showHarian() {
    switchPage('harian');
    updateHarianSummary();
}

function switchPage(page) {
    console.log('Switching to page:', page);
    
    // Hide all content
    document.querySelectorAll('.content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected content
    const targetContent = document.getElementById(`${page}Content`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetNav = document.getElementById(`nav-${page}`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
}

// ====================================
// USER AUTHENTICATION
// ====================================
function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // ✅ ADD DEBUGGING
    console.log('🔐 Login attempt for:', email);
    
    if (!email || !password) {
        showError('loginError', 'Email dan password tidak boleh kosong!');
        return;
    }
    
    const user = usersDatabase.find(u => u.email === email && u.password === password);
    
    // ✅ ADD MORE DEBUGGING
    if (!user) {
        console.error('❌ User not found');
        console.log('📝 Available users:', usersDatabase.map(u => u.email));
        showError('loginError', 'Email atau password salah!');
        return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('📊 hasCompletedData:', user.hasCompletedData);
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // ✅ CRITICAL: Check hasCompletedData
    if (user.hasCompletedData) {
        console.log('➡️ Going to Dashboard');
        goToDashboard();
    } else {
        console.log('➡️ Going to Input Data (profile incomplete)');
        alert('Silakan lengkapi profil Anda terlebih dahulu.');
        goToInputData();
    }
}

function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showError('registerError', 'Semua field harus diisi!');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('registerError', 'Password tidak sama!');
        return;
    }
    
    if (usersDatabase.find(u => u.email === email)) {
        showError('registerError', 'Email sudah terdaftar!');
        return;
    }
    
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: password,
        hasCompletedData: false,
        isGoogleUser: false
    };
    
    usersDatabase.push(newUser);
    localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    goToInputData();
}

function saveDataAndGoToDashboard() {
    const userData = {
        namaLengkap: document.getElementById('namaLengkap').value,
        tempatLahir: document.getElementById('tempatLahir').value,
        tanggalLahir: document.getElementById('tanggalLahir').value,
        golonganDarah: document.getElementById('golonganDarah').value,
        tinggiBadan: document.getElementById('tinggiBadan').value,
        beratBadan: document.getElementById('beratBadan').value,
        nomorWA: document.getElementById('nomorWA').value
    };
    
    // Validate all fields
    for (const [key, value] of Object.entries(userData)) {
        if (!value) {
            alert('Semua field harus diisi!');
            return;
        }
    }
    
    // Update user data
    currentUser = { ...currentUser, ...userData, hasCompletedData: true };
    
    // Update database
    const userIndex = usersDatabase.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        usersDatabase[userIndex] = currentUser;
        localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Initialize user activity data
    initializeUserActivityData();
    
    goToDashboard();
}

function logout() {
    signOutGoogle();
    currentUser = null;
    localStorage.removeItem('currentUser');
    goToLanding();
}

// ====================================
// PAGE NAVIGATION
// ====================================
function goToLanding() {
    showPage('landingPage');
}

function goToInputData() {
    showPage('inputDataPage');
    prefillInputData();
}

function goToDashboard() {
    console.log('🚀 goToDashboard() called');
    
    // ✅ CHECK if user exists
    if (!currentUser) {
        console.error('❌ No current user!');
        alert('Error: Please login first');
        showPage('landingPage');
        return;
    }
    
    console.log('👤 Current user:', currentUser.email);
    
    // Update email display
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) {
        emailDisplay.textContent = currentUser.email;
        console.log('✅ Email updated');
    } else {
        console.warn('⚠️ userEmailDisplay element not found in HTML');
    }
    
    // Show user photo if available
    if (currentUser.picture) {
        const userPhoto = document.getElementById('userPhoto');
        if (userPhoto) {
            userPhoto.src = currentUser.picture;
            userPhoto.style.display = 'inline-block';
        }
    }
    
    // ✅ CRITICAL: Show dashboard page
    console.log('📄 Showing dashboard page...');
    showPage('dashboardPage');
    
    // Initialize data
    console.log('📊 Initializing data...');
    initializeUserActivityData();
    loadUserProfile();
    showDashboard();

    // ✅ Initialize charts with longer delay
    console.log('📈 Will initialize charts in 500ms...');
    setTimeout(() => {
        console.log('📈 Initializing charts NOW...');
        
        if (typeof window.initializeCharts === 'function') {
            console.log('✅ Found window.initializeCharts');
            window.initializeCharts();
        } else if (typeof initializeCharts === 'function') {
            console.log('✅ Found initializeCharts');
            initializeCharts();
        } else {
            console.error('❌ initializeCharts NOT FOUND!');
            console.log('Available functions:', Object.keys(window).filter(k => k.includes('Chart')));
        }
    }, 500);
    
    console.log('✅ Dashboard loaded!');
}

function showPage(pageId) {
    console.log('📄 showPage called:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        console.log('  Hiding:', page.id);
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('  ✅ Showing:', pageId);
    } else {
        console.error('  ❌ Page not found:', pageId);
    }
}

function prefillInputData() {
    if (currentUser && currentUser.hasCompletedData) {
        document.getElementById('namaLengkap').value = currentUser.namaLengkap || currentUser.name || '';
        document.getElementById('tempatLahir').value = currentUser.tempatLahir || '';
        document.getElementById('tanggalLahir').value = currentUser.tanggalLahir || '';
        document.getElementById('golonganDarah').value = currentUser.golonganDarah || '';
        document.getElementById('tinggiBadan').value = currentUser.tinggiBadan || '';
        document.getElementById('beratBadan').value = currentUser.beratBadan || '';
        document.getElementById('nomorWA').value = currentUser.nomorWA || '';
    } else if (currentUser && currentUser.name) {
        // Pre-fill name from Google Auth
        document.getElementById('namaLengkap').value = currentUser.name;
    }
}



// ====================================
// PROGRESS BAR UPDATES
// ====================================
function updateProgressBars() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return;
    }

    // Steps progress (target: 10,000)
    const todaySteps = getTodayTotal('steps');
    const stepsProgress = Math.min((todaySteps / 10000) * 100, 100);
    setProgressBar('stepsProgress', stepsProgress);

    // Running progress (target: 5km)
    const todayDistance = getTodayTotal('running');
    const runningProgress = Math.min((todayDistance / 5) * 100, 100);
    setProgressBar('runningProgress', runningProgress);

    // Water progress (target: 2L)
    const todayWater = getTodayWaterTotal();
    const waterProgress = Math.min((todayWater / 2) * 100, 100);
    setProgressBar('waterProgress', waterProgress);

    // Sleep progress (target: 8 hours)
    const lastSleep = getLastSleep();
    const sleepProgress = Math.min((lastSleep / 8) * 100, 100);
    setProgressBar('sleepProgress', sleepProgress);

    // Gym progress (target: 1 hour)
    const todayGym = getTodayGymTotal();
    const gymProgress = Math.min((todayGym / 60) * 100, 100);
    setProgressBar('gymProgress', gymProgress);

    // Calorie progress (target: 2000 calories)
    const todayCalories = getTodayTotal('food');
    const calorieProgress = Math.min((todayCalories / 2000) * 100, 100);
    setProgressBar('calorieProgress', calorieProgress);
}

function setProgressBar(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.width = percentage + '%';
    }
}

// ====================================
// MODAL FUNCTIONS - STEPS
// ====================================
function openStepsModal() {
    document.getElementById('stepsModal').classList.add('active');
    updateStepsDisplay();
    loadStepsHistory();
}

function closeStepsModal() {
    document.getElementById('stepsModal').classList.remove('active');
}

async function addSteps() {
    const input = document.getElementById('stepsInput');
    const steps = parseInt(input.value);
    
    if (!steps || steps <= 0) {
        alert('Masukkan jumlah langkah yang valid!');
        return;
    }
    
    const stepsEntry = {
        value: steps,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    
    userActivityData[currentUser.email].steps.push(stepsEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // Get AI analysis
    showAILoading('stepsAIAnalysis');
    const totalSteps = getTodayTotal('steps');
    const userData = getUserProfile();
    
    const prompt = `Saya telah berjalan ${totalSteps} langkah hari ini. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    Berikan analisis aktivitas fisik dan motivasi untuk mencapai target 10,000 langkah harian!`;
    
    const aiResponse = await callOpenAI(prompt, 'steps');
    document.getElementById('stepsAIAnalysis').innerHTML = `<p>${aiResponse}</p>`;
    
    input.value = '';
    updateStepsDisplay();
    loadStepsHistory();
    updateDashboardStats();
    updateProgressBars();
}

function updateStepsDisplay() {
    const totalSteps = getTodayTotal('steps');
    const element = document.getElementById('totalStepsToday');
    if (element) {
        element.textContent = totalSteps.toLocaleString();
    }
}

function loadStepsHistory() {
    const historyDiv = document.getElementById('stepsHistory');
    if (!historyDiv) return;
    
    const stepsData = userActivityData[currentUser.email]?.steps || [];
    const last7Days = getLast7DaysEntries(stepsData);
    
    if (last7Days.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data langkah</p>';
        return;
    }
    
    const historyHTML = last7Days.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">${entry.value.toLocaleString()} langkah</div>
                    <div class="item-time">${dateStr} ${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// ====================================
// MODAL FUNCTIONS - RUNNING
// ====================================
function openRunningModal() {
    document.getElementById('runningModal').classList.add('active');
    updateRunningDisplay();
    loadRunningHistory();
}

function closeRunningModal() {
    document.getElementById('runningModal').classList.remove('active');
}

async function addRunning() {
    const input = document.getElementById('runningInput');
    const distance = parseFloat(input.value);
    
    if (!distance || distance <= 0) {
        alert('Masukkan jarak lari yang valid!');
        return;
    }
    
    const runningEntry = {
        value: distance,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    
    userActivityData[currentUser.email].running.push(runningEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // Get AI analysis
    showAILoading('runningAIAnalysis');
    const totalDistance = getTodayTotal('running');
    const userData = getUserProfile();
    
    const prompt = `Saya telah berlari total ${totalDistance}km hari ini. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    Berikan analisis performa lari dan tips untuk meningkatkan kemampuan lari saya!`;
    
    const aiResponse = await callOpenAI(prompt, 'running');
    document.getElementById('runningAIAnalysis').innerHTML = `<p>${aiResponse}</p>`;
    
    input.value = '';
    updateRunningDisplay();
    loadRunningHistory();
    updateDashboardStats();
    updateProgressBars();
}

function updateRunningDisplay() {
    const totalDistance = getTodayTotal('running');
    const element = document.getElementById('totalDistanceToday');
    if (element) {
        element.textContent = totalDistance.toFixed(1);
    }
}

function loadRunningHistory() {
    const historyDiv = document.getElementById('runningHistory');
    if (!historyDiv) return;
    
    const runningData = userActivityData[currentUser.email]?.running || [];
    const last7Days = getLast7DaysEntries(runningData);
    
    if (last7Days.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data lari</p>';
        return;
    }
    
    const historyHTML = last7Days.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">${entry.value}km</div>
                    <div class="item-time">${dateStr} ${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// ====================================
// MODAL FUNCTIONS - WATER (FIXED CENTERING)
// ====================================
function openWaterModal() {
    document.getElementById('waterModal').classList.add('active');
    updateWaterProgress();
    loadWaterHistory();
}

function closeWaterModal() {
    document.getElementById('waterModal').classList.remove('active');
}

async function addWater() {
    const input = document.getElementById('waterInput');
    const unit = document.getElementById('waterUnit').value;
    let amount = parseFloat(input.value);
    
    if (!amount || amount <= 0) {
        alert('Masukkan jumlah air yang valid!');
        return;
    }
    
    // Convert to liters
    if (unit === 'gelas') {
        amount = amount * 0.25; // 1 gelas = 250ml = 0.25L
    }
    
    const today = new Date().toDateString();
    
    if (!userActivityData[currentUser.email]) {
        userActivityData[currentUser.email] = {};
    }
    if (!userActivityData[currentUser.email].water) {
        userActivityData[currentUser.email].water = {};
    }
    if (!userActivityData[currentUser.email].water[today]) {
        userActivityData[currentUser.email].water[today] = 0;
    }
    
    userActivityData[currentUser.email].water[today] += amount;
    
    // Get AI recommendation
    const waterData = userActivityData[currentUser.email].water[today];
    const userData = getUserProfile();
    
    showAILoading('waterAI');
    
    const prompt = `Saya telah minum ${waterData.toFixed(1)}L air hari ini. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    Berikan rekomendasi konsumsi air yang tepat berdasarkan aktivitas dan kondisi tubuh saya!`;
    
    const aiResponse = await callOpenAI(prompt, 'water');
    document.getElementById('waterAI').innerHTML = `<p>${aiResponse}</p>`;
    
    input.value = '';
    updateWaterProgress();
    loadWaterHistory();
    updateDashboardStats();
    updateProgressBars();
    
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function updateWaterProgress() {
    const today = new Date().toDateString();
    const currentWater = userActivityData[currentUser.email]?.water?.[today] || 0;
    const target = 2.0; // 2L target
    
    // Update total water display in modal
    const totalWaterElement = document.getElementById('totalWaterToday');
    if (totalWaterElement) {
        totalWaterElement.textContent = currentWater.toFixed(1);
    }
    
    // Update progress elements
    const currentWaterElement = document.getElementById('currentWater');
    const targetWaterElement = document.getElementById('targetWater');
    const progressElement = document.getElementById('waterProgressBar');
    
    if (currentWaterElement) currentWaterElement.textContent = currentWater.toFixed(1);
    if (targetWaterElement) targetWaterElement.textContent = target.toFixed(1);
    
    const percentage = Math.min((currentWater / target) * 100, 100);
    if (progressElement) progressElement.style.width = percentage + '%';
}

function loadWaterHistory() {
    const historyDiv = document.getElementById('waterHistory');
    if (!historyDiv) return;
    
    const waterData = userActivityData[currentUser.email]?.water || {};
    
    const entries = Object.entries(waterData)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 7);
    
    if (entries.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data konsumsi air</p>';
        return;
    }
    
    const historyHTML = entries.map(([dateStr, amount]) => {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('id-ID');
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">${amount.toFixed(1)}L</div>
                    <div class="item-time">${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// ====================================
// MODAL FUNCTIONS - GYM
// ====================================
function openGymModal() {
    document.getElementById('gymModal').classList.add('active');
    loadGymHistory();
}

function closeGymModal() {
    document.getElementById('gymModal').classList.remove('active');
}

// ====================================
// GYM EXERCISE CATEGORIES & TYPES
// ====================================
const gymExerciseData = {
    cardio: {
        name: "Cardio & Aerobik",
        icon: "🏃",
        description: "Latihan untuk meningkatkan daya tahan kardiovaskular dan membakar kalori",
        exercises: [
            { value: "Treadmill Walking", name: "🚶 Treadmill Walking" },
            { value: "Treadmill Running", name: "🏃 Treadmill Running" },
            { value: "Elliptical Machine", name: "⭕ Elliptical Machine" },
            { value: "Stationary Bike", name: "🚴 Stationary Bike" },
            { value: "Spinning/Cycle Class", name: "🚴 Spinning/Cycle Class" },
            { value: "Rowing Machine", name: "🚣 Rowing Machine" },
            { value: "Stair Climber", name: "🪜 Stair Climber" },
            { value: "Arc Trainer", name: "🏃 Arc Trainer" },
            { value: "Jump Rope", name: "🪢 Jump Rope" },
            { value: "Battle Ropes", name: "🪢 Battle Ropes" },
            { value: "Burpees", name: "💥 Burpees" },
            { value: "Mountain Climbers", name: "⛰️ Mountain Climbers" },
            { value: "High Knees", name: "🦵 High Knees" },
            { value: "Jumping Jacks", name: "🤸 Jumping Jacks" }
        ],
        benefits: ["Membakar Kalori", "Kesehatan Jantung", "Stamina", "Mood Booster"]
    },
    strength: {
        name: "Strength Training",
        icon: "🏋️",
        description: "Latihan beban untuk membangun massa otot dan kekuatan",
        exercises: [
            // Upper Body
            { value: "Bench Press", name: "🏋️ Bench Press" },
            { value: "Incline Bench Press", name: "🏋️ Incline Bench Press" },
            { value: "Decline Bench Press", name: "🏋️ Decline Bench Press" },
            { value: "Dumbbell Press", name: "🏋️ Dumbbell Press" },
            { value: "Push Ups", name: "💪 Push Ups" },
            { value: "Pull Ups", name: "💪 Pull Ups" },
            { value: "Lat Pulldown", name: "💪 Lat Pulldown" },
            { value: "Seated Cable Row", name: "💪 Seated Cable Row" },
            { value: "Bent Over Row", name: "💪 Bent Over Row" },
            { value: "Shoulder Press", name: "💪 Shoulder Press" },
            { value: "Lateral Raises", name: "💪 Lateral Raises" },
            { value: "Front Raises", name: "💪 Front Raises" },
            { value: "Rear Delt Flyes", name: "💪 Rear Delt Flyes" },
            { value: "Bicep Curls", name: "💪 Bicep Curls" },
            { value: "Hammer Curls", name: "💪 Hammer Curls" },
            { value: "Tricep Dips", name: "💪 Tricep Dips" },
            { value: "Tricep Extensions", name: "💪 Tricep Extensions" },
            { value: "Cable Tricep Pushdown", name: "💪 Cable Tricep Pushdown" },
            
            // Lower Body
            { value: "Squats", name: "🦵 Squats" },
            { value: "Leg Press", name: "🦵 Leg Press" },
            { value: "Deadlifts", name: "🦵 Deadlifts" },
            { value: "Romanian Deadlifts", name: "🦵 Romanian Deadlifts" },
            { value: "Lunges", name: "🦵 Lunges" },
            { value: "Bulgarian Split Squats", name: "🦵 Bulgarian Split Squats" },
            { value: "Leg Curls", name: "🦵 Leg Curls" },
            { value: "Leg Extensions", name: "🦵 Leg Extensions" },
            { value: "Calf Raises", name: "🦵 Calf Raises" },
            { value: "Hip Thrusts", name: "🦵 Hip Thrusts" },
            { value: "Goblet Squats", name: "🦵 Goblet Squats" },
            
            // Core
            { value: "Planks", name: "🧘 Planks" },
            { value: "Russian Twists", name: "🧘 Russian Twists" },
            { value: "Crunches", name: "🧘 Crunches" },
            { value: "Leg Raises", name: "🧘 Leg Raises" },
            { value: "Dead Bug", name: "🧘 Dead Bug" },
            { value: "Bird Dog", name: "🧘 Bird Dog" }
        ],
        benefits: ["Massa Otot", "Kekuatan", "Metabolisme", "Density Tulang"]
    },
    functional: {
        name: "Functional Training",
        icon: "🤸",
        description: "Latihan yang meniru gerakan sehari-hari untuk meningkatkan performa fungsional",
        exercises: [
            { value: "CrossFit WOD", name: "💪 CrossFit WOD" },
            { value: "Kettlebell Swings", name: "🏋️ Kettlebell Swings" },
            { value: "Kettlebell Goblet Squats", name: "🏋️ Kettlebell Goblet Squats" },
            { value: "Kettlebell Clean & Press", name: "🏋️ Kettlebell Clean & Press" },
            { value: "TRX Suspension Training", name: "🪢 TRX Suspension Training" },
            { value: "Medicine Ball Slams", name: "⚽ Medicine Ball Slams" },
            { value: "Medicine Ball Throws", name: "⚽ Medicine Ball Throws" },
            { value: "Box Jumps", name: "📦 Box Jumps" },
            { value: "Step Ups", name: "📦 Step Ups" },
            { value: "Agility Ladder", name: "🪜 Agility Ladder" },
            { value: "Cone Drills", name: "🔺 Cone Drills" },
            { value: "Farmer's Walk", name: "🚶 Farmer's Walk" },
            { value: "Bear Crawl", name: "🐻 Bear Crawl" },
            { value: "Crab Walk", name: "🦀 Crab Walk" },
            { value: "Tire Flips", name: "🛞 Tire Flips" },
            { value: "Sled Push/Pull", name: "🛷 Sled Push/Pull" },
            { value: "Sandbag Training", name: "🎒 Sandbag Training" },
            { value: "Plyometric Exercises", name: "💥 Plyometric Exercises" },
            { value: "Circuit Training", name: "🔄 Circuit Training" },
            { value: "Tabata Protocol", name: "⏱️ Tabata Protocol" }
        ],
        benefits: ["Koordinasi", "Stabilitas", "Power", "Agility"]
    },
    flexibility: {
        name: "Flexibility & Recovery",
        icon: "🧘",
        description: "Latihan untuk meningkatkan fleksibilitas, keseimbangan, dan pemulihan",
        exercises: [
            // Yoga
            { value: "Hatha Yoga", name: "🧘 Hatha Yoga" },
            { value: "Vinyasa Yoga", name: "🧘 Vinyasa Yoga" },
            { value: "Ashtanga Yoga", name: "🧘 Ashtanga Yoga" },
            { value: "Yin Yoga", name: "🧘 Yin Yoga" },
            { value: "Hot Yoga/Bikram", name: "🧘 Hot Yoga/Bikram" },
            { value: "Power Yoga", name: "🧘 Power Yoga" },
            { value: "Restorative Yoga", name: "🧘 Restorative Yoga" },
            
            // Pilates
            { value: "Mat Pilates", name: "🤸 Mat Pilates" },
            { value: "Reformer Pilates", name: "🤸 Reformer Pilates" },
            { value: "Pilates Ball", name: "🤸 Pilates Ball" },
            { value: "Pilates Ring", name: "🤸 Pilates Ring" },
            
            // Stretching & Mobility
            { value: "Dynamic Stretching", name: "🤸 Dynamic Stretching" },
            { value: "Static Stretching", name: "🤸 Static Stretching" },
            { value: "PNF Stretching", name: "🤸 PNF Stretching" },
            { value: "Foam Rolling", name: "🔄 Foam Rolling" },
            { value: "Mobility Work", name: "🔄 Mobility Work" },
            { value: "Balance Training", name: "⚖️ Balance Training" },
            { value: "Tai Chi", name: "🧘 Tai Chi" },
            { value: "Qigong", name: "🧘 Qigong" },
            { value: "Meditation", name: "🧘 Meditation" },
            { value: "Breathing Exercises", name: "🫁 Breathing Exercises" }
        ],
        benefits: ["Fleksibilitas", "Keseimbangan", "Recovery", "Stress Relief"]
    },
    sports: {
        name: "Sports & Martial Arts",
        icon: "⚽",
        description: "Olahraga kompetitif dan seni bela diri",
        exercises: [
            // Martial Arts
            { value: "Boxing", name: "🥊 Boxing" },
            { value: "Kickboxing", name: "🥊 Kickboxing" },
            { value: "Muay Thai", name: "🥊 Muay Thai" },
            { value: "Mixed Martial Arts (MMA)", name: "🥊 Mixed Martial Arts (MMA)" },
            { value: "Taekwondo", name: "🥋 Taekwondo" },
            { value: "Karate", name: "🥋 Karate" },
            { value: "Judo", name: "🥋 Judo" },
            { value: "Brazilian Jiu-Jitsu", name: "🥋 Brazilian Jiu-Jitsu" },
            { value: "Krav Maga", name: "🥋 Krav Maga" },
            { value: "Capoeira", name: "🥋 Capoeira" },
            
            // Racket Sports
            { value: "Tennis", name: "🎾 Tennis" },
            { value: "Badminton", name: "🏸 Badminton" },
            { value: "Squash", name: "🎾 Squash" },
            { value: "Table Tennis", name: "🏓 Table Tennis" },
            
            // Team Sports
            { value: "Basketball", name: "🏀 Basketball" },
            { value: "Football/Soccer", name: "⚽ Football/Soccer" },
            { value: "Volleyball", name: "🏐 Volleyball" },
            { value: "Futsal", name: "⚽ Futsal" },
            
            // Individual Sports
            { value: "Rock Climbing", name: "🧗 Rock Climbing" },
            { value: "Bouldering", name: "🧗 Bouldering" },
            { value: "Parkour", name: "🏃 Parkour" },
            { value: "Fencing", name: "🤺 Fencing" },
            { value: "Archery", name: "🏹 Archery" }
        ],
        benefits: ["Skill Development", "Coordination", "Competition", "Self Defense"]
    },
    aquatic: {
        name: "Aquatic Exercise",
        icon: "🏊",
        description: "Latihan berbasis air untuk low-impact training",
        exercises: [
            { value: "Freestyle Swimming", name: "🏊 Freestyle Swimming" },
            { value: "Backstroke Swimming", name: "🏊 Backstroke Swimming" },
            { value: "Breaststroke Swimming", name: "🏊 Breaststroke Swimming" },
            { value: "Butterfly Swimming", name: "🏊 Butterfly Swimming" },
            { value: "Water Aerobics", name: "🏊 Water Aerobics" },
            { value: "Aqua Jogging", name: "🏊 Aqua Jogging" },
            { value: "Water Polo", name: "🏊 Water Polo" },
            { value: "Synchronized Swimming", name: "🏊 Synchronized Swimming" },
            { value: "Pool Walking", name: "🏊 Pool Walking" },
            { value: "Water Resistance Training", name: "🏊 Water Resistance Training" },
            { value: "Aqua Zumba", name: "🏊 Aqua Zumba" },
            { value: "Deep Water Running", name: "🏊 Deep Water Running" }
        ],
        benefits: ["Low Impact", "Full Body", "Joint Friendly", "Resistance Training"]
    },
    group: {
        name: "Group Classes",
        icon: "👥",
        description: "Kelas berkelompok dengan instruktur untuk motivasi dan variasi",
        exercises: [
            // Dance Fitness
            { value: "Zumba", name: "💃 Zumba" },
            { value: "Dance Fitness", name: "💃 Dance Fitness" },
            { value: "Barre", name: "💃 Barre" },
            { value: "Bollywood Dance", name: "💃 Bollywood Dance" },
            { value: "Hip Hop Dance", name: "💃 Hip Hop Dance" },
            
            // High Intensity
            { value: "HIIT Class", name: "🔥 HIIT Class" },
            { value: "Boot Camp", name: "🔥 Boot Camp" },
            { value: "Circuit Training Class", name: "🔥 Circuit Training Class" },
            { value: "Insanity Workout", name: "🔥 Insanity Workout" },
            { value: "P90X", name: "🔥 P90X" },
            { value: "Orange Theory", name: "🔥 Orange Theory" },
            
            // Mind-Body
            { value: "Group Yoga Class", name: "🧘 Group Yoga Class" },
            { value: "Group Pilates Class", name: "🧘 Group Pilates Class" },
            { value: "Meditation Class", name: "🧘 Meditation Class" },
            { value: "Breathwork Class", name: "🧘 Breathwork Class" },
            
            // Strength Classes
            { value: "Body Pump", name: "🏋️ Body Pump" },
            { value: "Group Strength Training", name: "🏋️ Group Strength Training" },
            { value: "Kettlebell Class", name: "🏋️ Kettlebell Class" },
            { value: "TRX Class", name: "🏋️ TRX Class" },
            
            // Cardio Classes
            { value: "Step Aerobics", name: "📦 Step Aerobics" },
            { value: "Spinning Class", name: "🚴 Spinning Class" },
            { value: "Cardio Kickboxing", name: "🥊 Cardio Kickboxing" },
            { value: "Cardio Dance", name: "💃 Cardio Dance" }
        ],
        benefits: ["Motivation", "Social", "Structured", "Fun"]
    }
};

function updateExerciseTypes() {
    const categorySelect = document.getElementById('exerciseCategorySelect');
    const typeSelect = document.getElementById('exerciseTypeSelect');
    const selectedCategory = categorySelect.value;
    
    // Clear previous options
    typeSelect.innerHTML = '<option value="">Pilih jenis latihan</option>';
    
    if (selectedCategory && gymExerciseData[selectedCategory]) {
        const category = gymExerciseData[selectedCategory];
        
        // Add exercises for selected category
        category.exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.value;
            option.textContent = exercise.name;
            typeSelect.appendChild(option);
        });
        
        // Show category info (optional - you can add this to the modal)
        showCategoryInfo(category);
    }
}

function showCategoryInfo(category) {
    // Check if info section already exists
    let infoSection = document.getElementById('categoryInfo');
    if (!infoSection) {
        infoSection = document.createElement('div');
        infoSection.id = 'categoryInfo';
        infoSection.className = 'exercise-category-info';
        
        // Insert after category select
        const categorySelect = document.getElementById('exerciseCategorySelect');
        categorySelect.parentNode.insertAdjacentElement('afterend', infoSection);
    }
    
    infoSection.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="font-size: 1.5rem;">${category.icon}</span>
            <strong>${category.name}</strong>
        </div>
        <p style="margin-bottom: 10px;">${category.description}</p>
        <div class="exercise-benefits">
            ${category.benefits.map(benefit => `<div class="benefit-item">${benefit}</div>`).join('')}
        </div>
    `;
}

async function addGymSession() {
    const exerciseCategory = document.getElementById('exerciseCategorySelect').value;
    const exerciseType = document.getElementById('exerciseTypeSelect').value;
    const duration = parseInt(document.getElementById('durationInput').value);
    
    if (!exerciseCategory || !exerciseType || !duration || duration <= 0) {
        alert('Pilih kategori, jenis latihan, dan masukkan durasi yang valid!');
        return;
    }
    
    const gymEntry = {
        category: exerciseCategory,
        type: exerciseType,
        duration: duration,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    if (!userActivityData[currentUser.email].gym) {
        userActivityData[currentUser.email].gym = [];
    }
    
    userActivityData[currentUser.email].gym.push(gymEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // Get AI analysis with more detailed info
    showAILoading('gymAI');
    const userData = getUserProfile();
    const categoryData = gymExerciseData[exerciseCategory];
    
    const prompt = `Saya baru selesai latihan ${exerciseType} (kategori: ${categoryData.name}) selama ${duration} menit. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    
    Ini adalah latihan yang fokus pada: ${categoryData.benefits.join(', ')}.
    
    Berikan analisis latihan ini, perkiraan kalori yang terbakar, dan rekomendasi:
    1. Recovery yang diperlukan
    2. Kombinasi latihan yang baik untuk sesi berikutnya
    3. Nutrisi yang disarankan
    4. Frekuensi latihan optimal untuk kategori ini`;
    
    const aiResponse = await callOpenAI(prompt, 'gym');
    document.getElementById('gymAI').innerHTML = `<p>${aiResponse}</p>`;
    
    // Clear inputs
    document.getElementById('exerciseCategorySelect').value = '';
    document.getElementById('exerciseTypeSelect').value = '';
    document.getElementById('durationInput').value = '';
    
    // Remove category info
    const infoSection = document.getElementById('categoryInfo');
    if (infoSection) {
        infoSection.remove();
    }
    
    loadGymHistory();
    updateDashboardStats();
    updateProgressBars();
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function loadGymHistory() {
    const historyDiv = document.getElementById('gymHistory');
    if (!historyDiv) return;
    
    const gymData = userActivityData[currentUser.email]?.gym || [];
    const last7Days = getLast7DaysEntries(gymData);
    
    if (last7Days.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data gym</p>';
        return;
    }
    
    const historyHTML = last7Days.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Get category info for icon
        const categoryData = gymExerciseData[entry.category] || { icon: '🏋️' };
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">
                        ${categoryData.icon} ${entry.type || entry.category} - ${entry.duration} menit
                    </div>
                    <div class="item-time">${dateStr} ${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// Update activity distribution chart to use new category data
function getActivityDistributionData() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return { labels: [], values: [] };
    }

    const userData = userActivityData[currentUser.email];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const categoryStats = {};
    
    if (userData.gym) {
        userData.gym
            .filter(item => new Date(item.date) >= weekAgo)
            .forEach(item => {
                const category = item.category || 'Other';
                categoryStats[category] = (categoryStats[category] || 0) + 1;
            });
    }

    // Convert to readable names
    const labels = Object.keys(categoryStats).map(key => {
        return gymExerciseData[key] ? gymExerciseData[key].name : key;
    });
    const values = Object.values(categoryStats);

    if (labels.length === 0) {
        return { labels: ['Belum ada data'], values: [1] };
    }

    return { labels, values };
}

// ====================================
// MODAL FUNCTIONS - SLEEP
// ====================================
function openSleepModal() {
    document.getElementById('sleepModal').classList.add('active');
    loadSleepHistory();
}

function closeSleepModal() {
    document.getElementById('sleepModal').classList.remove('active');
}

async function addSleep() {
    const input = document.getElementById('sleepInput');
    const hours = parseFloat(input.value);
    
    if (!hours || hours <= 0 || hours > 24) {
        alert('Masukkan durasi tidur yang valid (0-24 jam)!');
        return;
    }
    
    const sleepEntry = {
        value: hours,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    if (!userActivityData[currentUser.email].sleep) {
        userActivityData[currentUser.email].sleep = [];
    }
    
    userActivityData[currentUser.email].sleep.push(sleepEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // Get AI analysis
    showAILoading('sleepAI');
    const userData = getUserProfile();
    
    const prompt = `Saya tidur selama ${hours} jam semalam. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    Berikan analisis kualitas tidur dan tips untuk meningkatkan kualitas tidur saya!`;
    
    const aiResponse = await callOpenAI(prompt, 'sleep');
    document.getElementById('sleepAI').innerHTML = `<p>${aiResponse}</p>`;
    
    input.value = '';
    loadSleepHistory();
    updateDashboardStats();
    updateProgressBars();
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function loadSleepHistory() {
    const historyDiv = document.getElementById('sleepHistory');
    if (!historyDiv) return;
    
    const sleepData = userActivityData[currentUser.email]?.sleep || [];
    const last7Days = getLast7DaysEntries(sleepData);
    
    if (last7Days.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data tidur</p>';
        return;
    }
    
    const historyHTML = last7Days.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID');
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">${entry.value} jam</div>
                    <div class="item-time">${dateStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// ====================================
// MODAL FUNCTIONS - FOOD
// ====================================
function openFoodModal() {
    document.getElementById('foodModal').classList.add('active');
    loadFoodHistory();
}

function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('active');
}

async function addFood() {
    const name = document.getElementById('foodNameInput').value.trim();
    const calories = parseInt(document.getElementById('foodCalorieInput').value) || 0;
    const carbs = parseInt(document.getElementById('foodCarbInput').value) || 0;
    const protein = parseInt(document.getElementById('foodProteinInput').value) || 0;
    const fat = parseInt(document.getElementById('foodFatInput').value) || 0;
    
    if (!name || calories <= 0) {
        alert('Masukkan nama makanan dan kalori yang valid!');
        return;
    }
    
    const foodEntry = {
        name: name,
        calories: calories,
        carbs: carbs,
        protein: protein,
        fat: fat,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    if (!userActivityData[currentUser.email].food) {
        userActivityData[currentUser.email].food = [];
    }
    
    userActivityData[currentUser.email].food.push(foodEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    // Get AI analysis
    showAILoading('foodAI');
    const totalCalories = getTodayTotal('food');
    const userData = getUserProfile();
    
    const prompt = `Saya baru makan ${name} (${calories} kalori, ${carbs}g karbohidrat, ${protein}g protein, ${fat}g lemak). 
    Total kalori hari ini: ${totalCalories}. 
    Data saya: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    Berikan analisis nutrisi dan saran makanan untuk mencapai tujuan kesehatan saya!`;
    
    const aiResponse = await callOpenAI(prompt, 'food');
    document.getElementById('foodAI').innerHTML = `<p>${aiResponse}</p>`;
    
    // Clear inputs
    document.getElementById('foodNameInput').value = '';
    document.getElementById('foodCalorieInput').value = '';
    document.getElementById('foodCarbInput').value = '';
    document.getElementById('foodProteinInput').value = '';
    document.getElementById('foodFatInput').value = '';
    
    loadFoodHistory();
    updateDashboardStats();
    updateProgressBars();
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

async function detectFoodFromPhoto() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Show loading
        const foodAI = document.getElementById('foodAI');
        foodAI.innerHTML = '<p>📸 Menganalisis foto makanan...</p><p style="opacity:0.6">⏳ Harap tunggu</p>';
        
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async function(e) {
                const base64 = e.target.result.split(',')[1];
                
                try {
                    const response = await fetch(`${API_BASE_URL}/api/detect-food`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64 })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.success && data.food) {
                        // Fill the form with detected food data
                        document.getElementById('foodNameInput').value = data.food.nama || '';
                        document.getElementById('foodCalorieInput').value = data.food.kalori || '';
                        document.getElementById('foodCarbInput').value = data.food.karbohidrat || '';
                        document.getElementById('foodProteinInput').value = data.food.protein || '';
                        document.getElementById('foodFatInput').value = data.food.lemak || '';
                        
                        foodAI.innerHTML = `<p>✅ Makanan terdeteksi: <strong>${data.food.nama}</strong></p>
                                          <p>${data.food.deskripsi || 'Data sudah diisi otomatis di form di atas.'}</p>`;
                    } else {
                        throw new Error(data.error || 'Gagal mendeteksi makanan');
                    }
                } catch (error) {
                    console.error('Food detection error:', error);
                    foodAI.innerHTML = `<p>❌ ${error.message}</p>
                                       <p>Silakan input makanan secara manual.</p>`;
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File processing error:', error);
            foodAI.innerHTML = '<p>❌ Gagal memproses foto. Silakan coba lagi.</p>';
        }
    };
    
    input.click();
}

function loadFoodHistory() {
    const historyDiv = document.getElementById('foodHistory');
    if (!historyDiv) return;
    
    const foodData = userActivityData[currentUser.email]?.food || [];
    const last7Days = getLast7DaysEntries(foodData);
    
    if (last7Days.length === 0) {
        historyDiv.innerHTML = '<p style="text-align: center; color: #666;">Belum ada data makanan</p>';
        return;
    }
    
    const historyHTML = last7Days.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="history-item">
                <div class="item-info">
                    <div class="item-value">${entry.name} - ${entry.calories} kal</div>
                    <div class="item-time">${dateStr} ${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// ====================================
// PROFILE FUNCTIONS
// ====================================
function toggleProfile() {
    const modal = document.getElementById('profileModal');
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        modal.classList.add('active');
        loadUserProfile();
    }
}

function loadUserProfile() {
    if (!currentUser) return;
    
    // Show profile photo
    if (currentUser.picture) {
        const profilePhoto = document.getElementById('profilePhoto');
        const profilePlaceholder = document.getElementById('profilePlaceholder');
        if (profilePhoto && profilePlaceholder) {
            profilePhoto.src = currentUser.picture;
            profilePhoto.style.display = 'block';
            profilePlaceholder.style.display = 'none';
        }
    }
    
    document.getElementById('displayEmail').textContent = currentUser.email || '';
    document.getElementById('displayNama').textContent = currentUser.namaLengkap || currentUser.name || '';
    
    const ttl = currentUser.tempatLahir && currentUser.tanggalLahir 
        ? `${currentUser.tempatLahir}, ${formatDate(currentUser.tanggalLahir)}` 
        : '';
    document.getElementById('displayTTL').textContent = ttl;
    
    document.getElementById('displayGolDar').textContent = currentUser.golonganDarah || '';
    document.getElementById('displayTinggi').textContent = currentUser.tinggiBadan ? `${currentUser.tinggiBadan} cm` : '';
    document.getElementById('displayBerat').textContent = currentUser.beratBadan ? `${currentUser.beratBadan} kg` : '';
    document.getElementById('displayWA').textContent = currentUser.nomorWA || '';
}

// ====================================
// ANALYTICS FUNCTIONS
// ====================================
function initializeAnalytics() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        updateAnalyticsOverview();
        return;
    }
    
    updateAnalyticsOverview();
}

function updateAnalyticsOverview() {
    const userData = userActivityData[currentUser.email];
    if (!userData) {
        // Set all to 0 if no data
        setElementText('periodSteps', '0');
        setElementText('periodDistance', '0');
        setElementText('periodWater', '0');
        setElementText('avgSleep', '0');
        setElementText('summaryCalorieIn', '0');
        setElementText('summaryCalorieOut', '0');
        setElementText('summaryDeficit', '0');
        return;
    }
    
    // Calculate period totals based on current filter
    let periodSteps, periodDistance, periodWater, avgSleep;
    
    switch (currentPeriod) {
        case '7days':
            periodSteps = getWeeklyTotal('steps');
            periodDistance = getWeeklyTotal('running');
            periodWater = getWeeklyTotal('water');
            avgSleep = getWeeklyAverage('sleep');
            break;
        case '30days':
            periodSteps = getMonthlyTotal('steps');
            periodDistance = getMonthlyTotal('running');
            periodWater = getMonthlyTotal('water');
            avgSleep = getMonthlyAverage('sleep');
            break;
        case '90days':
            periodSteps = getQuarterlyTotal('steps');
            periodDistance = getQuarterlyTotal('running');
            periodWater = getQuarterlyTotal('water');
            avgSleep = getQuarterlyAverage('sleep');
            break;
        default:
            periodSteps = getWeeklyTotal('steps');
            periodDistance = getWeeklyTotal('running');
            periodWater = getWeeklyTotal('water');
            avgSleep = getWeeklyAverage('sleep');
    }
    
    // Calculate calorie balance
    const totalCalorieIn = getWeeklyTotal('food');
    const totalCalorieOut = Math.round(periodSteps * 0.04 + periodDistance * 60); // Estimation
    const deficit = totalCalorieOut - totalCalorieIn;
    
    // Update display
    setElementText('periodSteps', periodSteps.toLocaleString());
    setElementText('periodDistance', periodDistance.toFixed(1));
    setElementText('periodWater', periodWater.toFixed(1));
    setElementText('avgSleep', avgSleep.toFixed(1));
    setElementText('summaryCalorieIn', totalCalorieIn.toLocaleString());
    setElementText('summaryCalorieOut', totalCalorieOut.toLocaleString());
    setElementText('summaryDeficit', deficit.toLocaleString());
}

function changeAnalyticsPeriod(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Hide custom date picker if not custom
    if (period !== 'custom') {
        document.getElementById('customDatePicker').style.display = 'none';
    }
    
    // Update analytics
    updateAnalyticsOverview();
    
    // Refresh charts with delay
    setTimeout(() => {
        initializeCharts();
    }, 100);
}

function toggleCustomDatePicker() {
    const picker = document.getElementById('customDatePicker');
    picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
}

function applyCustomDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Pilih tanggal mulai dan selesai!');
        return;
    }
    
    customStartDate = new Date(startDate);
    customEndDate = new Date(endDate);
    currentPeriod = 'custom';
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-period="custom"]').classList.add('active');
    
    updateAnalyticsOverview();
    
    // Refresh charts
    setTimeout(() => {
        initializeCharts();
    }, 100);
}

async function generateAnalyticsInsight() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        alert('Belum ada data untuk dianalisis!');
        return;
    }
    
    showAILoading('analyticsAI');
    
    const periodSteps = getWeeklyTotal('steps');
    const periodDistance = getWeeklyTotal('running');
    const periodWater = getWeeklyTotal('water');
    const avgSleep = getWeeklyAverage('sleep');
    const totalCalorieIn = getWeeklyTotal('food');
    const totalCalorieOut = Math.round(periodSteps * 0.04 + periodDistance * 60);
    const userData = getUserProfile();
    
    const prompt = `Berdasarkan data aktivitas periode saya:
    - Langkah: ${periodSteps}
    - Lari: ${periodDistance}km
    - Air: ${periodWater}L
    - Rata-rata tidur: ${avgSleep} jam/hari
    - Kalori masuk: ${totalCalorieIn}
    - Kalori keluar: ${totalCalorieOut}
    - Net balance: ${totalCalorieOut - totalCalorieIn}
    
    Data pribadi: Berat ${userData.beratBadan}kg, Tinggi ${userData.tinggiBadan}cm, Umur ${calculateAge(userData.tanggalLahir)} tahun.
    
    Berikan insight mendalam, analisis tren, dan rekomendasi strategis yang actionable untuk periode ke depan!`;
    
    const aiResponse = await callOpenAI(prompt, 'analytics');
    document.getElementById('analyticsAI').innerHTML = `<p>${aiResponse}</p>`;
}

// ====================================
// HARIAN FUNCTIONS
// ====================================
function updateHarianSummary() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        // Reset all summary to 0
        setElementText('summarySteps', '0 langkah');
        setElementText('summaryRun', '0 km');
        setElementText('summaryWater', '0 L');
        setElementText('summarySleep', '0 jam');
        setElementText('summaryGym', '0 menit');
        return;
    }
    
    const todaySteps = getTodayTotal('steps');
    const todayRun = getTodayTotal('running');
    const todayWater = getTodayWaterTotal();
    const todaySleep = getLastSleep();
    const todayGym = getTodayGymTotal();
    
    setElementText('summarySteps', `${todaySteps.toLocaleString()} langkah`);
    setElementText('summaryRun', `${todayRun.toFixed(1)} km`);
    setElementText('summaryWater', `${todayWater.toFixed(1)} L`);
    setElementText('summarySleep', `${todaySleep} jam`);
    setElementText('summaryGym', `${todayGym} menit`);
}

function saveHarianSteps() {
    const steps = parseInt(document.getElementById('harianSteps').value);
    if (!steps || steps <= 0) {
        alert('Masukkan jumlah langkah yang valid!');
        return;
    }
    
    const stepsEntry = {
        value: steps,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    
    userActivityData[currentUser.email].steps.push(stepsEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    document.getElementById('harianSteps').value = '';
    updateHarianSummary();
    updateDashboardStats();
    updateProgressBars();
    
    showSuccessMessage('Data langkah berhasil disimpan!');

    // Refresh charts
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}


function saveHarianRun() {
    const distance = parseFloat(document.getElementById('harianRun').value);
    if (!distance || distance <= 0) {
        alert('Masukkan jarak lari yang valid!');
        return;
    }
    
    const runEntry = {
        value: distance,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    
    userActivityData[currentUser.email].running.push(runEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    document.getElementById('harianRun').value = '';
    updateHarianSummary();
    updateDashboardStats();
    updateProgressBars();
    
    showSuccessMessage('Data lari berhasil disimpan!');
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function saveHarianWater() {
    const liters = parseFloat(document.getElementById('harianWater').value);
    if (!liters || liters <= 0) {
        alert('Masukkan jumlah air yang valid!');
        return;
    }
    
    const today = new Date().toDateString();
    
    if (!userActivityData[currentUser.email]) {
        userActivityData[currentUser.email] = {};
    }
    if (!userActivityData[currentUser.email].water) {
        userActivityData[currentUser.email].water = {};
    }
    
    userActivityData[currentUser.email].water[today] = liters;
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    document.getElementById('harianWater').value = '';
    updateHarianSummary();
    updateDashboardStats();
    updateProgressBars();
    
    showSuccessMessage('Data konsumsi air berhasil disimpan!');
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function saveHarianSleep() {
    const hours = parseFloat(document.getElementById('harianSleep').value);
    if (!hours || hours <= 0 || hours > 24) {
        alert('Masukkan durasi tidur yang valid (0-24 jam)!');
        return;
    }
    
    const sleepEntry = {
        value: hours,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    if (!userActivityData[currentUser.email].sleep) {
        userActivityData[currentUser.email].sleep = [];
    }
    
    userActivityData[currentUser.email].sleep.push(sleepEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    document.getElementById('harianSleep').value = '';
    updateHarianSummary();
    updateDashboardStats();
    updateProgressBars();
    
    showSuccessMessage('Data tidur berhasil disimpan!');
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

function saveHarianGym() {
    const minutes = parseInt(document.getElementById('harianGym').value);
    if (!minutes || minutes <= 0) {
        alert('Masukkan durasi gym yang valid!');
        return;
    }
    
    const gymEntry = {
        type: 'General',
        duration: minutes,
        date: new Date().toISOString()
    };
    
    if (!userActivityData[currentUser.email]) {
        initializeUserActivityData();
    }
    if (!userActivityData[currentUser.email].gym) {
        userActivityData[currentUser.email].gym = [];
    }
    
    userActivityData[currentUser.email].gym.push(gymEntry);
    localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    
    document.getElementById('harianGym').value = '';
    updateHarianSummary();
    updateDashboardStats();
    updateProgressBars();
    
    showSuccessMessage('Data gym berhasil disimpan!');
    
    // ✅ AUTO-UPDATE CHARTS
    if (typeof window.refreshAllCharts === 'function') {
        window.refreshAllCharts();
    }
}

// ====================================
// DASHBOARD UPDATE FUNCTIONS
// ====================================
function updateDashboardStats() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        // Set all dashboard stats to 0
        setElementText('todaySteps', '0');
        setElementText('todayDistance', '0.0');
        setElementText('todayWater', '0.0');
        setElementText('gymSessions', '0');
        setElementText('lastSleep', '0');
        setElementText('todayCalorieIn', '0');
        setElementText('todayCaloriesBurned', '0');
        setElementText('weeklyGoalProgress', '0%');
        setElementText('streakDays', '0');
        return;
    }
    
    const todaySteps = getTodayTotal('steps');
    const todayDistance = getTodayTotal('running');
    const todayWater = getTodayWaterTotal();
    const monthlyGymSessions = getMonthlyGymSessions();
    const lastSleepHours = getLastSleep();
    const todayCalorieIn = getTodayTotal('food');
    
    // Calculate calories burned (estimation)
    const caloriesBurned = Math.round(todaySteps * 0.04 + todayDistance * 60);
    
    // Calculate weekly goal progress (10k steps target)
    const weeklyGoalProgress = Math.min((getWeeklyTotal('steps') / 70000) * 100, 100);
    
    // Calculate streak days (simplified - days with activity)
    const streakDays = calculateActivityStreak();
    
    setElementText('todaySteps', todaySteps.toLocaleString());
    setElementText('todayDistance', todayDistance.toFixed(1));
    setElementText('todayWater', todayWater.toFixed(1));
    setElementText('gymSessions', monthlyGymSessions.toString());
    setElementText('lastSleep', lastSleepHours.toString());
    setElementText('todayCalorieIn', todayCalorieIn.toLocaleString());
    setElementText('todayCaloriesBurned', caloriesBurned.toLocaleString());
    setElementText('weeklyGoalProgress', weeklyGoalProgress.toFixed(0) + '%');
    setElementText('streakDays', streakDays.toString());
}

function calculateActivityStreak() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return 0;
    }
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const daySteps = getDayTotal('steps', checkDate);
        const dayRunning = getDayTotal('running', checkDate);
        const dayWater = getDayWaterTotal(checkDate);
        
        // Consider it an active day if they have any activity
        if (daySteps > 0 || dayRunning > 0 || dayWater > 0) {
            streak++;
        } else {
            break; // Streak broken
        }
    }
    
    return streak;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function initializeUserActivityData() {
    if (!userActivityData[currentUser.email]) {
        userActivityData[currentUser.email] = {
            steps: [],
            running: [],
            water: {},
            gym: [],
            sleep: [],
            food: []
        };
        localStorage.setItem('userActivityData', JSON.stringify(userActivityData));
    }
}

function getUserProfile() {
    return {
        beratBadan: currentUser.beratBadan || 70,
        tinggiBadan: currentUser.tinggiBadan || 170,
        tanggalLahir: currentUser.tanggalLahir || '1990-01-01'
    };
}

function getTodayTotal(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const today = new Date().toDateString();
    
    if (type === 'food') {
        // Sum calories for food
        return data
            .filter(item => new Date(item.date).toDateString() === today)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    // For steps and running, sum values
    return data
        .filter(item => new Date(item.date).toDateString() === today)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getTodayWaterTotal() {
    const today = new Date().toDateString();
    return userActivityData[currentUser.email]?.water?.[today] || 0;
}

function getTodayGymTotal() {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const today = new Date().toDateString();
    return userActivityData[currentUser.email].gym
        .filter(item => new Date(item.date).toDateString() === today)
        .reduce((sum, item) => sum + (item.duration || 0), 0);
}

function getLastSleep() {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email].sleep) {
        return 0;
    }
    
    const sleepData = userActivityData[currentUser.email].sleep;
    if (sleepData.length === 0) return 0;
    
    // Get last sleep entry
    const lastSleep = sleepData[sleepData.length - 1];
    return lastSleep.value || 0;
}

function getMonthlyGymSessions() {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return userActivityData[currentUser.email].gym
        .filter(item => new Date(item.date) >= monthStart)
        .length;
}

function getWeeklyTotal(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    if (type === 'water') {
        // Water is stored differently (by date string)
        let total = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            total += data[dateStr] || 0;
        }
        return total;
    }
    
    if (type === 'food') {
        // Sum calories for food
        return data
            .filter(item => new Date(item.date) >= weekAgo)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    // For steps and running, sum values
    return data
        .filter(item => new Date(item.date) >= weekAgo)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getMonthlyTotal(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    if (type === 'water') {
        let total = 0;
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            total += data[dateStr] || 0;
        }
        return total;
    }
    
    if (type === 'food') {
        return data
            .filter(item => new Date(item.date) >= monthAgo)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    return data
        .filter(item => new Date(item.date) >= monthAgo)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getQuarterlyTotal(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const quarterAgo = new Date();
    quarterAgo.setDate(quarterAgo.getDate() - 90);
    
    if (type === 'water') {
        let total = 0;
        for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            total += data[dateStr] || 0;
        }
        return total;
    }
    
    if (type === 'food') {
        return data
            .filter(item => new Date(item.date) >= quarterAgo)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    return data
        .filter(item => new Date(item.date) >= quarterAgo)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getWeeklyAverage(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekData = data.filter(item => new Date(item.date) >= weekAgo);
    if (weekData.length === 0) return 0;
    
    const total = weekData.reduce((sum, item) => sum + (item.value || 0), 0);
    return total / weekData.length;
}

function getMonthlyAverage(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const monthData = data.filter(item => new Date(item.date) >= monthAgo);
    if (monthData.length === 0) return 0;
    
    const total = monthData.reduce((sum, item) => sum + (item.value || 0), 0);
    return total / monthData.length;
}

function getQuarterlyAverage(type) {
    if (!userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const quarterAgo = new Date();
    quarterAgo.setDate(quarterAgo.getDate() - 90);
    
    const quarterData = data.filter(item => new Date(item.date) >= quarterAgo);
    if (quarterData.length === 0) return 0;
    
    const total = quarterData.reduce((sum, item) => sum + (item.value || 0), 0);
    return total / quarterData.length;
}

function getLast7DaysEntries(data) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return data
        .filter(item => new Date(item.date) >= weekAgo)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Show last 10 entries
}

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

function showSuccessMessage(message) {
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Find current active content area and append
    const activeContent = document.querySelector('.content.active');
    if (activeContent) {
        activeContent.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize Google Auth
    initGoogleAuth();
    
    // Load saved data
    const savedUsers = localStorage.getItem('usersDatabase');
    if (savedUsers) {
        usersDatabase = JSON.parse(savedUsers);
    }
    
    const savedActivityData = localStorage.getItem('userActivityData');
    if (savedActivityData) {
        userActivityData = JSON.parse(savedActivityData);
    }
    
    // Check for existing user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.hasCompletedData) {
            goToDashboard();
        } else {
            goToInputData();
        }
    }
    
    console.log('Initialization complete');
});

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// Handle window resize for charts
window.addEventListener('resize', function() {
    setTimeout(() => {
        if (dailySummaryChart) dailySummaryChart.resize();
        if (activityTrendChart) activityTrendChart.resize();
        if (calorieBalanceChart) calorieBalanceChart.resize();
        if (activityDistributionChart) activityDistributionChart.resize();
        if (weeklyComparisonChart) weeklyComparisonChart.resize();
    }, 100);
});