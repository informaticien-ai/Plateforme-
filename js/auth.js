// Auth Form Handlers
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // Validation
    if (!validateEmail(email)) {
        showError('emailError', 'Email invalide');
        return;
    }

    if (password.length < 6) {
        showError('passwordError', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        const response = await apiCall('/auth/login', 'POST', {
            email,
            password,
            remember
        });

        // Save token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Redirect based on user type
        if (response.user.type === 'vendor') {
            window.location.href = './dashboard-vendor.html';
        } else {
            window.location.href = './dashboard-client.html';
        }
    } catch (error) {
        showError('loginError', 'Email ou mot de passe incorrect');
    }
}

// Signup Handler
async function handleSignup(e) {
    e.preventDefault();
    clearErrors();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Validations
    let hasError = false;

    if (!firstName) {
        showError('firstNameError', 'Le prénom est requis');
        hasError = true;
    }

    if (!lastName) {
        showError('lastNameError', 'Le nom est requis');
        hasError = true;
    }

    if (!validateEmail(email)) {
        showError('signupEmailError', 'Email invalide');
        hasError = true;
    }

    if (!phone) {
        showError('phoneError', 'Le téléphone est requis');
        hasError = true;
    }

    if (password.length < 8) {
        showError('signupPasswordError', 'Le mot de passe doit contenir au moins 8 caractères');
        hasError = true;
    }

    if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Les mots de passe ne correspondent pas');
        hasError = true;
    }

    if (!terms) {
        showError('termsError', 'Vous devez accepter les conditions');
        hasError = true;
    }

    if (hasError) return;

    try {
        const response = await apiCall('/auth/signup', 'POST', {
            firstName,
            lastName,
            email,
            phone,
            password,
            userType: 'client'
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        window.location.href = './dashboard-client.html';
    } catch (error) {
        showError('signupError', 'Une erreur est survenue lors de l\'inscription');
    }
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = event.target.closest('.toggle-password');
    const icon = button.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Password strength meter
const passwordInput = document.getElementById('signupPassword');
if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
}

function updatePasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    let strength = 0;
    const regex = {
        lowercase: /[a-z]/,
        uppercase: /[A-Z]/,
        number: /[0-9]/,
        special: /[^A-Za-z0-9]/
    };

    if (regex.lowercase.test(password)) strength++;
    if (regex.uppercase.test(password)) strength++;
    if (regex.number.test(password)) strength++;
    if (regex.special.test(password)) strength++;

    if (password.length >= 8) strength++;

    const strengthLevel = (strength / 5) * 100;
    strengthFill.style.width = strengthLevel + '%';

    let strengthLabel = 'Faible';
    let strengthColor = 'var(--danger-color)';

    if (strengthLevel >= 60) {
        strengthLabel = 'Moyen';
        strengthColor = var(--secondary-color)';
    }
    if (strengthLevel >= 80) {
        strengthLabel = 'Fort';
        strengthColor = 'var(--success-color)';
    }
    if (strengthLevel === 100) {
        strengthLabel = 'Très fort';
        strengthColor = 'var(--success-color)';
    }

    strengthText.textContent = strengthLabel;
    strengthFill.style.backgroundColor = strengthColor;
}

// Error handling
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
}

// Redirect functions
function goToLogin() {
    window.location.href = './pages/login.html';
}

function goToSignup() {
    window.location.href = './pages/signup.html';
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
