// Dashboard Logic - API Connected
// Auto-detect API URL: works locally and on Render
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

// If opened as a file, redirect to the server immediately
if (location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f4f8;">
                <div style="background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
                    <div style="font-size:3rem;margin-bottom:16px;">🧺</div>
                    <h2 style="color:#1a1a2e;margin:0 0 8px;">Open via Server</h2>
                    <p style="color:#666;margin:0 0 24px;">You opened this file directly. CleanEase needs to run through the server.</p>
                    <a href="http://127.0.0.1:5000/customer-login.html"
                       style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#00bcd4);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;">
                        → Open CleanEase
                    </a>
                    <p style="color:#999;font-size:0.8rem;margin-top:16px;">Make sure <code>python start.py</code> is running first</p>
                </div>
            </div>`;
    });
}

let currentUser = null;
let clothTypes = [];
let customers = [];
let orders = [];
let notifications = [];
let currentBillOrder = null;

// ── API helper ──
async function api(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(API + path, opts);
        if (!res.ok) {
            const text = await res.text();
            console.error(`API ${method} ${path} failed (${res.status}):`, text);
            try { return JSON.parse(text); } catch { return { success: false, message: `Server error (${res.status})` }; }
        }
        return res.json();
    } catch (err) {
        console.error(`API ${method} ${path} network error:`, err);
        return { success: false, message: 'Cannot connect to server. Is it running?' };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeDashboard();
});

function checkAuth() {
    const user = sessionStorage.getItem('user');
    if (!user) { window.location.href = 'customer-login.html'; return; }
    currentUser = JSON.parse(user);
    document.getElementById('userName').textContent = currentUser.name;
    const roleEl = document.getElementById('userRole');
    roleEl.textContent = currentUser.role.toUpperCase();
    roleEl.className = 'user-role ' + currentUser.role;
    const avatarEl = document.getElementById('userAvatar');
    avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    avatarEl.className = 'user-avatar ' + currentUser.role;
}

function initializeDashboard() {
    setupNavigation();
    showRoleBasedContent();
    loadDashboardData();
    setupForms();
    setupWelcomeBanner();
    if (currentUser.role === 'customer') {
        prefillCustomerInfo();
        setTimeout(checkNotifications, 1000);
    }
}

function setupWelcomeBanner() {
    const heading = document.getElementById('welcomeHeading');
    const subtext = document.getElementById('welcomeSubtext');
    const btn     = document.getElementById('welcomeActionBtn');
    if (!heading) return;

    const hour = new Date().getHours();
    const greet = hour < 12 ? '☀️ Good morning' : hour < 17 ? '👋 Good afternoon' : '🌙 Good evening';

    if (currentUser.role === 'admin') {
        heading.textContent = `${greet}, ${currentUser.name}!`;
        subtext.textContent = "Here's your business overview for today.";
        btn.textContent = '📊 View Orders';
        btn.onclick = () => {
            const navEl = document.querySelector('.nav-item[onclick*="manageOrders"]');
            showSection('manageOrders', navEl, 'Manage Orders', 'View and update all customer orders');
        };
    } else {
        heading.textContent = `${greet}, ${currentUser.name}!`;
        subtext.textContent = 'Ready for fresh laundry? Place a new order in seconds.';
        btn.textContent = '➕ New Order';
        btn.onclick = () => {
            const navEl = document.querySelector('.nav-item[onclick*="newOrder"]');
            showSection('newOrder', navEl, 'New Order', 'Create a new laundry order');
        };
    }
}

function handleWelcomeAction() {
    // fallback — actual handler set in setupWelcomeBanner
    if (currentUser.role === 'customer') {
        const navEl = document.querySelector('.nav-item[onclick*="newOrder"]');
        showSection('newOrder', navEl, 'New Order', 'Create a new laundry order');
    }
}

function setupNavigation() {
    const nav = document.getElementById('mainNav');
    if (currentUser.role === 'admin') {
        nav.innerHTML = `
            <div class="nav-section-title">Main</div>
            <div class="nav-item active" onclick="showSection('overview',this,'Dashboard','Overview of your business')"><span class="nav-icon">📊</span> Dashboard</div>
            <div class="nav-section-title">Management</div>
            <div class="nav-item" onclick="showSection('clothTypes',this,'Cloth Types','Manage cloth types and pricing')"><span class="nav-icon">👕</span> Cloth Types</div>
            <div class="nav-item" onclick="showSection('manageOrders',this,'Orders','View and manage all orders')"><span class="nav-icon">📋</span> Orders</div>
            <div class="nav-item" onclick="showSection('adminNotifications',this,'Notifications','Send messages to customers')"><span class="nav-icon">🔔</span> Notifications</div>
            <div class="nav-section-title">Reports</div>
            <div class="nav-item" onclick="showSection('income',this,'Daily Income','Track daily revenue')"><span class="nav-icon">💰</span> Daily Income</div>
            <div class="nav-item" onclick="showSection('customers',this,'Customers','Manage customer database')"><span class="nav-icon">👥</span> Customers</div>`;
    } else {
        nav.innerHTML = `
            <div class="nav-section-title">Main</div>
            <div class="nav-item active" onclick="showSection('overview',this,'Dashboard','Welcome back, ${currentUser.name}')"><span class="nav-icon">🏠</span> Dashboard</div>
            <div class="nav-section-title">Orders</div>
            <div class="nav-item" onclick="showSection('newOrder',this,'New Order','Create a new laundry order')"><span class="nav-icon">➕</span> New Order</div>
            <div class="nav-item" onclick="showSection('orderHistory',this,'Order History','View all your orders')"><span class="nav-icon">📋</span> Order History</div>
            <div class="nav-section-title">Account</div>
            <div class="nav-item" onclick="showSection('profile',this,'My Profile','Update your personal details')"><span class="nav-icon">👤</span> My Profile</div>
            <div class="nav-item" onclick="showSection('notifications',this,'Notifications','Messages from admin')"><span class="nav-icon">🔔</span> Notifications</div>`;
    }
}

function showRoleBasedContent() {
    // Just add a role class to the body — CSS handles visibility.
    // Sections are shown/hidden exclusively via the .active class in showSection().
    document.body.classList.add('role-' + currentUser.role);
}

async function loadDashboardData() {
    try {
        if (currentUser.role === 'admin') {
            orders        = await api('/orders');
            clothTypes    = await api('/cloth-types');
            customers     = await api('/customers');
            notifications = await api('/notifications');

            const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
            document.getElementById('stat1Title').textContent = 'Total Orders';
            document.getElementById('stat1Value').textContent = orders.length;
            document.getElementById('stat2Title').textContent = 'In Progress';
            document.getElementById('stat2Value').textContent = orders.filter(o => ['Order Placed','Picked Up','Being Washed','Ready'].includes(o.status)).length;
            document.getElementById('stat3Title').textContent = 'Delivered';
            document.getElementById('stat3Value').textContent = orders.filter(o => o.status === 'Delivered').length;
            document.getElementById('stat4Title').textContent = 'Revenue';
            document.getElementById('stat4Value').textContent = '₹' + totalRevenue.toFixed(2);

            // Overview recent orders
            const extra = document.getElementById('overviewExtra');
            if (extra) {
                const recent = orders.slice(0, 5);
                extra.innerHTML = recent.length ? `
                    <div class="card" style="margin-top:1.5rem;">
                        <div class="card-header"><h3>📦 Recent Orders</h3></div>
                        <div class="table-wrapper">
                            <table>
                                <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
                                <tbody>${recent.map(o => `<tr>
                                    <td><strong>${o.id}</strong></td>
                                    <td>${o.customer_name}</td>
                                    <td>₹${parseFloat(o.total).toFixed(2)}</td>
                                    <td>${statusBadge(o.status)}</td>
                                    <td><span class="badge badge-${(o.payment_status||'unpaid').toLowerCase()}">${o.payment_status||'Unpaid'}</span></td>
                                </tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>` : '';
            }

            loadClothTypesTable();
            loadOrdersTable();
            loadCustomersTable();
            setTodayDate();
            loadDailyIncome();
            loadNotificationCustomers();
            loadNotificationHistory();

        } else {
            orders        = await api('/orders?phone=' + currentUser.phone);
            clothTypes    = await api('/cloth-types');
            notifications = await api('/notifications?phone=' + currentUser.phone);

            const myTotal = orders.reduce((s, o) => s + o.total, 0);
            document.getElementById('stat1Title').textContent = 'My Orders';
            document.getElementById('stat1Value').textContent = orders.length;
            document.getElementById('stat2Title').textContent = 'In Progress';
            document.getElementById('stat2Value').textContent = orders.filter(o => ['Order Placed','Picked Up','Being Washed','Ready'].includes(o.status)).length;
            document.getElementById('stat3Title').textContent = 'Delivered';
            document.getElementById('stat3Value').textContent = orders.filter(o => o.status === 'Delivered').length;
            document.getElementById('stat4Title').textContent = 'Total Spent';
            document.getElementById('stat4Value').textContent = '₹' + myTotal.toFixed(2);

            // Overview recent orders for customer
            const extra = document.getElementById('overviewExtra');
            if (extra) {
                const unread = notifications.filter(n => !n.read_status).length;
                extra.innerHTML = orders.length ? `
                    <div class="card" style="margin-top:1.5rem;">
                        <div class="card-header"><h3>📦 Recent Orders</h3>${unread ? `<span class="badge badge-unpaid">🔔 ${unread} unread notification${unread>1?'s':''}</span>` : ''}</div>
                        <div class="orders-grid" style="padding:1rem;">
                            ${orders.slice(0,4).map(o => {
                                const count = (o.items||[]).reduce((s,i) => s + i.quantity, 0);
                                return `<div class="order-card">
                                    <div class="order-card-header"><h3>${o.id}</h3>${statusBadge(o.status)}</div>
                                    <div class="order-card-body">
                                        <p><strong>Date</strong><span>${o.order_date}</span></p>
                                        <p><strong>Items</strong><span>${count}</span></p>
                                        <p><strong>Total</strong><span>₹${parseFloat(o.total).toFixed(2)}</span></p>
                                        <p><strong>Payment</strong><span class="badge badge-${(o.payment_status||'unpaid').toLowerCase()}">${o.payment_status||'Unpaid'}</span></p>
                                    </div>
                                    <div class="order-card-footer"><button onclick="viewBill('${o.id}')" class="btn btn-primary btn-sm">🧾 Bill</button></div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>` : `<div class="empty-state" style="margin-top:2rem;"><div class="empty-icon">🧺</div><h3>No orders yet</h3><p>Click <strong>New Order</strong> in the sidebar to get started!</p></div>`;
            }

            loadCustomerOrders();
            loadCustomerNotifications();
        }
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

function statusBadge(status) {
    const styles = {
        'Order Placed':  'background:#fef3c7;color:#92400e',
        'Picked Up':     'background:#ede9fe;color:#5b21b6',
        'Being Washed':  'background:#dbeafe;color:#1e40af',
        'Ready':         'background:#d1fae5;color:#065f46',
        'Delivered':     'background:#cffafe;color:#164e63',
        'Cancelled':     'background:#fee2e2;color:#991b1b',
    };
    const s = styles[status] || 'background:#f1f5f9;color:#475569';
    return `<span class="badge" style="${s};padding:3px 10px;border-radius:99px;font-size:0.78rem;font-weight:700;">${status}</span>`;
}

function loadOrdersTable() {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!orders.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#5f6368;">No orders yet</td></tr>'; return; }
    tbody.innerHTML = orders.map(o => {
        const count = (o.items||[]).reduce((s,i) => s + i.quantity, 0);
        return `<tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.customer_name}</td>
            <td>${o.order_date}</td>
            <td>${o.delivery_date}</td>
            <td>${count} items</td>
            <td><strong>₹${parseFloat(o.total).toFixed(2)}</strong></td>
            <td>
                ${statusBadge(o.status)}
                ${o.cancel_reason ? `<br><small style="color:#e74c3c;font-size:0.75rem;">Reason: ${o.cancel_reason}</small>` : ''}
            </td>
            <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                ${o.status !== 'Cancelled' ? `<button onclick="updateOrderStatus('${o.id}')" class="btn btn-warning btn-sm">Update</button>` : ''}
                <button onclick="viewBill('${o.id}')" class="btn btn-primary btn-sm">Bill</button>
            </td></tr>`;
    }).join('');
}

function loadClothTypesTable() {
    const tbody = document.querySelector('#clothTypesTable tbody');
    tbody.innerHTML = clothTypes.map(c => `<tr>
        <td><strong>${c.name}</strong></td>
        <td>₹${parseFloat(c.price).toFixed(2)}</td>
        <td style="display:flex;gap:0.4rem;">
            <button onclick="editClothType(${c.id},'${c.name}',${c.price})" class="btn btn-warning btn-sm">✏️ Edit</button>
            <button onclick="deleteClothType(${c.id})" class="btn btn-danger btn-sm">🗑️ Delete</button>
        </td></tr>`).join('');
}

function loadCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');
    if (!customers.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#5f6368;">No customers yet</td></tr>'; return; }
    tbody.innerHTML = customers.map(c => `<tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone}</td>
        <td>${c.address}</td>
        <td>${c.total_orders||0}</td>
        <td><span class="badge badge-active">${c.status||'Active'}</span></td></tr>`).join('');
}

function loadCustomerOrders() {
    const el = document.getElementById('ordersList');
    if (!orders.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Create your first order to get started!</p></div>`;
        return;
    }
    el.innerHTML = '<div class="orders-grid">' + orders.map(o => {
        const count = (o.items||[]).reduce((s,i) => s + i.quantity, 0);
        const statusSteps = [
            { key: 'Order Placed',  icon: '📋', desc: 'Order confirmed' },
            { key: 'Picked Up',     icon: '🚗', desc: 'Clothes collected' },
            { key: 'Being Washed',  icon: '🫧', desc: 'In the laundry' },
            { key: 'Ready',         icon: '👕', desc: 'Clean & packed' },
            { key: 'Delivered',     icon: '✅', desc: 'Delivered to you' }
        ];
        const isCancelled = o.status === 'Cancelled';
        const currentStep = isCancelled ? -1 : statusSteps.findIndex(s => s.key === o.status);
        const canCancel   = o.status === 'Order Placed'; // only before pickup

        const timelineHTML = isCancelled
            ? `<div class="order-timeline">
                <div class="timeline-step done current" style="color:#e74c3c;">
                    <div class="timeline-dot" style="background:#e74c3c;">✕</div>
                    <span style="color:#e74c3c;font-weight:700;">Cancelled</span>
                </div>
               </div>`
            : `<div class="order-timeline">
                ${statusSteps.map((s, i) => `
                    <div class="timeline-step ${i <= currentStep ? 'done' : ''} ${i === currentStep ? 'current' : ''}">
                        <div class="timeline-dot">${i < currentStep ? '✓' : i === currentStep ? s.icon : ''}</div>
                        <span>${s.key}</span>
                    </div>
                    ${i < statusSteps.length - 1 ? `<div class="timeline-line ${i < currentStep ? 'done' : ''}"></div>` : ''}
                `).join('')}
               </div>`;

        return `<div class="order-card${isCancelled ? ' order-card-cancelled' : ''}">
            <div class="order-card-header">
                <h3>${o.id}</h3>
                ${statusBadge(o.status)}
            </div>
            ${timelineHTML}
            <div class="order-card-body">
                <p><strong>Order Date</strong><span>${o.order_date}</span></p>
                <p><strong>Delivery Date</strong><span>${o.delivery_date}</span></p>
                <p><strong>Items</strong><span>${count} items</span></p>
                <p><strong>Total</strong><span>₹${parseFloat(o.total).toFixed(2)}</span></p>
                <p><strong>Payment</strong><span class="badge badge-${(o.payment_status||'unpaid').toLowerCase()}">${o.payment_status||'Unpaid'}</span></p>
                ${o.cancel_reason ? `<p><strong>Cancel Reason</strong><span style="color:#e74c3c;">${o.cancel_reason}</span></p>` : ''}
            </div>
            <div class="order-card-footer">
                <button onclick="viewBill('${o.id}')" class="btn btn-primary btn-sm">🧾 Bill</button>
                ${!isCancelled ? `<button onclick="quickReorder('${o.id}')" class="btn btn-reorder btn-sm">🔁 Reorder</button>` : ''}
                ${canCancel ? `<button onclick="showCancelModal('${o.id}')" class="btn btn-danger btn-sm">✕ Cancel</button>` : ''}
            </div>
        </div>`;
    }).join('') + '</div>';
}

function setupForms() {
    const clothTypeForm = document.getElementById('clothTypeForm');
    if (clothTypeForm) {
        clothTypeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name  = document.getElementById('clothTypeName').value;
            const price = parseFloat(document.getElementById('clothTypePrice').value);
            const data  = await api('/cloth-types', 'POST', { name, price });
            if (data.success) {
                clothTypes = await api('/cloth-types');
                loadClothTypesTable();
                hideAddClothType();
                alert('Cloth type added successfully!');
            } else { alert(data.message || 'Failed to add cloth type'); }
        });
    }

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        initDateValidation();

        // live step indicator updates on detail field changes
        ['orderName','orderPhone','orderAddress','orderDate','deliveryDate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => updateOrderSteps(
                document.querySelectorAll('.cloth-item-row').length
            ));
            if (el) el.addEventListener('change', () => updateOrderSteps(
                document.querySelectorAll('.cloth-item-row').length
            ));
        });
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!datesAreValid()) return;

            // Validate customer details
            const customerName    = document.getElementById('orderName').value.trim();
            const customerPhone   = document.getElementById('orderPhone').value.trim();
            const customerAddress = document.getElementById('orderAddress').value.trim();
            if (!customerName || !customerPhone || !customerAddress) {
                alert('Please fill in all customer details (name, phone, address).');
                return;
            }

            const items = [];
            let hasInvalidItem = false;
            document.querySelectorAll('.cloth-item-row').forEach(row => {
                const clothSel    = row.querySelector('.cloth-type-select');
                const serviceSel  = row.querySelector('.service-type-select');
                const clothType   = clothSel.value;
                const serviceType = serviceSel.value;
                const quantity    = parseInt(row.querySelector('.cloth-quantity').value) || 0;
                const basePrice   = parseFloat(clothSel.selectedOptions[0]?.dataset?.price);
                const multiplier  = parseFloat(serviceSel.selectedOptions[0]?.dataset?.multiplier);

                if (!clothType || !serviceType) return; // skip unselected rows
                if (isNaN(basePrice) || isNaN(multiplier) || quantity <= 0) {
                    hasInvalidItem = true;
                    return;
                }
                items.push({
                    cloth_type:   clothType,
                    service_type: serviceType,
                    quantity,
                    base_price:   basePrice,
                    multiplier,
                    price:        parseFloat((basePrice * multiplier).toFixed(2))
                });
            });

            if (hasInvalidItem) { alert('One or more items have invalid price or quantity. Please check your selections.'); return; }
            if (!items.length)  { alert('Please add at least one cloth item.'); return; }

            // get selected payment method
            const payMethodEl = document.querySelector('input[name="orderPayMethod"]:checked');
            const payMethod   = payMethodEl ? payMethodEl.value : 'Cash';

            const payload = {
                customer_name:    customerName,
                customer_phone:   customerPhone,
                customer_address: customerAddress,
                order_date:       document.getElementById('orderDate').value,
                delivery_date:    document.getElementById('deliveryDate').value,
                payment_method:   payMethod,
                items
            };

            // Disable button to prevent double-submit
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing Order…'; }

            try {
                const data = await api('/orders', 'POST', payload);
                if (data.success) {
                    launchConfetti();
                    const methodLabel = payMethod === 'Scan' ? 'Scan / UPI' : 'Cash on Delivery';
                    showToast(`🎉 Order placed! Pay via ${methodLabel}. ID: ${data.order_id}`, 'success');
                    // reset form
                    document.getElementById('orderName').value    = '';
                    document.getElementById('orderPhone').value   = '';
                    document.getElementById('orderAddress').value = '';
                    document.getElementById('orderDate').value    = '';
                    document.getElementById('deliveryDate').value = '';
                    document.getElementById('clothItemsContainer').innerHTML = '';
                    selectOrderPayMethod('Cash');
                    updateOrderSummary();
                    prefillCustomerInfo();
                    // reload data and go to order history
                    orders = await api('/orders?phone=' + currentUser.phone);
                    loadCustomerOrders();
                    const navEl = document.querySelector('.nav-item[onclick*="orderHistory"]');
                    showSection('orderHistory', navEl, 'Order History', 'View all your orders');
                } else {
                    alert(data.message || 'Failed to create order');
                }
            } catch (err) {
                console.error('Place order error:', err);
                alert('Something went wrong placing the order. Please try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="btn-place-order-icon">🛒</span><span>Place Order</span><span class="btn-place-order-arrow">→</span>';
                }
            }
        });
    }

    const notifForm = document.getElementById('notificationForm');
    if (notifForm) {
        notifForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const to_phone = document.getElementById('notificationCustomer').value;
            const message  = document.getElementById('notificationMessage').value;
            if (!to_phone) { alert('Please select a customer'); return; }
            if (!message.trim()) { alert('Please enter a message'); return; }
            const data = await api('/notifications', 'POST', { to_phone, message });
            if (data.success) {
                alert('Notification sent!');
                e.target.reset();
                notifications = await api('/notifications');
                loadNotificationHistory();
            } else { alert(data.message || 'Failed to send notification'); }
        });
    }
}

function showSection(section, navEl, title, subtitle) {
    // hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    // show target section
    const target = document.getElementById(section + '-section');
    if (!target) { console.warn('Section not found:', section + '-section'); return; }
    target.classList.add('active');

    // update nav highlight
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (navEl) navEl.classList.add('active');

    // update topbar title
    if (title)    document.getElementById('pageTitle').textContent    = title;
    if (subtitle) document.getElementById('pageSubtitle').textContent = subtitle;

    // reload data for the section being shown
    refreshSection(section);
}

async function refreshSection(section) {
    try {
        if (section === 'overview') {
            setupWelcomeBanner();
            await loadDashboardData();
        } else if (section === 'manageOrders') {
            orders = await api('/orders');
            loadOrdersTable();
        } else if (section === 'clothTypes') {
            clothTypes = await api('/cloth-types');
            loadClothTypesTable();
        } else if (section === 'customers') {
            customers = await api('/customers');
            loadCustomersTable();
        } else if (section === 'adminNotifications') {
            customers = await api('/customers');
            notifications = await api('/notifications');
            loadNotificationCustomers();
            loadNotificationHistory();
        } else if (section === 'income') {
            setTodayDate();
            await loadDailyIncome();
        } else if (section === 'newOrder') {
            clothTypes = await api('/cloth-types');
            // clear previous items and add a fresh row (skip if reorder will fill items)
            document.getElementById('clothItemsContainer').innerHTML = '';
            prefillCustomerInfo();
            if (!window._reordering) {
                addClothItem();
            }
            updateOrderSummary();
        } else if (section === 'orderHistory') {
            orders = await api('/orders?phone=' + currentUser.phone);
            loadCustomerOrders();
        } else if (section === 'notifications') {
            notifications = await api('/notifications?phone=' + currentUser.phone);
            loadCustomerNotifications();
        } else if (section === 'profile') {
            loadProfileForm();
        }
    } catch (err) {
        console.error('Error refreshing section:', section, err);
    }
}

function logout() {
    const role = currentUser.role;
    sessionStorage.removeItem('user');
    window.location.href = role === 'admin' ? 'admin-login.html' : 'customer-login.html';
}

function showAddClothType() { document.getElementById('addClothTypeForm').style.display = 'block'; }
function hideAddClothType() { document.getElementById('addClothTypeForm').style.display = 'none'; document.getElementById('clothTypeForm').reset(); }

async function editClothType(id, name, currentPrice) {
    const newPrice = prompt('Enter new price for ' + name + ':', currentPrice);
    if (newPrice !== null && !isNaN(newPrice)) {
        const data = await api('/cloth-types/' + id, 'PUT', { price: parseFloat(newPrice) });
        if (data.success) { clothTypes = await api('/cloth-types'); loadClothTypesTable(); alert('Price updated!'); }
    }
}

async function deleteClothType(id) {
    if (confirm('Delete this cloth type?')) {
        const data = await api('/cloth-types/' + id, 'DELETE');
        if (data.success) { clothTypes = await api('/cloth-types'); loadClothTypesTable(); }
    }
}

function loadClothItemsDropdown() {
    // just ensure clothTypes are ready; don't auto-add a row on init
    // rows are added when user clicks "+ Add Item"
}

function addClothItem() {
    const container = document.getElementById('clothItemsContainer');
    const div = document.createElement('div');
    div.className = 'cloth-item-row';
    div.innerHTML = `
        <select class="cloth-type-select" onchange="updateOrderSummary()" required>
            <option value="">Select Cloth Type</option>
            ${clothTypes.map(c => `<option value="${c.name}" data-price="${c.price}">${c.name} — ₹${parseFloat(c.price).toFixed(2)}</option>`).join('')}
        </select>
        <select class="service-type-select" onchange="updateOrderSummary()" required>
            <option value="">Select Service</option>
            <option value="Wash" data-multiplier="1">🫧 Wash (1×)</option>
            <option value="Dry Wash" data-multiplier="1.5">✨ Dry Wash (1.5×)</option>
            <option value="All Services" data-multiplier="2">⭐ All Services (2×)</option>
        </select>
        <input type="number" class="cloth-quantity" min="1" value="1" onchange="updateOrderSummary()" required>
        <button type="button" onclick="removeClothItem(this)" class="btn-remove" title="Remove">🗑️</button>`;
    container.appendChild(div);
    updateOrderSummary();
}

function removeClothItem(btn) { btn.parentElement.remove(); updateOrderSummary(); }

function updateOrderSummary() {
    let totalItems = 0, totalAmount = 0;
    const lineItems = [];

    document.querySelectorAll('.cloth-item-row').forEach(row => {
        const cs  = row.querySelector('.cloth-type-select');
        const ss  = row.querySelector('.service-type-select');
        const qty = parseInt(row.querySelector('.cloth-quantity').value) || 0;
        const bp  = parseFloat(cs.selectedOptions[0]?.dataset.price) || 0;
        const mul = parseFloat(ss.selectedOptions[0]?.dataset.multiplier) || 1;
        if (cs.value && ss.value && qty > 0) {
            totalItems  += qty;
            totalAmount += qty * bp * mul;
            lineItems.push({
                name:    cs.value,
                service: ss.value,
                qty,
                amount:  qty * bp * mul
            });
        }
    });

    // update totals
    document.getElementById('totalItems').textContent  = totalItems;
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);

    // update live summary panel
    const emptyEl = document.getElementById('summaryEmpty');
    const itemsEl = document.getElementById('liveSummaryItems');
    if (!emptyEl || !itemsEl) return;

    if (lineItems.length === 0) {
        emptyEl.style.display = 'block';
        itemsEl.innerHTML = '';
    } else {
        emptyEl.style.display = 'none';
        itemsEl.innerHTML = lineItems.map(item => `
            <div class="live-summary-item">
                <div class="live-summary-item-name">
                    ${item.name} × ${item.qty}
                    <span class="live-summary-item-service">${item.service}</span>
                </div>
                <div class="live-summary-item-price">₹${item.amount.toFixed(2)}</div>
            </div>`).join('');
    }

    // update step indicators
    updateOrderSteps(lineItems.length);
}

function updateOrderSteps(itemCount) {
    const s1 = document.getElementById('step1Indicator');
    const s2 = document.getElementById('step2Indicator');
    const s3 = document.getElementById('step3Indicator');
    const lines = document.querySelectorAll('.order-step-line');
    if (!s1) return;

    // check if customer details are filled
    const name    = document.getElementById('orderName')?.value?.trim();
    const phone   = document.getElementById('orderPhone')?.value?.trim();
    const address = document.getElementById('orderAddress')?.value?.trim();
    const oDate   = document.getElementById('orderDate')?.value;
    const dDate   = document.getElementById('deliveryDate')?.value;
    const detailsDone = name && phone && address && oDate && dDate;

    if (detailsDone) {
        s1.classList.add('done'); s1.classList.remove('active');
        s1.querySelector('.step-dot').textContent = '✓';
        if (lines[0]) lines[0].classList.add('done');
    } else {
        s1.classList.remove('done'); s1.classList.add('active');
        s1.querySelector('.step-dot').textContent = '1';
        if (lines[0]) lines[0].classList.remove('done');
    }

    if (itemCount > 0) {
        s2.classList.add('done'); s2.classList.remove('active');
        s2.querySelector('.step-dot').textContent = '✓';
        if (lines[1]) lines[1].classList.add('done');
    } else {
        s2.classList.remove('done');
        s2.classList.toggle('active', detailsDone);
        s2.querySelector('.step-dot').textContent = '2';
        if (lines[1]) lines[1].classList.remove('done');
    }

    if (detailsDone && itemCount > 0) {
        s3.classList.add('active');
    } else {
        s3.classList.remove('active');
    }
}

async function updateOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const statuses = ['Order Placed', 'Picked Up', 'Being Washed', 'Ready', 'Delivered'];
    const current  = order.status;
    const options  = statuses.map((s, i) => `${i + 1}. ${s}${s === current ? ' (current)' : ''}`).join('\n');
    const choice   = prompt(`Update status for ${orderId}:\n\n${options}\n\nEnter number (1-5):`);
    if (!choice) return;
    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= statuses.length) { alert('Invalid choice'); return; }
    const newStatus = statuses[idx];
    if (newStatus === current) { alert('Status unchanged'); return; }
    const data = await api('/orders/' + orderId + '/status', 'PUT', { status: newStatus });
    if (data.success) {
        await refreshSection('manageOrders');
        alert('✅ Status updated to: ' + newStatus);
    } else {
        alert('Failed to update status');
    }
}

// currently selected payment method in the modal
let selectedPayMethod = 'Cash';

function viewBill(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) { showToast('Order not found', 'error'); return; }
    currentBillOrder = order;

    document.getElementById('billNo').textContent           = 'BILL-' + order.id;
    document.getElementById('billOrderId').textContent      = order.id;
    document.getElementById('billDate').textContent         = order.order_date;
    document.getElementById('billDeliveryDate').textContent = order.delivery_date;
    document.getElementById('billCustomer').textContent     = order.customer_name;
    document.getElementById('billPhone').textContent        = order.customer_phone;
    document.getElementById('billAddress').textContent      = order.customer_address;

    document.getElementById('billItems').innerHTML = (order.items||[]).map(item => `
        <tr>
            <td>${item.cloth_type}</td>
            <td>${item.service_type||'Wash'}</td>
            <td>${item.quantity}</td>
            <td>₹${parseFloat(item.price).toFixed(2)}</td>
            <td>₹${(item.quantity * item.price).toFixed(2)}</td>
        </tr>`).join('');

    document.getElementById('billTotal').textContent = parseFloat(order.total).toFixed(2);

    const ps     = order.payment_status || 'Unpaid';
    const pm     = order.payment_method || 'Cash';
    const isPaid = ps === 'Paid';

    // Payment status badge
    document.getElementById('billPaymentStatus').innerHTML = isPaid
        ? '<span class="badge badge-paid">✅ Paid</span>'
        : (order.status === 'Cancelled'
            ? '<span class="badge badge-cancelled">✕ Cancelled</span>'
            : '<span class="badge badge-unpaid">⏳ Unpaid</span>');

    // Payment method display
    const methodIcons = { Cash: '💵 Cash', Scan: '📱 Scan / UPI' };
    document.getElementById('billMethodDisplay').textContent = methodIcons[pm] || pm;
    document.getElementById('billMethodRow').style.display = isPaid ? 'flex' : 'none';

    // Order status row
    let orderStatusRow = document.getElementById('billOrderStatusRow');
    if (!orderStatusRow) {
        const totalBox = document.querySelector('.bill-total-box');
        orderStatusRow = document.createElement('div');
        orderStatusRow.id = 'billOrderStatusRow';
        orderStatusRow.className = 'bill-total-row';
        totalBox.appendChild(orderStatusRow);
    }
    const os = order.status || 'Pending';
    const statusColors = {
        'Order Placed':  'background:#fef3c7;color:#92400e',
        'Picked Up':     'background:#ede9fe;color:#5b21b6',
        'Being Washed':  'background:#dbeafe;color:#1e40af',
        'Ready':         'background:#d1fae5;color:#065f46',
        'Delivered':     'background:#cffafe;color:#164e63',
        'Cancelled':     'background:#fee2e2;color:#991b1b'
    };
    const sc = statusColors[os] || 'background:#f1f5f9;color:#475569';
    orderStatusRow.innerHTML = `<span>Order Status</span>
        <span style="${sc};padding:3px 12px;border-radius:99px;font-weight:700;font-size:0.8rem;">${os}</span>`;

    // Show cancel reason row if cancelled
    let cancelReasonRow = document.getElementById('billCancelReasonRow');
    if (os === 'Cancelled' && order.cancel_reason) {
        if (!cancelReasonRow) {
            cancelReasonRow = document.createElement('div');
            cancelReasonRow.id = 'billCancelReasonRow';
            cancelReasonRow.className = 'bill-total-row';
            orderStatusRow.insertAdjacentElement('afterend', cancelReasonRow);
        }
        cancelReasonRow.innerHTML = `<span>Cancel Reason</span>
            <span style="color:#e74c3c;font-size:0.85rem;font-weight:600;">${order.cancel_reason}</span>`;
        cancelReasonRow.style.display = 'flex';
    } else if (cancelReasonRow) {
        cancelReasonRow.style.display = 'none';
    }

    const isCancelled = os === 'Cancelled';

    // Admin controls
    const isAdmin = currentUser.role === 'admin';
    const methodSection = document.getElementById('paymentMethodSection');
    const markPaidBtn   = document.getElementById('markPaidBtn');
    const markUnpaidBtn = document.getElementById('markUnpaidBtn');

    // Remove any previous customer payment info box
    const oldInfo = document.getElementById('customerPaymentInfo');
    if (oldInfo) oldInfo.remove();
    const oldCancelNotice = document.getElementById('billCancelNotice');
    if (oldCancelNotice) oldCancelNotice.remove();

    if (isAdmin) {
        if (isCancelled) {
            // Cancelled — hide all payment controls, show notice
            methodSection.style.display = 'none';
            markPaidBtn.style.display   = 'none';
            markUnpaidBtn.style.display = 'none';
            const notice = document.createElement('div');
            notice.id = 'billCancelNotice';
            notice.style.cssText = 'background:#fee2e2;border:1.5px solid #e74c3c;border-radius:10px;padding:12px 16px;color:#991b1b;font-size:0.88rem;font-weight:600;margin:12px 0;text-align:center;';
            notice.textContent = '✕ This order was cancelled — no payment required.';
            document.querySelector('.bill-actions').insertAdjacentElement('beforebegin', notice);
        } else if (!isPaid) {
            // Unpaid active order — show payment selector + Mark as Paid
            methodSection.style.display = 'block';
            markPaidBtn.style.display   = 'inline-flex';
            markUnpaidBtn.style.display = 'none';
            selectedPayMethod = pm || 'Cash';
            selectPayMethod(selectedPayMethod);
        } else {
            // Already paid — show Mark Unpaid only
            methodSection.style.display = 'none';
            markPaidBtn.style.display   = 'none';
            markUnpaidBtn.style.display = 'inline-flex';
        }
    } else {
        // Customer view — show read-only payment info
        methodSection.style.display = 'none';
        markPaidBtn.style.display   = 'none';
        markUnpaidBtn.style.display = 'none';

        // Build customer payment info box
        const infoBox = document.createElement('div');
        infoBox.id = 'customerPaymentInfo';
        infoBox.className = 'customer-payment-info';

        if (isPaid) {
            const methodLabel = pm === 'Scan' ? '📱 Paid via Scan / UPI' : '💵 Paid via Cash';
            infoBox.innerHTML = `
                <div class="customer-payment-info-icon">${pm === 'Scan' ? '📱' : '💵'}</div>
                <div class="customer-payment-info-text">
                    <strong>${methodLabel}</strong>
                    <span>Payment completed — thank you!</span>
                </div>`;
        } else {
            infoBox.innerHTML = `
                <div class="customer-payment-info-icon">💳</div>
                <div class="customer-payment-info-text">
                    <strong>Payment Pending</strong>
                    <span>Pay via <b>Cash on Delivery</b> or <b>Scan / UPI</b> at the time of delivery</span>
                </div>`;
        }

        // Insert after bill-total-box
        const totalBox = document.querySelector('.bill-total-box');
        if (totalBox) totalBox.insertAdjacentElement('afterend', infoBox);
    }

    document.getElementById('billingModal').classList.add('open');
}

// ── Order form payment method selector ──
function selectOrderPayMethod(method) {
    const cardCOD  = document.getElementById('payCardCOD');
    const cardScan = document.getElementById('payCardScan');
    const checkCOD = document.getElementById('payCheckCOD');
    const checkScan= document.getElementById('payCheckScan');
    const upiInfo  = document.getElementById('orderUpiInfo');
    const radioCOD = document.querySelector('input[name="orderPayMethod"][value="Cash"]');
    const radioScan= document.querySelector('input[name="orderPayMethod"][value="Scan"]');

    if (!cardCOD) return;

    if (method === 'Cash') {
        cardCOD.classList.add('active');
        cardScan.classList.remove('active');
        if (checkCOD)  checkCOD.textContent  = '✓';
        if (checkScan) checkScan.textContent = '';
        if (upiInfo)   upiInfo.style.display = 'none';
        if (radioCOD)  radioCOD.checked = true;
    } else {
        cardScan.classList.add('active');
        cardCOD.classList.remove('active');
        if (checkScan) checkScan.textContent = '✓';
        if (checkCOD)  checkCOD.textContent  = '';
        if (upiInfo)   upiInfo.style.display = 'flex';
        if (radioScan) radioScan.checked = true;
    }

    // update live summary payment badge
    const summaryPayEl = document.getElementById('summaryPayMethod');
    if (summaryPayEl) {
        summaryPayEl.textContent = method === 'Scan' ? '📱 Scan / UPI' : '💵 Cash on Delivery';
    }
}

function selectPayMethod(method) {
    selectedPayMethod = method;

    const cashBtn = document.getElementById('payMethodCash');
    const scanBtn = document.getElementById('payMethodScan');
    const qrBox   = document.getElementById('upiQrBox');
    const checkC  = document.getElementById('checkCash');
    const checkS  = document.getElementById('checkScan');

    if (method === 'Cash') {
        cashBtn.classList.add('active');
        scanBtn.classList.remove('active');
        checkC.textContent = '✓';
        checkS.textContent = '';
        qrBox.style.display = 'none';
    } else {
        scanBtn.classList.add('active');
        cashBtn.classList.remove('active');
        checkS.textContent = '✓';
        checkC.textContent = '';
        qrBox.style.display = 'flex';
        // show the order total in the UPI box
        if (currentBillOrder) {
            document.getElementById('upiAmount').textContent =
                '₹' + parseFloat(currentBillOrder.total).toFixed(2);
        }
    }
}

async function markAsPaid() {
    if (!currentBillOrder) return;
    try {
        const data = await api('/orders/' + currentBillOrder.id + '/payment', 'PUT', {
            payment_status: 'Paid',
            payment_method: selectedPayMethod
        });
        if (data.success) {
            if (currentUser.role === 'admin') {
                orders = await api('/orders');
                loadOrdersTable();
                loadDailyIncome();
            } else {
                orders = await api('/orders?phone=' + currentUser.phone);
            }
            const updated = orders.find(o => o.id === currentBillOrder.id);
            if (updated) viewBill(updated.id);
            showToast(`✅ Marked as Paid via ${selectedPayMethod === 'Scan' ? 'Scan / UPI' : 'Cash'}`, 'success');
        } else {
            alert(data.message || 'Failed to mark as paid');
        }
    } catch (err) {
        console.error('markAsPaid error:', err);
        alert('Something went wrong. Please try again.');
    }
}

async function markAsUnpaid() {
    if (!currentBillOrder) return;
    try {
        const data = await api('/orders/' + currentBillOrder.id + '/payment', 'PUT', {
            payment_status: 'Unpaid',
            payment_method: 'Cash'
        });
        if (data.success) {
            if (currentUser.role === 'admin') {
                orders = await api('/orders');
                loadOrdersTable();
                loadDailyIncome();
            } else {
                orders = await api('/orders?phone=' + currentUser.phone);
            }
            const updated = orders.find(o => o.id === currentBillOrder.id);
            if (updated) viewBill(updated.id);
            showToast('↩️ Marked as Unpaid', 'warning');
        } else {
            alert(data.message || 'Failed to mark as unpaid');
        }
    } catch (err) {
        console.error('markAsUnpaid error:', err);
        alert('Something went wrong. Please try again.');
    }
}

function closeBilling() { document.getElementById('billingModal').classList.remove('open'); currentBillOrder = null; }

function printBill() { window.print(); }

// ── Cancel Order ──
function showCancelModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status !== 'Order Placed') {
        showToast('Orders can only be cancelled before pickup.', 'error');
        return;
    }

    // Build modal
    let modal = document.getElementById('cancelOrderModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cancelOrderModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-box" style="max-width:440px;">
                <div style="padding:28px 28px 0;">
                    <h2 style="margin:0 0 6px;color:#e74c3c;">✕ Cancel Order</h2>
                    <p style="margin:0 0 20px;color:#666;font-size:0.9rem;">
                        Order <strong id="cancelOrderId"></strong> will be cancelled.
                        This cannot be undone.
                    </p>
                    <div style="margin-bottom:16px;">
                        <label style="font-size:0.8rem;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:8px;">
                            Reason for cancellation
                        </label>
                        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;" id="cancelReasonOptions">
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:0.9rem;">
                                <input type="radio" name="cancelReason" value="Changed my mind"> Changed my mind
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:0.9rem;">
                                <input type="radio" name="cancelReason" value="Ordered by mistake"> Ordered by mistake
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:0.9rem;">
                                <input type="radio" name="cancelReason" value="Found a better option"> Found a better option
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:0.9rem;">
                                <input type="radio" name="cancelReason" value="Other"> Other
                            </label>
                        </div>
                        <textarea id="cancelReasonText" rows="2"
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde3ec;border-radius:10px;font-size:0.9rem;box-sizing:border-box;resize:none;display:none;"
                            placeholder="Please describe your reason..."></textarea>
                    </div>
                </div>
                <div style="display:flex;gap:10px;padding:0 28px 28px;">
                    <button onclick="confirmCancelOrder()" class="btn btn-danger" style="flex:1;">✕ Yes, Cancel Order</button>
                    <button onclick="closeCancelModal()" class="btn btn-secondary" style="flex:1;">Keep Order</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Show textarea when "Other" selected
        modal.querySelectorAll('input[name="cancelReason"]').forEach(r => {
            r.addEventListener('change', () => {
                document.getElementById('cancelReasonText').style.display =
                    r.value === 'Other' ? 'block' : 'none';
            });
        });
    }

    document.getElementById('cancelOrderId').textContent = orderId;
    modal.dataset.orderId = orderId;
    // reset
    modal.querySelectorAll('input[name="cancelReason"]').forEach(r => r.checked = false);
    document.getElementById('cancelReasonText').style.display = 'none';
    document.getElementById('cancelReasonText').value = '';
    modal.classList.add('open');
}

function closeCancelModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) modal.classList.remove('open');
}

async function confirmCancelOrder() {
    const modal    = document.getElementById('cancelOrderModal');
    const orderId  = modal.dataset.orderId;
    const selected = modal.querySelector('input[name="cancelReason"]:checked');

    if (!selected) {
        showToast('Please select a reason for cancellation.', 'error');
        return;
    }

    let reason = selected.value;
    if (reason === 'Other') {
        const custom = document.getElementById('cancelReasonText').value.trim();
        if (!custom) { showToast('Please describe your reason.', 'error'); return; }
        reason = custom;
    }

    try {
        const data = await api('/orders/' + orderId + '/cancel', 'PUT', { reason });
        if (data.success) {
            closeCancelModal();
            orders = await api('/orders?phone=' + currentUser.phone);
            loadCustomerOrders();
            showToast('✕ Order ' + orderId + ' cancelled.', 'warning');
        } else {
            showToast(data.message || 'Failed to cancel order.', 'error');
        }
    } catch (err) {
        showToast('Something went wrong. Please try again.', 'error');
    }
}

async function togglePaymentStatus() {
    if (!currentBillOrder) return;
    const newStatus = (currentBillOrder.payment_status || 'Unpaid') === 'Paid' ? 'Unpaid' : 'Paid';
    const data = await api('/orders/' + currentBillOrder.id + '/payment', 'PUT', { payment_status: newStatus });
    if (data.success) {
        // refresh orders list
        if (currentUser.role === 'admin') {
            orders = await api('/orders');
        } else {
            orders = await api('/orders?phone=' + currentUser.phone);
        }
        // update the bill modal with fresh data
        const updated = orders.find(o => o.id === currentBillOrder.id);
        if (updated) viewBill(updated.id);
        // refresh income if admin
        if (currentUser.role === 'admin') loadDailyIncome();
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const el = document.getElementById('incomeDate');
    el.value = today;
    el.max   = today;   // block future dates in the picker
}

async function loadDailyIncome() {
    const el   = document.getElementById('incomeDate');
    const today = new Date().toISOString().split('T')[0];

    // enforce max = today every time
    el.max = today;

    // if user somehow picked a future date, reset to today
    if (!el.value || el.value > today) {
        el.value = today;
    }

    const date = el.value;
    const data = await api('/reports/daily-income?date=' + date);
    document.getElementById('dailyOrders').textContent = data.total_orders || 0;
    document.getElementById('dailyIncome').textContent = '₹' + parseFloat(data.total_income||0).toFixed(2);
    document.getElementById('dailyPaid').textContent   = '₹' + parseFloat(data.paid_income||0).toFixed(2);
    document.getElementById('dailyUnpaid').textContent = '₹' + parseFloat(data.unpaid_income||0).toFixed(2);
    const listEl = document.getElementById('dailyOrdersList');
    if (!data.orders || !data.orders.length) {
        listEl.innerHTML = '<p style="color:var(--text-3);padding:1rem 0;">No orders for this date.</p>';
        return;
    }
    listEl.innerHTML = `<div class="card" style="margin-top:8px;">
        <div class="table-wrapper">
        <table><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Payment</th></tr></thead><tbody>
        ${data.orders.map(o => `<tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.customer_name}</td>
            <td>₹${parseFloat(o.total).toFixed(2)}</td>
            <td><span class="badge badge-${(o.payment_status||'unpaid').toLowerCase()}">${o.payment_status||'Unpaid'}</span></td>
        </tr>`).join('')}
        </tbody></table>
        </div></div>`;
}

window.onclick = function(e) { if (e.target === document.getElementById('billingModal')) closeBilling(); };

function handleNotifClick() {
    if (currentUser.role === 'customer') {
        const navEl = document.querySelector('.nav-item[onclick*="notifications"]');
        showSection('notifications', navEl, 'Notifications', 'Messages from admin');
    } else {
        const navEl = document.querySelector('.nav-item[onclick*="adminNotifications"]');
        showSection('adminNotifications', navEl, 'Notifications', 'Send messages to customers');
    }
}

function loadNotificationCustomers() {
    const select = document.getElementById('notificationCustomer');
    if (!select) return;
    if (!customers.length) { select.innerHTML = '<option value="">No customers yet</option>'; return; }
    select.innerHTML = '<option value="">Select Customer</option>' +
        customers.map(c => `<option value="${c.phone}">${c.name} (${c.phone})</option>`).join('');
}

function loadNotificationHistory() {
    const el = document.getElementById('notificationHistory');
    if (!el) return;
    if (!notifications.length) { el.innerHTML = '<p>No notifications sent yet.</p>'; return; }
    el.innerHTML = [...notifications].reverse().map(n => `
        <div class="notification-card">
            <p><strong>To:</strong> ${n.to_name} (${n.to_phone})</p>
            <p><strong>Message:</strong> ${n.message}</p>
            <p><strong>Sent:</strong> ${new Date(n.timestamp).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="${n.read_status ? 'status-completed':'status-pending'}">${n.read_status ? 'Read':'Unread'}</span></p>
        </div>`).join('');
}

async function checkNotifications() {
    if (currentUser.role !== 'customer') return;
    notifications = await api('/notifications?phone=' + currentUser.phone);
    const unread = notifications.filter(n => !n.read_status);
    const badge  = document.getElementById('notifBadge');
    if (unread.length) { badge.textContent = unread.length; badge.style.display = 'flex'; } else { badge.style.display = 'none'; }
    loadCustomerNotifications();
    if (unread.length) {
        showNotification(unread[unread.length - 1].message);
        setTimeout(async () => {
            for (const n of unread) await api('/notifications/' + n.id + '/read', 'PUT');
            badge.style.display = 'none';
            document.getElementById('notificationBar').style.display = 'none';
            notifications = await api('/notifications?phone=' + currentUser.phone);
            loadCustomerNotifications();
        }, 5000);
    }
}

function showNotification(msg) {
    document.getElementById('notifBarMessage').textContent = msg;
    document.getElementById('notificationBar').style.display = 'flex';
}
function closeNotification() { document.getElementById('notificationBar').style.display = 'none'; }

function prefillCustomerInfo() {
    if (currentUser.role !== 'customer') return;
    const n = document.getElementById('orderName');
    const p = document.getElementById('orderPhone');
    const a = document.getElementById('orderAddress');
    if (n) n.value = currentUser.name;
    if (p) { p.value = currentUser.phone; p.readOnly = true; }
    if (a) a.value = currentUser.address || '';
}

function loadProfileForm() {
    if (currentUser.role !== 'customer') return;
    const n = document.getElementById('profileName');
    const p = document.getElementById('profilePhone');
    const a = document.getElementById('profileAddress');
    const pw = document.getElementById('profilePassword');
    if (n) n.value = currentUser.name || '';
    if (p) p.value = currentUser.phone || '';
    if (a) a.value = currentUser.address || '';
    if (pw) pw.value = '';
}

async function saveProfile() {
    const name    = document.getElementById('profileName').value.trim();
    const phone   = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    const password = document.getElementById('profilePassword').value;

    if (!name || !phone) {
        showToast('Name and phone are required.', 'error');
        return;
    }

    const payload = {
        name,
        phone,
        address,
        current_phone: currentUser.phone   // send original phone to locate the record
    };
    if (password) payload.password = password;

    const data = await api('/customer/profile', 'PUT', payload);
    if (!data.success) {
        showToast(data.message || 'Failed to update profile.', 'error');
        return;
    }

    // Update in-memory user and sessionStorage
    currentUser.name    = name;
    currentUser.phone   = phone;
    currentUser.address = address;
    sessionStorage.setItem('user', JSON.stringify(currentUser));

    // Refresh sidebar name/avatar
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();

    // Clear password field
    document.getElementById('profilePassword').value = '';

    showToast('✅ Profile updated successfully!', 'success');
}

function loadCustomerNotifications() {
    if (currentUser.role !== 'customer') return;
    const el = document.getElementById('customerNotificationsList');
    if (!el) return;
    if (!notifications.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><h3>No notifications</h3><p>You'll see messages from admin here</p></div>`; return; }
    el.innerHTML = [...notifications].reverse().map(n => `
        <div class="notification-card ${n.read_status ? 'read':'unread'}">
            <p><strong>From:</strong> ${n.from_user||'Admin'} &nbsp;|&nbsp; <strong>Time:</strong> ${new Date(n.timestamp).toLocaleString()}</p>
            <p class="notif-message">${n.message}</p>
            <p><strong>Status:</strong> <span class="badge ${n.read_status ? 'badge-completed':'badge-pending'}">${n.read_status ? 'Read':'Unread'}</span></p>
        </div>`).join('');
}

// Date Validation
function initDateValidation() {
    const od = document.getElementById('orderDate');
    const dd = document.getElementById('deliveryDate');
    if (!od || !dd) return;
    const today = new Date().toISOString().split('T')[0];
    od.min = today; dd.min = today;
    od.addEventListener('change', function() {
        if (!this.value) return;
        if (this.value < today) { setDateError(od,'orderDateMsg','That date is in the past. Please pick today or a future date.'); return; }
        clearDateError(od,'orderDateMsg');
        dd.min = this.value;
        if (dd.value && dd.value < this.value) { dd.value = ''; setDateError(dd,'deliveryDateMsg','Delivery should be on or after your order date.'); }
    });
    dd.addEventListener('change', function() {
        if (!this.value) return;
        if (od.value && this.value < od.value) { setDateError(dd,'deliveryDateMsg','Delivery should be on or after your order date.'); return; }
        clearDateError(dd,'deliveryDateMsg');
    });
}
function setDateError(el,id,msg) { el.style.borderColor='#e74c3c'; el.style.boxShadow='0 0 0 3px rgba(231,76,60,.15)'; const m=document.getElementById(id); if(m){m.textContent=msg;m.style.display='block';} }
function clearDateError(el,id) { el.style.borderColor=''; el.style.boxShadow=''; const m=document.getElementById(id); if(m){m.textContent='';m.style.display='none';} }
function datesAreValid() {
    const today=new Date().toISOString().split('T')[0];
    const od=document.getElementById('orderDate'); const dd=document.getElementById('deliveryDate'); let valid=true;
    if (!od.value) { setDateError(od,'orderDateMsg','Please select an order date.'); od.focus(); valid=false; }
    else if (od.value < today) { setDateError(od,'orderDateMsg','That date is in the past. Please pick today or a future date.'); od.focus(); valid=false; }
    else clearDateError(od,'orderDateMsg');
    if (!dd.value) { setDateError(dd,'deliveryDateMsg','Please select a delivery date.'); if(valid)dd.focus(); valid=false; }
    else if (od.value && dd.value < od.value) { setDateError(dd,'deliveryDateMsg','Delivery should be on or after your order date.'); if(valid)dd.focus(); valid=false; }
    else clearDateError(dd,'deliveryDateMsg');
    return valid;
}

function debugNotifications() { console.log('Notifications:', notifications); alert('Check browser console for debug info.'); }

// Auto-refresh notifications every 15 seconds
setInterval(async () => {
    if (!currentUser) return;
    try {
        if (currentUser.role === 'customer') {
            notifications = await api('/notifications?phone=' + currentUser.phone);
            const unread = notifications.filter(n => !n.read_status);
            const badge  = document.getElementById('notifBadge');
            if (unread.length) { badge.textContent = unread.length; badge.style.display = 'flex'; }
            else { badge.style.display = 'none'; }
            // refresh notifications section if it's active
            const section = document.getElementById('notifications-section');
            if (section && section.classList.contains('active')) loadCustomerNotifications();
        } else {
            notifications = await api('/notifications');
            const unread = notifications.filter(n => !n.read_status);
            const badge  = document.getElementById('notifBadge');
            if (unread.length) { badge.textContent = unread.length; badge.style.display = 'flex'; }
            else { badge.style.display = 'none'; }
        }
    } catch(e) {}
}, 15000);

// ══════════════════════════════════════════════
// FEATURE 1 — Live Clock in Topbar
// ══════════════════════════════════════════════
function startClock() {
    function tick() {
        const now  = new Date();
        const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const tEl  = document.getElementById('clockTime');
        const dEl  = document.getElementById('clockDate');
        if (tEl) tEl.textContent = time;
        if (dEl) dEl.textContent = date;
    }
    tick();
    setInterval(tick, 1000);
}

// ══════════════════════════════════════════════
// FEATURE 2 — Dark Mode Toggle
// ══════════════════════════════════════════════
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const icon   = document.getElementById('darkIcon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('cleanease-dark', isDark ? '1' : '0');
    showToast(isDark ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
}

function loadDarkModePreference() {
    if (localStorage.getItem('cleanease-dark') === '1') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('darkIcon');
        if (icon) icon.textContent = '☀️';
    }
}

// ══════════════════════════════════════════════
// FEATURE 3 — Toast Notifications
// ══════════════════════════════════════════════
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const colors = {
        success: { bg: '#10b981', icon: '✅' },
        error:   { bg: '#ef4444', icon: '❌' },
        info:    { bg: '#6366f1', icon: 'ℹ️'  },
        warning: { bg: '#f59e0b', icon: '⚠️' }
    };
    const c = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
        <span class="toast-icon">${c.icon}</span>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    toast.style.cssText = `
        display:flex;align-items:center;gap:10px;
        background:${c.bg};color:#fff;
        padding:12px 16px;border-radius:12px;
        font-size:0.88rem;font-weight:600;
        box-shadow:0 8px 24px rgba(0,0,0,.2);
        animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);
        min-width:240px;max-width:320px;
        font-family:inherit;`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ══════════════════════════════════════════════
// FEATURE 4 — Confetti on Order Placed
// ══════════════════════════════════════════════
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors  = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#fff'];
    const pieces  = Array.from({ length: 140 }, () => ({
        x:    Math.random() * canvas.width,
        y:    Math.random() * -canvas.height,
        w:    6 + Math.random() * 8,
        h:    10 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot:  Math.random() * 360,
        vx:   (Math.random() - 0.5) * 3,
        vy:   3 + Math.random() * 4,
        vr:   (Math.random() - 0.5) * 6
    }));

    let frame;
    let elapsed = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
            p.x  += p.vx;
            p.y  += p.vy;
            p.rot += p.vr;
        });
        elapsed++;
        if (elapsed < 120) {
            frame = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(frame);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }
    draw();
}

// ══════════════════════════════════════════════
// FEATURE 5 — Quick Reorder
// ══════════════════════════════════════════════
async function quickReorder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const confirmed = confirm(`🔁 Reorder "${orderId}"?\n\nThis will pre-fill a new order with the same items.\nYou can review before placing.`);
    if (!confirmed) return;

    // Set flag so refreshSection skips adding a blank row
    window._reordering = true;

    // Navigate to New Order section and wait for clothTypes to load
    const navEl = document.querySelector('.nav-item[onclick*="newOrder"]');
    showSection('newOrder', navEl, 'New Order', 'Create a new laundry order');

    // Wait for refreshSection (async) to fully complete
    await new Promise(r => setTimeout(r, 500));

    // Clear flag
    window._reordering = false;

    // Pre-fill customer info
    prefillCustomerInfo();

    // Clear existing items and add items from old order
    const container = document.getElementById('clothItemsContainer');
    if (!container) return;
    container.innerHTML = '';

    (order.items || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'cloth-item-row';
        div.innerHTML = `
            <select class="cloth-type-select" onchange="updateOrderSummary()" required>
                <option value="">Select Cloth Type</option>
                ${clothTypes.map(c => `<option value="${c.name}" data-price="${c.price}" ${c.name === item.cloth_type ? 'selected' : ''}>${c.name} — ₹${parseFloat(c.price).toFixed(2)}</option>`).join('')}
            </select>
            <select class="service-type-select" onchange="updateOrderSummary()" required>
                <option value="">Select Service</option>
                <option value="Wash" data-multiplier="1" ${item.service_type === 'Wash' ? 'selected' : ''}>🫧 Wash (1×)</option>
                <option value="Dry Wash" data-multiplier="1.5" ${item.service_type === 'Dry Wash' ? 'selected' : ''}>✨ Dry Wash (1.5×)</option>
                <option value="All Services" data-multiplier="2" ${item.service_type === 'All Services' ? 'selected' : ''}>⭐ All Services (2×)</option>
            </select>
            <input type="number" class="cloth-quantity" min="1" value="${item.quantity}" onchange="updateOrderSummary()" required>
            <button type="button" onclick="removeClothItem(this)" class="btn-remove" title="Remove">🗑️</button>`;
        container.appendChild(div);
    });

    updateOrderSummary();
    showToast('🔁 Items pre-filled from previous order!', 'info');
}

// ══════════════════════════════════════════════
// Init new features on load
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    loadDarkModePreference();
});

// Patch order form submit to trigger confetti + toast
document.addEventListener('DOMContentLoaded', () => {
    // We patch after the main setupForms runs
    setTimeout(() => {
        const orderForm = document.getElementById('orderForm');
        if (!orderForm) return;
        const origSubmit = orderForm.onsubmit;
        orderForm._confettiPatched = true;
    }, 500);
});
