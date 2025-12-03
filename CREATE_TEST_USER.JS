// ====================================
// PASTE SCRIPT INI DI BROWSER CONSOLE
// Tekan F12 → Console → Paste → Enter
// ====================================

console.log('🚀 Creating test user...');

// Create test user with complete data
const testUser = {
    id: 'test-' + Date.now(),
    name: 'Test User',
    email: 'test@example.com',
    password: '123456',
    hasCompletedData: true,
    
    // Personal Data
    namaLengkap: 'Test User',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1990-01-01',
    golonganDarah: 'O',
    jenisKelamin: 'laki-laki',
    
    // Health Data
    tinggiBadan: '170',
    beratBadan: '70',
    nomorWA: '081234567890',
    
    // Additional
    isGoogleUser: false
};

// Get existing users from localStorage
let users = JSON.parse(localStorage.getItem('usersDatabase') || '[]');

// Check if test user already exists
const existingUser = users.find(u => u.email === 'test@example.com');

if (existingUser) {
    console.log('ℹ️ Test user already exists');
    console.log('📊 Updating existing user...');
    
    // Update existing user
    const index = users.findIndex(u => u.email === 'test@example.com');
    users[index] = testUser;
} else {
    console.log('✅ Creating new test user...');
    users.push(testUser);
}

// Save to localStorage
localStorage.setItem('usersDatabase', JSON.stringify(users));

console.log('✅ Test user ready!');
console.log('');
console.log('═══════════════════════════════');
console.log('📧 Email: test@example.com');
console.log('🔑 Password: 123456');
console.log('═══════════════════════════════');
console.log('');
console.log('👉 You can now login!');

// Show all registered users
console.log('');
console.log('📝 All registered users:');
users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (hasCompletedData: ${u.hasCompletedData})`);
});