// Dashboard Vendor Initialization
if (checkAuth()) {
    const user = getCurrentUser();
    if (user.type !== 'vendor') {
        window.location.href = './dashboard-client.html';
    }
    initVendorDashboard();
} else {
    window.location.href = './login.html';
}

function initVendorDashboard() {
    loadShopInfo();
    setupMenuNavigation();
    loadDashboardData();
    setupProductForm();
}

// Load Shop Information
async function loadShopInfo() {
    try {
        const response = await apiCall('/vendors/me', 'GET');
        document.getElementById('shopName').textContent = response.shop.name;
        document.getElementById('shopRating').textContent = `⭐ ${response.shop.rating} (${response.shop.reviews} avis)`;
    } catch (error) {
        console.error('Error loading shop info:', error);
    }
}

// Menu Navigation
function setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href').substring(1);
            
            menuItems.forEach(m => m.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(href).classList.add('active');
        });
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const dashResponse = await apiCall('/vendors/dashboard', 'GET');
        const ordersResponse = await apiCall('/vendors/orders/recent', 'GET');
        
        // Populate recent orders
        const ordersBody = document.getElementById('recentOrdersBody');
        ordersBody.innerHTML = ordersResponse.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.clientName}</td>
                <td>${order.productName}</td>
                <td>${order.amount.toLocaleString()} CFA</td>
                <td><span class="order-status status-${order.status}">${order.status}</span></td>
                <td>
                    <button class="btn-small" onclick="viewOrder('${order.id}')">Voir</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load Products
async function loadVendorProducts() {
    try {
        const response = await apiCall('/vendors/products', 'GET');
        const productsList = document.getElementById('productsList');
        
        productsList.innerHTML = response.products.map(product => `
            <div class="product-item-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" />
                </div>
                <div class="product-actions">
                    <button class="product-action-btn" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                    <button class="product-action-btn" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="product-price">${product.price.toLocaleString()} CFA</p>
                    <p class="product-stock">Stock: ${product.stock}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Show Add Product Modal
function showAddProduct() {
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    document.getElementById('addProductForm').reset();
}

// Setup Product Form
function setupProductForm() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.addEventListener('submit', handleAddProduct);
    }
}

// Handle Add Product
async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
    };

    try {
        await apiCall('/vendors/products', 'POST', data);
        closeProductModal();
        loadVendorProducts();
        alert('Produit ajouté avec succès!');
    } catch (error) {
        alert('Erreur lors de l\'ajout du produit');
    }
}

// Load Orders
async function loadVendorOrders() {
    try {
        const response = await apiCall('/vendors/orders', 'GET');
        const ordersBody = document.getElementById('allOrdersBody');
        
        ordersBody.innerHTML = response.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.clientName}</td>
                <td>${order.productCount} produit(s)</td>
                <td>${order.total.toLocaleString()} CFA</td>
                <td><span class="order-status status-${order.status}">${order.status}</span></td>
                <td>${new Date(order.date).toLocaleDateString('fr-FR')}</td>
                <td>
                    <button class="btn-small" onclick="viewOrder('${order.id}')">Voir</button>
                    <button class="btn-small" onclick="updateOrderStatus('${order.id}')">Mettre à jour</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load Messages
async function loadMessages() {
    try {
        const response = await apiCall('/vendors/messages', 'GET');
        const messagesContainer = document.getElementById('messagesContainer');
        
        messagesContainer.innerHTML = response.messages.map(message => `
            <div class="message-item">
                <div class="message-avatar">
                    <img src="${message.avatar}" alt="${message.senderName}" />
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-name">${message.senderName}</span>
                        <span class="message-time">${new Date(message.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p class="message-text">${message.content}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Load Payouts
async function loadPayouts() {
    try {
        const response = await apiCall('/vendors/payouts', 'GET');
        const payoutsBody = document.getElementById('payoutsBody');
        
        payoutsBody.innerHTML = response.payouts.map(payout => `
            <tr>
                <td>${new Date(payout.date).toLocaleDateString('fr-FR')}</td>
                <td>${payout.amount.toLocaleString()} CFA</td>
                <td><span class="status-${payout.status}">${payout.status}</span></td>
                <td>${payout.reference}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading payouts:', error);
    }
}

// Edit Product
function editProduct(productId) {
    // TODO: Implement edit product
    console.log('Edit product:', productId);
}

// Delete Product
async function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        try {
            await apiCall(`/vendors/products/${productId}`, 'DELETE');
            loadVendorProducts();
            alert('Produit supprimé!');
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    }
}

// View Order
function viewOrder(orderId) {
    console.log('View order:', orderId);
}

// Update Order Status
function updateOrderStatus(orderId) {
    console.log('Update order status:', orderId);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        modal.classList.remove('show');
    }
};
