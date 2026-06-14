// Dashboard Client Initialization
if (checkAuth()) {
    const user = getCurrentUser();
    document.getElementById('userName').textContent = user.firstName || 'Client';
    initDashboard();
} else {
    window.location.href = './login.html';
}

function initDashboard() {
    setupMenuNavigation();
    loadVendors();
    loadProducts();
    loadOrders();
}

// Menu Navigation
function setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href').substring(1);
            
            // Remove active class from all items and sections
            menuItems.forEach(m => m.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            // Add active class
            item.classList.add('active');
            document.getElementById(href).classList.add('active');
        });
    });
}

// Load Vendors
async function loadVendors() {
    try {
        const response = await apiCall('/vendors/featured', 'GET');
        const vendorsGrid = document.getElementById('vendorsGrid');
        
        vendorsGrid.innerHTML = response.vendors.map(vendor => `
            <div class="vendor-card" onclick="goToVendor('${vendor.id}')">
                <div class="vendor-image">
                    <img src="${vendor.image}" alt="${vendor.name}" />
                </div>
                <div class="vendor-info">
                    <h3>${vendor.name}</h3>
                    <p class="vendor-category">${vendor.category}</p>
                    <div class="vendor-rating">
                        <span class="stars">★★★★★</span>
                        <span>${vendor.rating}</span>
                    </div>
                    <p class="vendor-products">${vendor.productCount} produits</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading vendors:', error);
    }
}

// Load Products
async function loadProducts() {
    try {
        const response = await apiCall('/products/featured', 'GET');
        const productsGrid = document.getElementById('productsGrid');
        const allProductsGrid = document.getElementById('allProductsGrid');
        
        const productHTML = response.products.map(product => `
            <div class="product-card" onclick="showProductModal('${product.id}')">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" />
                    <div class="product-badge">${product.discount}% OFF</div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${product.price.toLocaleString()} CFA</div>
                    <div class="product-rating">
                        <div class="stars">★★★★★</div>
                        <span>${product.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        productsGrid.innerHTML = productHTML;
        allProductsGrid.innerHTML = productHTML;
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load Orders
async function loadOrders() {
    try {
        const response = await apiCall('/orders/my-orders', 'GET');
        const ordersList = document.getElementById('ordersList');
        
        ordersList.innerHTML = response.orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">Commande #${order.id}</span>
                    <span class="order-date">${new Date(order.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="order-details">
                    <span class="order-vendor">Chez ${order.vendor}</span>
                    <span class="order-total">${order.total.toLocaleString()} CFA</span>
                </div>
                <div class="order-status">
                    <span class="order-status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Show Product Modal
function showProductModal(productId) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    // Fetch product details
    apiCall(`/products/${productId}`, 'GET').then(product => {
        modalBody.innerHTML = `
            <div class="product-modal-content">
                <img src="${product.image}" alt="${product.name}" class="modal-product-image" />
                <h2>${product.name}</h2>
                <div class="modal-product-rating">
                    <span class="stars">★★★★★</span>
                    <span>${product.rating}</span>
                </div>
                <div class="modal-product-price">${product.price.toLocaleString()} CFA</div>
                <p class="modal-product-description">${product.description}</p>
                <div class="modal-product-vendor">
                    <strong>Vendu par:</strong> ${product.vendor}
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="addToCart('${productId}')">Ajouter au Panier</button>
                    <button class="btn-secondary" onclick="addToFavorites('${productId}')">Ajouter aux Favoris</button>
                </div>
            </div>
        `;
        modal.classList.add('show');
    });
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

function addToCart(productId) {
    // TODO: Implement cart functionality
    alert('Produit ajouté au panier!');
    closeProductModal();
}

function addToFavorites(productId) {
    // TODO: Implement favorites functionality
    alert('Produit ajouté aux favoris!');
}

function goToVendor(vendorId) {
    // TODO: Navigate to vendor page
    console.log('Go to vendor:', vendorId);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        modal.classList.remove('show');
    }
};
