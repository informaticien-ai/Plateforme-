// Vendor Registration Multi-Step Form
const vendorForm = document.getElementById('vendorRegisterForm');
let currentStep = 1;

if (vendorForm) {
    vendorForm.addEventListener('submit', handleVendorSubmit);
}

// Step Navigation
function nextStep() {
    if (validateStep(currentStep)) {
        updateSummary();
        currentStep++;
        updateStepDisplay();
    }
}

function prevStep() {
    currentStep--;
    updateStepDisplay();
}

function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');

    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active');
        if (stepNum <= currentStep) {
            step.classList.add('active');
        }
    });

    // Update buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
    }

    if (currentStep === 3) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'flex';
    } else {
        nextBtn.style.display = 'flex';
        submitBtn.style.display = 'none';
    }
}

// Validate current step
function validateStep(step) {
    const formStep = document.querySelector(`[data-step="${step}"]`);
    const inputs = formStep.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });

    // Additional email validation
    const emailInput = formStep.querySelector('input[type="email"]');
    if (emailInput && !validateEmail(emailInput.value)) {
        isValid = false;
        emailInput.style.borderColor = 'var(--danger-color)';
    }

    // Validate file upload if present
    const fileInput = formStep.querySelector('input[type="file"]');
    if (fileInput && fileInput.required && !fileInput.files.length) {
        isValid = false;
        fileInput.style.borderColor = 'var(--danger-color)';
    }

    return isValid;
}

// Update summary
function updateSummary() {
    if (currentStep === 2) {
        document.getElementById('summaryShopName').textContent = document.getElementById('shopName').value || '-';
        document.getElementById('summaryOwner').textContent = 
            document.getElementById('vendorFirstName').value + ' ' + 
            document.getElementById('vendorLastName').value;
        document.getElementById('summaryEmail').textContent = document.getElementById('vendorEmail').value || '-';
        document.getElementById('summaryPhone').textContent = document.getElementById('vendorPhone').value || '-';
    }
}

// Handle vendor form submission
async function handleVendorSubmit(e) {
    e.preventDefault();

    if (!validateStep(3)) {
        alert('Veuillez accepter les conditions');
        return;
    }

    // Collect form data
    const formData = new FormData(vendorForm);
    const data = {
        // Step 1
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        idType: formData.get('idType'),
        idNumber: formData.get('idNumber'),
        address: formData.get('address'),
        
        // Step 2
        shopName: formData.get('shopName'),
        shopDescription: formData.get('shopDescription'),
        shopCategory: formData.get('shopCategory'),
        bankName: formData.get('bankName'),
        accountNumber: formData.get('accountNumber'),
        
        // Step 3
        paymentMethod: formData.get('paymentMethod'),
        acceptTerms: formData.get('acceptTerms')
    };

    try {
        const response = await apiCall('/vendors/register', 'POST', data);
        
        // Redirect to payment page
        window.location.href = `./payment.html?vendorId=${response.vendorId}`;
    } catch (error) {
        showError('vendorError', 'Une erreur est survenue lors de l\'inscription');
    }
}

// File upload preview
const shopLogoInput = document.getElementById('shopLogo');
if (shopLogoInput) {
    shopLogoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux (max 5MB)');
                this.value = '';
                return;
            }
        }
    });
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}
