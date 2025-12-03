// ====================================
// CHART FUNCTIONS ONLY
// Variables sudah di-declare di index.js
// ====================================

/**
 * Initialize all charts
 * Call this function after user logs in and data is loaded
 */
function initializeCharts() {
    console.log('Initializing charts...');
    createDailySummaryChart();
    createActivityTrendChart();
    createCalorieBalanceChart();
    createActivityDistributionChart();
    createWeeklyComparisonChart();
}

/**
 * Daily Summary Chart - Doughnut Chart
 * Shows today's activity summary
 */
function createDailySummaryChart() {
    const canvas = document.getElementById('dailySummaryChart');
    if (!canvas) {
        console.warn('Daily Summary Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    const data = getDailySummaryData();
    
    // Destroy existing chart
    if (dailySummaryChart) {
        dailySummaryChart.destroy();
    }

    dailySummaryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Langkah (ribu)', 'Lari (km)', 'Air (L)', 'Tidur (jam)', 'Gym (menit)'],
            datasets: [{
                data: data,
                backgroundColor: [
                    '#22c55e',  // Green
                    '#3b82f6',  // Blue
                    '#06b6d4',  // Cyan
                    '#8b5cf6',  // Purple
                    '#f59e0b'   // Orange
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: ${value.toFixed(1)}`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            }
        }
    });
    
    console.log('Daily Summary Chart created');
}

/**
 * Activity Trend Chart - Line Chart
 * Shows 7-day trend of activities
 */
function createActivityTrendChart() {
    const canvas = document.getElementById('activityTrendChart');
    if (!canvas) {
        console.warn('Activity Trend Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
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
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Lari (km)',
                    data: data.running,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Air (L)',
                    data: data.water,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tanggal',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Nilai',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
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
    
    console.log('Activity Trend Chart created');
}

/**
 * Calorie Balance Chart - Bar Chart
 * Shows calories in vs calories out
 */
function createCalorieBalanceChart() {
    const canvas = document.getElementById('calorieBalanceChart');
    if (!canvas) {
        console.warn('Calorie Balance Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
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
                    borderWidth: 2,
                    borderRadius: 5
                },
                {
                    label: 'Kalori Keluar (estimasi)',
                    data: data.caloriesOut,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0 && context.dataIndex === data.labels.length - 1) {
                                const deficit = data.caloriesOut[context.dataIndex] - data.caloriesIn[context.dataIndex];
                                return `Defisit: ${deficit > 0 ? '+' : ''}${deficit.toFixed(0)} kal`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tanggal',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Kalori',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    console.log('Calorie Balance Chart created');
}

/**
 * Activity Distribution Chart - Polar Area Chart
 * Shows distribution of gym activities
 */
function createActivityDistributionChart() {
    const canvas = document.getElementById('activityDistributionChart');
    if (!canvas) {
        console.warn('Activity Distribution Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
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
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(6, 182, 212, 0.7)',
                    'rgba(236, 72, 153, 0.7)'
                ],
                borderColor: [
                    '#22c55e',
                    '#3b82f6',
                    '#a855f7',
                    '#f59e0b',
                    '#ef4444',
                    '#06b6d4',
                    '#ec4899'
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
                    labels: {
                        padding: 10,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.r;
                            return `${label}: ${value} sesi`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    console.log('Activity Distribution Chart created');
}

/**
 * Weekly Comparison Chart - Radar Chart
 * Compares this week vs last week
 */
function createWeeklyComparisonChart() {
    const canvas = document.getElementById('weeklyComparisonChart');
    if (!canvas) {
        console.warn('Weekly Comparison Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
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
                    pointHoverBorderColor: '#22c55e',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2
                },
                {
                    label: 'Minggu Lalu',
                    data: data.lastWeek,
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    pointBackgroundColor: '#6b7280',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#6b7280',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    console.log('Weekly Comparison Chart created');
}

// ====================================
// DATA RETRIEVAL FUNCTIONS FOR CHARTS
// ====================================

/**
 * Get daily summary data for doughnut chart
 * Returns array of [steps, running, water, sleep, gym]
 */
function getDailySummaryData() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return [0, 0, 0, 0, 0];
    }

    const todaySteps = getTodayTotal('steps') / 1000; // Convert to thousands
    const todayDistance = getTodayTotal('running');
    const todayWater = getTodayWaterTotal();
    const todaySleep = getLastSleep();
    const todayGym = getTodayGymTotal();

    console.log('Daily Summary:', { todaySteps, todayDistance, todayWater, todaySleep, todayGym });
    
    return [todaySteps, todayDistance, todayWater, todaySleep, todayGym];
}

/**
 * Get activity trend data for line chart
 * Returns object with labels, steps, running, water arrays
 */
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

    console.log('Activity Trend:', { labels, steps, running, water });
    
    return { labels, steps, running, water };
}

/**
 * Get calorie balance data for bar chart
 * Returns object with labels, caloriesIn, caloriesOut arrays
 */
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
            // Get food calories (calories in)
            const dayCaloriesIn = getDayFoodCalories(date);
            
            // Calculate burned calories (calories out) - estimation
            const daySteps = getDayTotal('steps', date);
            const dayRunning = getDayTotal('running', date);
            const dayGym = getDayGymTotal(date);
            
            // Estimation: 0.04 cal per step + 60 cal per km running + 5 cal per min gym
            const dayCaloriesOut = Math.round(
                daySteps * 0.04 + 
                dayRunning * 60 + 
                dayGym * 5
            );

            caloriesIn.push(dayCaloriesIn);
            caloriesOut.push(dayCaloriesOut);
        } else {
            caloriesIn.push(0);
            caloriesOut.push(0);
        }
    }

    console.log('Calorie Balance:', { labels, caloriesIn, caloriesOut });
    
    return { labels, caloriesIn, caloriesOut };
}

/**
 * Get activity distribution data for polar area chart
 * Returns object with labels and values arrays
 */
function getActivityDistributionData() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return { labels: ['Belum ada data'], values: [1] };
    }

    const userData = userActivityData[currentUser.email];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const categoryStats = {};
    
    // Collect gym activity categories
    if (userData.gym && userData.gym.length > 0) {
        userData.gym
            .filter(item => new Date(item.date) >= weekAgo)
            .forEach(item => {
                const category = item.category || item.type || 'General';
                categoryStats[category] = (categoryStats[category] || 0) + 1;
            });
    }

    // Convert to arrays
    const labels = Object.keys(categoryStats);
    const values = Object.values(categoryStats);

    if (labels.length === 0) {
        return { labels: ['Belum ada data'], values: [1] };
    }

    console.log('Activity Distribution:', { labels, values });
    
    return { labels, values };
}

/**
 * Get weekly comparison data for radar chart
 * Returns object with thisWeek and lastWeek arrays (normalized to 0-100)
 */
function getWeeklyComparisonData() {
    // Get data for this week
    const thisWeekSteps = getWeeklyTotal('steps') / 70000 * 100; // Target: 70k steps/week
    const thisWeekRunning = getWeeklyTotal('running') / 35 * 100; // Target: 35km/week
    const thisWeekWater = getWeeklyTotal('water') / 14 * 100; // Target: 14L/week
    const thisWeekSleep = getWeeklyAverage('sleep') / 8 * 100; // Target: 8h/day
    const thisWeekGym = getWeeklyGymTotal() / 300 * 100; // Target: 300min/week
    const thisWeekFood = getWeeklyFoodScore(); // Custom scoring

    // Get data for last week
    const lastWeekSteps = getLastWeekTotal('steps') / 70000 * 100;
    const lastWeekRunning = getLastWeekTotal('running') / 35 * 100;
    const lastWeekWater = getLastWeekTotal('water') / 14 * 100;
    const lastWeekSleep = getLastWeekAverage('sleep') / 8 * 100;
    const lastWeekGym = getLastWeekGymTotal() / 300 * 100;
    const lastWeekFood = getLastWeekFoodScore();

    const thisWeek = [
        Math.min(thisWeekSteps, 100),
        Math.min(thisWeekRunning, 100),
        Math.min(thisWeekWater, 100),
        Math.min(thisWeekSleep, 100),
        Math.min(thisWeekGym, 100),
        Math.min(thisWeekFood, 100)
    ];

    const lastWeek = [
        Math.min(lastWeekSteps, 100),
        Math.min(lastWeekRunning, 100),
        Math.min(lastWeekWater, 100),
        Math.min(lastWeekSleep, 100),
        Math.min(lastWeekGym, 100),
        Math.min(lastWeekFood, 100)
    ];

    console.log('Weekly Comparison:', { thisWeek, lastWeek });
    
    return { thisWeek, lastWeek };
}

// ====================================
// HELPER FUNCTIONS FOR DATA RETRIEVAL
// ====================================

function getTodayTotal(type) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const today = new Date().toDateString();
    
    if (type === 'food') {
        return data
            .filter(item => new Date(item.date).toDateString() === today)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    return data
        .filter(item => new Date(item.date).toDateString() === today)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getDayTotal(type, date) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const dayString = date.toDateString();
    
    return data
        .filter(item => new Date(item.date).toDateString() === dayString)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getTodayWaterTotal() {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return 0;
    }
    
    const today = new Date().toDateString();
    return userActivityData[currentUser.email].water?.[today] || 0;
}

function getDayWaterTotal(date) {
    if (!currentUser || !userActivityData[currentUser.email]) {
        return 0;
    }
    
    const dayString = date.toDateString();
    return userActivityData[currentUser.email].water?.[dayString] || 0;
}

function getTodayGymTotal() {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const today = new Date().toDateString();
    return userActivityData[currentUser.email].gym
        .filter(item => new Date(item.date).toDateString() === today)
        .reduce((sum, item) => sum + (item.duration || 0), 0);
}

function getDayGymTotal(date) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const dayString = date.toDateString();
    return userActivityData[currentUser.email].gym
        .filter(item => new Date(item.date).toDateString() === dayString)
        .reduce((sum, item) => sum + (item.duration || 0), 0);
}

function getDayFoodCalories(date) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].food) {
        return 0;
    }
    
    const dayString = date.toDateString();
    return userActivityData[currentUser.email].food
        .filter(item => new Date(item.date).toDateString() === dayString)
        .reduce((sum, item) => sum + (item.calories || 0), 0);
}

function getLastSleep() {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].sleep) {
        return 0;
    }
    
    const sleepData = userActivityData[currentUser.email].sleep;
    if (sleepData.length === 0) return 0;
    
    const lastSleep = sleepData[sleepData.length - 1];
    return lastSleep.value || 0;
}

function getWeeklyTotal(type) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    if (type === 'water') {
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
        return data
            .filter(item => new Date(item.date) >= weekAgo)
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    return data
        .filter(item => new Date(item.date) >= weekAgo)
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getWeeklyAverage(type) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
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

function getWeeklyGymTotal() {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return userActivityData[currentUser.email].gym
        .filter(item => new Date(item.date) >= weekAgo)
        .reduce((sum, item) => sum + (item.duration || 0), 0);
}

function getWeeklyFoodScore() {
    // Simplified food scoring based on calorie deficit
    const totalCaloriesIn = getWeeklyTotal('food');
    const totalCaloriesOut = getWeeklyTotal('steps') * 0.04 + getWeeklyTotal('running') * 60;
    const deficit = totalCaloriesOut - totalCaloriesIn;
    
    // Target: 3500 calorie deficit per week (0.5kg weight loss)
    return Math.min((deficit / 3500) * 100, 100);
}

function getLastWeekTotal(type) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (type === 'water') {
        let total = 0;
        for (let i = 7; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            total += data[dateStr] || 0;
        }
        return total;
    }
    
    if (type === 'food') {
        return data
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
            })
            .reduce((sum, item) => sum + (item.calories || 0), 0);
    }
    
    return data
        .filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
        })
        .reduce((sum, item) => sum + (item.value || 0), 0);
}

function getLastWeekAverage(type) {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email][type]) {
        return 0;
    }
    
    const data = userActivityData[currentUser.email][type];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const lastWeekData = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
    });
    
    if (lastWeekData.length === 0) return 0;
    
    const total = lastWeekData.reduce((sum, item) => sum + (item.value || 0), 0);
    return total / lastWeekData.length;
}

function getLastWeekGymTotal() {
    if (!currentUser || !userActivityData[currentUser.email] || !userActivityData[currentUser.email].gym) {
        return 0;
    }
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return userActivityData[currentUser.email].gym
        .filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
        })
        .reduce((sum, item) => sum + (item.duration || 0), 0);
}

function getLastWeekFoodScore() {
    const totalCaloriesIn = getLastWeekTotal('food');
    const totalCaloriesOut = getLastWeekTotal('steps') * 0.04 + getLastWeekTotal('running') * 60;
    const deficit = totalCaloriesOut - totalCaloriesIn;
    
    return Math.min((deficit / 3500) * 100, 100);
}

// ====================================
// REFRESH CHARTS FUNCTION
// ====================================

/**
 * Refresh all charts with latest data
 * Call this after user adds new activity
 */
function refreshAllCharts() {
    console.log('Refreshing all charts...');
    
    if (dailySummaryChart) {
        const data = getDailySummaryData();
        dailySummaryChart.data.datasets[0].data = data;
        dailySummaryChart.update();
    }
    
    if (activityTrendChart) {
        const data = getActivityTrendData();
        activityTrendChart.data.labels = data.labels;
        activityTrendChart.data.datasets[0].data = data.steps;
        activityTrendChart.data.datasets[1].data = data.running;
        activityTrendChart.data.datasets[2].data = data.water;
        activityTrendChart.update();
    }
    
    if (calorieBalanceChart) {
        const data = getCalorieBalanceData();
        calorieBalanceChart.data.labels = data.labels;
        calorieBalanceChart.data.datasets[0].data = data.caloriesIn;
        calorieBalanceChart.data.datasets[1].data = data.caloriesOut;
        calorieBalanceChart.update();
    }
    
    if (activityDistributionChart) {
        const data = getActivityDistributionData();
        activityDistributionChart.data.labels = data.labels;
        activityDistributionChart.data.datasets[0].data = data.values;
        activityDistributionChart.update();
    }
    
    if (weeklyComparisonChart) {
        const data = getWeeklyComparisonData();
        weeklyComparisonChart.data.datasets[0].data = data.thisWeek;
        weeklyComparisonChart.data.datasets[1].data = data.lastWeek;
        weeklyComparisonChart.update();
    }
    
    console.log('All charts refreshed');
}

// ====================================
// INITIALIZATION
// ====================================

/**
 * Initialize user activity data structure
 */
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

/**
 * Export functions to be used by your existing code
 */
window.initializeCharts = initializeCharts;
window.refreshAllCharts = refreshAllCharts;
window.createDailySummaryChart = createDailySummaryChart;
window.createActivityTrendChart = createActivityTrendChart;
window.createCalorieBalanceChart = createCalorieBalanceChart;
window.createActivityDistributionChart = createActivityDistributionChart;
window.createWeeklyComparisonChart = createWeeklyComparisonChart;

console.log('Chart functions loaded successfully');