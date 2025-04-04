// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const heroSignupBtn = document.getElementById('heroSignupBtn');
const authModal = document.getElementById('authModal');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const journalText = document.getElementById('journalText');
const recentEntries = document.getElementById('recentEntries');
const authButtons = document.querySelector('.auth-buttons');

// State Management
let currentUser = null;
let journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
let drafts = JSON.parse(localStorage.getItem('drafts')) || {};

// Google Sign-In Configuration
const googleClientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual Google Client ID
let googleAuth;

// Authentication Modal
function showModal(formType) {
    authModal.style.display = 'flex';
    if (formType === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Clear form fields
    loginForm.querySelector('form').reset();
    signupForm.querySelector('form').reset();
}

// Event Listeners for Modal
function attachLoginListener() {
    const loginButton = document.getElementById('loginBtn');
    if (loginButton) {
        loginButton.addEventListener('click', () => showModal('login'));
    }
}

// Initial attachment of login listener
attachLoginListener();

// Show Signup Form
function showSignupForm() {
    showModal('signup');
}

signupBtn.addEventListener('click', showSignupForm);
heroSignupBtn.addEventListener('click', showSignupForm);

// Close Modal
closeBtn.addEventListener('click', hideModal);

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        hideModal();
    }
});

// Form Submission
loginForm.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.elements[0].value.trim();
    const password = e.target.elements[1].value;
    const rememberMe = e.target.elements[2].checked;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Get the user's name from localStorage if it exists
    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUser = { 
        email,
        name: savedUser ? savedUser.name : email.split('@')[0] // Use email username if no name found
    };

    if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    hideModal();
    updateUIForLoggedInUser();
    showNotification('Welcome back!', 'success');
});

// Update the existing sign-up form submission
signupForm.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.elements[0].value.trim();
    const email = e.target.elements[1].value.trim();
    const password = e.target.elements[2].value;
    const confirmPassword = e.target.elements[3].value;

    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        // Store user with full name
        currentUser = { 
            name: name,
            email: email 
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Send welcome email
        await sendWelcomeEmail(email, name);

        hideModal();
        updateUIForLoggedInUser();
        showNotification('Account created successfully! Check your email for confirmation.', 'success');
    } catch (error) {
        console.error('Error during signup:', error);
        showNotification('Failed to create account. Please try again.', 'error');
    }
});

// Validation Helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Journal Functionality
function saveJournalEntry() {
    if (!currentUser) {
        showNotification('Please log in to save journal entries', 'error');
        showModal('login');
        return;
    }

    const text = journalText.value.trim();
    if (!text) {
        showNotification('Please write something before saving', 'error');
        return;
    }

    try {
        const entry = {
            id: Date.now(),
            text: text,
            date: new Date().toISOString(),
            userId: currentUser.email
        };

        journalEntries.unshift(entry);
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));

        journalText.value = '';
        updateRecentEntries();
        showNotification('Journal entry saved successfully!', 'success');

        // Clear draft after successful save
        delete drafts[currentUser.email];
        localStorage.setItem('drafts', JSON.stringify(drafts));
    } catch (error) {
        console.error('Error saving journal entry:', error);
        showNotification('Failed to save journal entry. Please try again.', 'error');
    }
}

function saveAsDraft() {
    if (!currentUser) {
        showNotification('Please log in to save drafts', 'error');
        showModal('login');
        return;
    }

    const text = journalText.value.trim();
    if (!text) {
        showNotification('Please write something before saving as draft', 'error');
        return;
    }

    try {
        drafts[currentUser.email] = {
            text: text,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('drafts', JSON.stringify(drafts));
        showNotification('Draft saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Failed to save draft. Please try again.', 'error');
    }
}

function loadDraft() {
    if (currentUser && drafts[currentUser.email]) {
        const draft = drafts[currentUser.email];
        journalText.value = draft.text;
        showNotification('Draft loaded successfully', 'info');
    }
}

function updateRecentEntries() {
    if (!currentUser) return;

    try {
        const userEntries = journalEntries.filter(entry => entry.userId === currentUser.email);
        if (userEntries.length === 0) {
            recentEntries.innerHTML = '<p class="no-entries">No journal entries yet. Start writing!</p>';
            return;
        }

        recentEntries.innerHTML = userEntries.slice(0, 5).map(entry => `
            <div class="entry-item">
                <div class="entry-content">
                    <p>${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}</p>
                    <small>${new Date(entry.date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating recent entries:', error);
        recentEntries.innerHTML = '<p class="error">Error loading recent entries</p>';
    }
}

// UI Updates
function updateUIForLoggedInUser() {
    const displayName = currentUser.name ? currentUser.name.split(' ')[0] : currentUser.email;
    authButtons.innerHTML = `
        <span>Welcome, ${displayName}</span>
        <button class="btn" onclick="logout()">Logout</button>
    `;

    document.querySelectorAll('.user-specific').forEach(el => {
        el.style.display = 'block';
    });

    loadDraft();
    updateRecentEntries();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');

    authButtons.innerHTML = `
        <button id="loginBtn" class="btn">Login</button>
        <button id="signupBtn" class="btn btn-primary">Sign Up</button>
    `;

    document.querySelectorAll('.user-specific').forEach(el => {
        el.style.display = 'none';
    });

    // Clear journal textarea
    journalText.value = '';

    // Reattach login button listener
    attachLoginListener();

    showNotification('Logged out successfully', 'success');
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Workshop Registration
document.querySelectorAll('.workshop-card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Please log in to register for workshops', 'error');
            return;
        }
        showNotification('Registration successful! You will receive an email confirmation.', 'success');
    });
});

// Learn More Modal
const learnMoreBtn = document.querySelector('.hero-buttons .btn:last-child');
const learnMoreModal = document.getElementById('learnMoreModal');
const learnMoreCloseBtn = learnMoreModal.querySelector('.close');

learnMoreBtn.addEventListener('click', () => {
    learnMoreModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
});

learnMoreCloseBtn.addEventListener('click', () => {
    learnMoreModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

learnMoreModal.addEventListener('click', (e) => {
    if (e.target === learnMoreModal) {
        learnMoreModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSignIn
    });
}

// Handle Google Sign-In
async function signInWithGoogle() {
    try {
        google.accounts.id.prompt();
    } catch (error) {
        console.error('Error with Google Sign-In:', error);
        showNotification('Failed to sign in with Google. Please try again.', 'error');
    }
}

// Handle Google Sign-In Response
async function handleGoogleSignIn(response) {
    try {
        const { credential } = response;
        const result = await decodeJwtResponse(credential);

        currentUser = {
            name: result.name,
            email: result.email,
            picture: result.picture
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        hideModal();
        updateUIForLoggedInUser();
        showNotification('Successfully signed in with Google!', 'success');

        // Send welcome email for new users
        if (!localStorage.getItem(`welcomed_${result.email}`)) {
            await sendWelcomeEmail(result.email, result.name);
            localStorage.setItem(`welcomed_${result.email}`, 'true');
        }
    } catch (error) {
        console.error('Error handling Google sign-in:', error);
        showNotification('Failed to complete sign-in. Please try again.', 'error');
    }
}

// Decode JWT Token from Google
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Send Welcome Email
async function sendWelcomeEmail(email, name) {
    try {
        // Here you would typically make an API call to your backend
        // For demonstration, we'll just show a notification
        showNotification('Welcome email sent successfully!', 'success');
    } catch (error) {
        console.error('Error sending welcome email:', error);
        showNotification('Could not send welcome email', 'error');
    }
}

// Initialize the application
function init() {
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        localStorage.removeItem('currentUser');
    }
}

// Add event listeners for journal buttons
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.querySelector('.journal-actions .btn:last-child');
    const draftButton = document.querySelector('.journal-actions .btn:first-child');

    if (saveButton) {
        saveButton.addEventListener('click', saveJournalEntry);
    }

    if (draftButton) {
        draftButton.addEventListener('click', saveAsDraft);
    }

    initializeGoogleSignIn();
});

// Start the application
init();
