// User authentication functionality
class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    // Sign up a new user
    signup(fullName, email, password) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Check if email already exists
        if (this.users.some(user => user.email === email)) {
            throw new Error('Email already registered');
        }

        // Validate password
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Create new user
        const user = {
            id: Date.now(),
            fullName,
            email,
            password: this.hashPassword(password), // In a real app, use proper password hashing
            createdAt: new Date().toISOString()
        };

        // Add user to storage
        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));

        // Log in the new user
        this.login(email, password);

        return user;
    }

    // Log in a user
    login(email, password, rememberMe = false) {
        const user = this.users.find(u => u.email === email && u.password === this.hashPassword(password));
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Store current user
        this.currentUser = user;
        if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }

        return user;
    }

    // Log out the current user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Simple password hashing (for demo purposes only)
    hashPassword(password) {
        return btoa(password); // In a real app, use proper password hashing
    }

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        
        if (password.length < minLength) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!hasNumber) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        if (!hasLetter) {
            return { valid: false, message: 'Password must contain at least one letter' };
        }
        
        return { valid: true, message: 'Password is valid' };
    }
}

// Create global auth instance
const auth = new Auth(); 