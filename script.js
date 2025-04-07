// Store user data
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('signup.html')) {
        window.location.href = 'index.html';
    }
    return user ? JSON.parse(user) : null;
}

// Initialize user session
function initSession() {
    currentUser = checkAuth();
}

// Handle login form submission
// Initialize login form and password toggle if they exist
const loginForm = document.getElementById('loginForm');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('loginPassword');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('.material-icons').textContent = type === 'password' ? 'visibility' : 'visibility_off';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = user.channelId ? 'dashboard.html' : 'pairing.html';
            } else {
                alert('Invalid email or password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    });
}

// Handle signup form submission
document.getElementById('signupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        alert('Email already registered');
        return;
    }
    
    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set current user and redirect to pairing page
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    alert('Registration successful! Please pair your device.');
    window.location.href = 'pairing.html';
});

// Handle settings form and real-time updates
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    // Initialize form with user data
    initSession();
    if (currentUser) {
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('email').value = currentUser.email || '';
        document.getElementById('channelId').value = currentUser.channelId || '';
        document.getElementById('apiKey').value = currentUser.apiKey || '';
        
        // Update display elements
        document.getElementById('userName').textContent = currentUser.name || '';
        document.getElementById('userEmail').textContent = currentUser.email || '';
    }

    // Real-time updates for name and email
    document.getElementById('name').addEventListener('input', function(e) {
        const newName = e.target.value;
        document.getElementById('userName').textContent = newName;
        updateUserData({ name: newName });
    });

    document.getElementById('email').addEventListener('input', function(e) {
        const newEmail = e.target.value;
        document.getElementById('userEmail').textContent = newEmail;
        updateUserData({ email: newEmail });
    });

    // Handle form submission for password and ThingSpeak settings
    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const channelId = document.getElementById('channelId').value;
        const apiKey = document.getElementById('apiKey').value;

        if (currentPassword && newPassword) {
            if (currentPassword !== currentUser.password) {
                alert('Current password is incorrect');
                return;
            }
            updateUserData({ password: newPassword });
        }

        if (channelId && apiKey) {
            if (!/^\d+$/.test(channelId)) {
                alert('Channel ID must contain only numbers');
                return;
            }
            if (!/^[A-Za-z0-9]+$/.test(apiKey)) {
                alert('API Key must be alphanumeric');
                return;
            }
            updateUserData({ channelId, apiKey });
        }

        alert('Settings updated successfully!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    });
}

// Function to update user data in real-time
function updateUserData(updates) {
    if (!currentUser) return;
    
    // Update current user object
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Handle pairing form submission
document.getElementById('pairingForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const channelId = document.getElementById('channelId').value;
    const apiKey = document.getElementById('apiKey').value;
    
    // Validate channel ID (numbers only)
    if (!/^\d+$/.test(channelId)) {
        alert('Channel ID must contain only numbers');
        return;
    }
    
    // Validate API Key (alphanumeric)
    if (!/^[A-Za-z0-9]+$/.test(apiKey)) {
        alert('API Key must be alphanumeric');
        return;
    }
    
    // Store pairing information
    currentUser = checkAuth();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser.channelId = channelId;
    currentUser.apiKey = apiKey;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
});

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// Update dashboard profile if on dashboard page
// Initialize map and ThingSpeak integration for dashboard
if (window.location.pathname.includes('dashboard.html')) {
    currentUser = checkAuth();
    if (currentUser) {
        // Initialize any dashboard-specific functionality here
    }
}

    



// Initialize session when page loads
initSession();

// Handle settings form if on settings page
if (window.location.pathname.includes('settings.html')) {
    currentUser = checkAuth();
    if (currentUser) {
        // Populate user data
        document.getElementById('name').value = currentUser.name;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('channelId').value = currentUser.channelId || '';
        document.getElementById('apiKey').value = currentUser.apiKey || '';

        // Handle settings form submission
        document.getElementById('settingsForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const updateMessage = document.getElementById('updateMessage');
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const channelId = document.getElementById('channelId').value;
            const apiKey = document.getElementById('apiKey').value;
        
            // Update user data in localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            currentUser.name = name;
            currentUser.email = email;
            currentUser.channelId = channelId;
            currentUser.apiKey = apiKey;
            if (newPassword) {
                currentUser.password = newPassword;
            }
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
            // Update display
            document.getElementById('userName').textContent = name;
            document.getElementById('userEmail').textContent = email;
        
            // Show success message
            updateMessage.textContent = 'Settings updated successfully!';
            updateMessage.style.display = 'block';
            updateMessage.style.backgroundColor = '#4CAF50';
            updateMessage.style.color = 'white';
            updateMessage.style.padding = '10px';
            updateMessage.style.borderRadius = '4px';
            updateMessage.style.marginBottom = '15px';
        
            // Hide message after 3 seconds
            setTimeout(() => {
                updateMessage.style.display = 'none';
            }, 3000);
        });
    }
}
