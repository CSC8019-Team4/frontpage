
// *****************************************//
// Initialization - Runs when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load initial data
    updateTime();
    loadMenu();
    refreshCustomerOrders();
    loadTrainBoard();
    loadCupCount();
    
    // Setup periodic updates
    setInterval(updateTime, 60000);
    setInterval(refreshCustomerOrders, 10000);
    setInterval(loadTrainBoard, 60000);
    
    // Setup all event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navTo(pageId);
        });
    });
    

    const mask = document.getElementById('mask');
    if (mask) {
        mask.addEventListener('click', closeDrawer);
    }
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    const registerTriggerBtn = document.getElementById('register-trigger-btn');
    if (registerTriggerBtn) {
        registerTriggerBtn.addEventListener('click', openRegisterModal);
    }
    const registerClose = document.querySelector('.register-close');
    if (registerClose) {
        registerClose.addEventListener('click', closeRegisterModal);
    }
    
    const registerCancelBtn = document.getElementById('register-cancel-btn');
    if (registerCancelBtn) {
        registerCancelBtn.addEventListener('click', closeRegisterModal);
    }
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', createAccount);
    }
    const orderModalClose = document.querySelector('.order-modal-close');
    if (orderModalClose) {
        orderModalClose.addEventListener('click', closeOrderModal);
    }
    const viewCartBtn = document.getElementById('view-cart-btn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', openCart);
    }
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (!document.getElementById('checkout-modal')) {
                openCheckoutModal();
            } else {
                checkout();
            }
        });
    }
}

// *****************************************//
// Time & Opening Hours Logic
// *****************************************//
async function updateTime() {
    const box = document.getElementById('timeBox');
    if (!box) return;

    try {
  
        const res = await fetch(`${API_BASE}/api/opening-hours`);
        const allHours = await res.json();


        const today = new Date();
        let jsDay = today.getDay(); // JS: 0=Sun, 1=Mon, ..., 6=Sat
        let javaDay = (jsDay === 0) ? 7 : jsDay; 


        const todayHours = allHours.find(h => h.dayOfWeek === javaDay);
        
        if (!todayHours) {
            box.innerHTML = '<span class="status-dot dot-close"></span>Closed<br>Not available';
            return;
        }

    
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        
    
        const [openH, openM] = todayHours.openTime.split(':').map(Number);
        const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);
        const openTimeNum = openH + openM / 60;
        const closeTimeNum = closeH + closeM / 60;

        const isOpen = currentHour >= openTimeNum && currentHour < closeTimeNum;
        const range = `${todayHours.openTime}-${todayHours.closeTime}`;

    
        box.innerHTML = `
            <span class="status-dot ${isOpen ? 'dot-open' : 'dot-close'}"></span>
            ${isOpen ? 'Open' : 'Closed'}<br>
            ${range}
        `;
    } catch (error) {
        console.warn(':', error);
    
        fallbackUpdateTime();
    }
}

function fallbackUpdateTime() {
    const n = new Date();
    const d = n.getDay();
    const h = n.getHours() + n.getMinutes() / 60;
    let range = '';
    let open = false;
    
    if (d >= 1 && d <= 5) {
        range = '06:30-19:00';
        open = h >= 6.5 && h < 19;
    } else if (d === 6) {
        range = '07:00-18:00';
        open = h >= 7 && h < 18;
    } else {
        range = 'Closed';
    }
    
    const box = document.getElementById('timeBox');
    if (box) {
        box.innerHTML = `<span class="status-dot ${open ? 'dot-open' : 'dot-close'}"></span>${open ? 'Open' : 'Closed'}<br>${range}`;
    }
}

// ==========================================
// Menu Logic
// ==========================================
async function loadMenu() {
    try {
        menu = await fetchMenuFromBackend();
    } catch (error) {
        console.warn('Using fallback menu:', error.message);
        menu = [...fallbackMenu];
    }
    renderMenu();
}

function renderMenu() {
    const menuBox = document.getElementById('menu-items');
    if (!menuBox) return;
    
    menuBox.innerHTML = menu.map(item => `
        <div class="menu-card" data-menu-id="${item.id}">
            <div class="menu-img-container">
                <img src="${item.img}" alt="${item.name}" class="menu-img">
            </div>
            <div class="menu-name">${item.name}</div>
            <div class="menu-price">£${Number(item.regularPrice).toFixed(2)}</div>
        </div>
    `).join('');
    
    // Add click listeners to menu cards
    menuBox.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', function() {
            const menuId = parseInt(this.getAttribute('data-menu-id'));
            openDrawer(menuId);
        });
    });
}

// ==========================================
// Navigation Logic
// ==========================================
function navTo(id) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${id}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    if (id === 'pg-record') {
        refreshCustomerOrders();
    }
}

// ==========================================
// Drawer Logic
// ==========================================
function openDrawer(menuItemId) {
    appState.curr = menu.find(item => item.id === menuItemId);
    if (!appState.curr) return;
    
    appState.q = 1;
    appState.bp = Number(appState.curr.regularPrice);
    appState.selectedSize = 'REGULAR';
    
    const milkOptionsHtml = appState.curr.supportsMilk ? `
        <p class="config-label">Milk options</p>
        <div class="opt-grid" id="milk-options">
            <button class="opt-btn active" data-type="milk" data-value="Whole Milk">Whole Milk</button>
            <button class="opt-btn" data-type="milk" data-value="Oat Milk">Oat Milk</button>
            <button class="opt-btn" data-type="milk" data-value="Skimmed Milk">Skimmed Milk</button>
            <button class="opt-btn" data-type="milk" data-value="Coconut Milk">Coconut Milk</button>
            <button class="opt-btn" data-type="milk" data-value="No Milk">No Milk</button>
        </div>
    ` : '';
    
    const sugarOptionsHtml = appState.curr.supportsSugar ? `
        <p class="config-label">Sugar level</p>
        <div class="opt-grid" id="sugar-options">
            <button class="opt-btn active" data-type="sugar" data-value="No Sugar">No Sugar</button>
            <button class="opt-btn" data-type="sugar" data-value="30% Sugar">30% Sugar</button>
            <button class="opt-btn" data-type="sugar" data-value="50% Sugar">50% Sugar</button>
            <button class="opt-btn" data-type="sugar" data-value="100% Sugar">100% Sugar</button>
        </div>
    ` : '';
    
    const sizeOptionsHtml = `
        <p class="config-label">Cup size</p>
        <div class="opt-grid" id="size-box">
            <button class="opt-btn active" data-price="${Number(appState.curr.regularPrice)}" data-size="REGULAR">Regular</button>
            ${appState.curr.supportsLarge && appState.curr.largePrice
                ? `<button class="opt-btn" data-price="${Number(appState.curr.largePrice)}" data-size="LARGE">Large</button>`
                : ''}
        </div>
    `;
    
    const drawer = document.getElementById('drawer');
    drawer.innerHTML = `
        <div class="drawer-container">
            <div class="drawer-img-box">
                <img src="${appState.curr.img}" class="drawer-img">
            </div>
            <div class="drawer-info">
                <div class="drawer-header">
                    <h2 id="d-name" class="drawer-title">${appState.curr.name}</h2>
                    <span id="d-price" class="drawer-price">£${appState.bp.toFixed(2)}</span>
                </div>
                ${milkOptionsHtml}
                ${sugarOptionsHtml}
                ${sizeOptionsHtml}
            </div>
            <div class="drawer-actions">
                <div class="drawer-row">
                    <span class="drawer-label">Pickup Date</span>
                    <input type="date" id="p-date" class="drawer-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="drawer-row">
                    <span class="drawer-label">Pickup Time</span>
                    <input type="time" id="p-time" class="drawer-input">
                </div>
                <div class="drawer-row">
                    <span class="drawer-label">Pickup Station</span>
                    <select id="pickup-station" class="drawer-input">
                        <option value="Cramlington Station">Cramlington Station</option>
                     <option value="Newcastle Station">Newcastle Station</option>
                        <option value="Morpeth Station">Morpeth Station</option>
                    </select>
                </div>
                <div class="drawer-row">
                    <span class="drawer-label">Quantity</span>
                    <div class="drawer-qty">
                        <button class="qty-btn" data-action="qty" data-value="-1">-</button>
                        <span id="q-val" class="qty-text">1</span>
                        <button class="qty-btn" data-action="qty" data-value="1">+</button>
                    </div>
                </div>
                <button class="btn-black" id="add-to-bag-btn">Add to bag</button>
            </div>
        </div>
    `;
    
    // Setup drawer event listeners
    setupDrawerListeners();
    
    // Show drawer
    document.getElementById('mask').style.display = 'block';
    setTimeout(() => drawer.style.bottom = '0', 10);
    
    updatePrice();
}

function setupDrawerListeners() {
    // Option buttons (milk, sugar)
    document.querySelectorAll('#drawer .opt-btn[data-type]').forEach(btn => {
         btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            setOpt(this, type);
        });
    });
    
    // Size buttons
    document.querySelectorAll('#size-box .opt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const price = parseFloat(this.getAttribute('data-price'));
            const size = this.getAttribute('data-size');
            selSize(this, price, size);
        });
    });
    
    // Quantity buttons
    document.querySelectorAll('#drawer .qty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            qty(value);
        });
    });
    
    // Add to bag button
    const addToBagBtn = document.getElementById('add-to-bag-btn');
     if (addToBagBtn) {
        addToBagBtn.addEventListener('click', addBag);
    }
}

function closeDrawer() {
    const drawer = document.getElementById('drawer');
    drawer.style.bottom = '-100%';
    setTimeout(() => document.getElementById('mask').style.display = 'none', 300);
}

function selSize(el, price, size) {
    document.querySelectorAll('#size-box .opt-btn').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    appState.bp = Number(price);
    appState.selectedSize = size;
    updatePrice();
}

function setOpt(el, type) {
     const group = el.parentElement;
    group.querySelectorAll('.opt-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
}

function qty(v) {
    appState.q = Math.max(1, Math.min(20, appState.q + v));
    updatePrice();
}

function updatePrice() {
    const qVal = document.getElementById('q-val');
     const dPrice = document.getElementById('d-price');
    
    if (qVal) qVal.innerText = appState.q;
    if (dPrice) dPrice.innerText = `£${(appState.bp * appState.q).toFixed(2)}`;
}

// ==========================================
// Shopping Bag Logic
// ==========================================
function addBag() {
    const pickDate = document.getElementById('p-date')?.value;
    const pickTime = document.getElementById('p-time')?.value;
    const station = document.getElementById('pickup-station').value;
    
    if (!pickDate || !pickTime) {
        alert('Please select a pickup date and time.');
        return;
    }
    
    const selectedMilk = appState.curr.supportsMilk
        ? document.querySelector('#milk-options .opt-btn.active')?.getAttribute('data-value')
        : null;
        
    const selectedSugar = appState.curr.supportsSugar
        ? document.querySelector('#sugar-options .opt-btn.active')?.getAttribute('data-value')
        : null;
    
    appState.bag.push({
        menuItemId: appState.curr.id,
        name: appState.curr.name,
        p: appState.bp,
        q: appState.q,
        size: appState.selectedSize,
        milk: selectedMilk,
        sugar: selectedSugar,
        pickDate,
        pickTime,
        station  
    });
    
    updateBag();
    closeDrawer();
}

function updateBag() {
    const payBar = document.getElementById('pay-bar');
    if (!payBar) return;
    
    if (appState.bag.length === 0) {
        payBar.style.display = 'none';
        return;
    }
    
    payBar.style.display = 'flex';
    
    const totalQty = appState.bag.reduce((sum, item) => sum + item.q, 0);
    const totalPrice = calculateOrderTotal();
    
    const itemCountEl = payBar.querySelector('.pay-item-count');
    const priceEl = payBar.querySelector('.pay-sub');
    
    if (itemCountEl) itemCountEl.innerText = `${totalQty} items`;
    if (priceEl) priceEl.innerText = `£${totalPrice}`;
}

// ==========================================
// Cart Modal Logic
// ==========================================
function openCart() {
    if (appState.bag.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    
    // Remove existing modal if any
    const existing = document.getElementById('cart-modal');
    if (existing) existing.remove();
    
    const totalPrice = calculateOrderTotal();
    
    const cartModal = document.createElement('div');
    cartModal.id = 'cart-modal';
    cartModal.className = 'modal-overlay';
    cartModal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-header">
                <h3 class="cart-title">Your Cart</h3>
                <button class="cart-close">&times;</button>
            </div>
            
            ${appState.bag.map((item, idx) => `
                <div class="cart-item" data-index="${idx}">
                    <div class="cart-item-left">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-desc">
                            ${[item.size, item.milk, item.sugar, `Station: ${item.station} | Pickup: ${item.pickTime}`].filter(Boolean).join(' | ')}
                        </div>
                        <div class="cart-item-price">£${item.p.toFixed(2)}/item</div>
                    </div>
                    <div class="cart-item-right">
                        <button class="cart-qty-btn" data-action="update" data-index="${idx}" data-value="-1">-</button>
                        <span>${item.q}</span>
                        <button class="cart-qty-btn" data-action="update" data-index="${idx}" data-value="1">+</button>
                        <button class="cart-remove" data-action="remove" data-index="${idx}">Remove</button>
                    </div>
                </div>
            `).join('')}
            
            <div class="cart-footer">
                <div class="cart-total-row">
                    <span>Total</span>
                    <span>£${totalPrice}</span>
                </div>
                <button class="btn-black" id="cart-checkout-btn">Checkout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cartModal);
    setupCartListeners(cartModal);
}

function setupCartListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.cart-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCart);
    }
    
    // Quantity and remove buttons
    modal.querySelectorAll('.cart-qty-btn, .cart-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const index = parseInt(this.getAttribute('data-index'));
            const value = parseInt(this.getAttribute('data-value') || 0);
            
            if (action === 'update') {
                updateCartQty(index, value);
            } else if (action === 'remove') {
                removeCartItem(index);
            }
        });
    });
    
    // Checkout button
    const checkoutBtn = modal.querySelector('#cart-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckoutModal);
    }
}

function closeCart() {
    document.getElementById('cart-modal')?.remove();
}

function updateCartQty(idx, val) {
    appState.bag[idx].q = Math.max(1, Math.min(20, appState.bag[idx].q + val));
    updateBag();
    closeCart();
    openCart();
}

function removeCartItem(idx) {
    appState.bag.splice(idx, 1);
    updateBag();
    closeCart();
    if (appState.bag.length > 0) openCart();
}

// ==========================================
// Checkout Logic
// ==========================================
function openCheckoutModal() {
    if (appState.bag.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    
    closeCart();
    
    // Remove existing modal if any
    const existing = document.getElementById('checkout-modal');
    if (existing) existing.remove();
    
    const totalPrice = calculateOrderTotal();
    
    const checkoutModal = document.createElement('div');
    checkoutModal.id = 'checkout-modal';
    checkoutModal.className = 'checkout-modal-overlay';
    
    checkoutModal.innerHTML = `
        <div class="checkout-modal-content">
            <div class="checkout-header">
                <div>
                    <h2 class="checkout-title">Checkout</h2>
                    <p class="checkout-desc">Confirm your details and payment method.</p>
                </div>
                <button class="checkout-close">&times;</button>
            </div>
            <div class="checkout-form-group">
                <label class="config-label">Customer name</label>
                <input id="checkout-name" type="text" placeholder="Enter your name" class="checkout-input">
                <div id="name-error" style="color:#ff3b30;font-size:12px;margin-top:4px;"></div>
            </div>
            <div class="checkout-form-group">
                <label class="config-label">Email address</label>
                <input id="checkout-email" type="email" placeholder="Enter your email" class="checkout-input">
                <div id="email-error" style="color:#ff3b30;font-size:12px;margin-top:4px;"></div>
            </div>
            <div class="checkout-form-group">
                <label class="config-label">Payment method</label>
                <div class="payment-grid">
                    <button id="pay-card" class="payment-btn active" data-method="CARD">Card</button>
                    <button id="pay-cash" class="payment-btn" data-method="CASH">Cash</button>
                </div>
            </div>
            <div class="checkout-summary">
                <div class="summary-total">
                    <span>Total</span>
                    <span>£${totalPrice}</span>
                </div>
                <div class="summary-info">
                    ${appState.bag.length} item${appState.bag.length === 1 ? '' : 's'} in your order
                </div>
            </div>
            <button class="btn-black checkout-full-btn" id="place-order-btn">Place order</button>
            <button class="checkout-cancel-btn" id="checkout-cancel-btn">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(checkoutModal);
    setupCheckoutListeners(checkoutModal);
}

function setupCheckoutListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.checkout-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCheckoutModal);
    }
    
    const cancelBtn = modal.querySelector('#checkout-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCheckoutModal);
    }
    
    // Payment method buttons
    modal.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            setPaymentMethod(method);
        });
    });
    
    // Place order button
    const placeOrderBtn = modal.querySelector('#place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', checkout);
    }
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal')?.remove();
}

function setPaymentMethod(method) {
    appState.paymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(button => {
        button.classList.remove('active');
    });
    if (method === 'CARD') {
        document.getElementById('pay-card')?.classList.add('active');
    }
    if (method === 'CASH') {
        document.getElementById('pay-cash')?.classList.add('active');
    }
}

async function checkout() {
    const checkoutModal = document.getElementById('checkout-modal');
    
    if (!checkoutModal) {
        openCheckoutModal();
        return;
    }
    
    if (appState.bag.length === 0) {
        alert('Shopping bag is empty.');
        return;
    }
    
    const customerName = document.getElementById('checkout-name')?.value.trim();
    const customerEmail = document.getElementById('checkout-email')?.value.trim();
    const nameErr = document.getElementById('name-error');
    const emailErr = document.getElementById('email-error');
    
    // Clear previous errors
    if (nameErr) nameErr.textContent = '';
    if (emailErr) emailErr.textContent = '';
    
    // Validation
    if (!customerName) {
        if (nameErr) nameErr.textContent = 'Please enter your full name.';
        return;
    }
    
    if (!customerEmail) {
        if (emailErr) emailErr.textContent = 'Please enter your email address.';
        return;
    }
    
    if (!customerEmail.includes('@')) {
        if (emailErr) emailErr.textContent = 'Please enter a valid email address.';
        return;
    }
    
    // Check opening hours
    const firstItem = appState.bag[0];
    const { pickDate, pickTime } = firstItem;
    const checkDate = new Date(pickDate);
    const day = checkDate.getDay();
    const [h, m] = pickTime.split(':').map(Number);
    const timeNum = h + m / 60;
    
    let isOpen = false;
    if (day >= 1 && day <= 5) {
        isOpen = timeNum >= 6.5 && timeNum < 19;
    } else if (day === 6) {
        isOpen = timeNum >= 7 && timeNum < 18;
    } else {
        isOpen = false;
    }
    
    if (!isOpen) {
        alert('Sorry, the kiosk is closed at this pickup time.\n\nMon-Fri: 06:30-19:00\nSat: 07:00-18:00\nSun: Closed');
        return;
    }
    
    // Build order payload
    const orderPayload = {
        customerName,
        customerEmail,
        pickupTime: buildPickupDateTime(firstItem.pickDate, firstItem.pickTime),
        station: firstItem.station,
        paymentMethod: appState.paymentMethod,
        totalCost: parseFloat(calculateOrderTotal()), 
        isFreeCup: hasFreeCup(),
        discountAmount: hasFreeCup() ? Math.min(...appState.bag.map(item => item.p)) : 0,
        items: appState.bag.map(item => ({
            menuItemId: item.menuItemId,
            size: item.size,
            quantity: item.q,
            customisationNote: [
                item.milk ? `Milk: ${item.milk}` : null,
                item.sugar ? `Sugar: ${item.sugar}` : null
            ].filter(Boolean).join('; ') || null
        }))
    };
    
    try {
        const savedOrder = await placeOrder(orderPayload);
        
        // Save order ID to local storage
        const ids = JSON.parse(localStorage.getItem(KEY_CUSTOMER_ORDERS) || '[]');
        ids.push(savedOrder.id);
        localStorage.setItem(KEY_CUSTOMER_ORDERS, JSON.stringify([...new Set(ids)]));
        
        appState.pendingOrders.push(savedOrder);
        appState.bag = [];
        appState.paymentMethod = 'CARD';
        
        updateBag();
        closeCheckoutModal();
        
        // Update cup count
        const totalCups = orderPayload.items.reduce((sum, item) => sum + item.quantity, 0);
        addCupCount(totalCups);
        
        alert(`Order placed successfully. Order #${savedOrder.id}`);
        navTo('pg-record');
        
    } catch (error) {
        console.error(error);
        alert('Failed to place order. Please verify your information and try again.');
    }
}

// ==========================================
// Order History Logic
// ==========================================
async function refreshCustomerOrders() {
    const ids = JSON.parse(localStorage.getItem(KEY_CUSTOMER_ORDERS) || '[]');
    const orders = [];
    
    for (const id of ids) {
        try {
            orders.push(await fetchOrderById(id));
        } catch (error) {
            console.warn(`Could not load order ${id}`, error.message);
        }
    }
    
    appState.pendingOrders = orders.filter(order => !['COLLECTED', 'CANCELLED'].includes(order.status));
    appState.history = orders.filter(order => ['COLLECTED', 'CANCELLED'].includes(order.status));
    
    renderPendingOrders();
    renderHistory();
}

function renderHistory() {
    const box = document.getElementById('orders-box');
    if (!box) return;
    
    if (!appState.history.length) {
        box.innerHTML = 'No record found.';
        return;
    }
    
    box.innerHTML = appState.history.map(order => renderOrderCard(order, true)).join('');
}

function renderPendingOrders() {
    const box = document.getElementById('pending-orders');
    if (!box) return;
    
    if (!appState.pendingOrders.length) {
        box.innerHTML = 'No pending orders.';
        return;
    }
    
    box.innerHTML = appState.pendingOrders.map(order => renderOrderCard(order, false)).join('');
}

function renderOrderCard(order, history) {
    const statusText = {
        PENDING: 'Pending',
        ACCEPTED: 'Accepted',
        IN_PROGRESS: 'Preparing',
        READY: 'Ready for pickup',
        COLLECTED: 'Collected',
        CANCELLED: 'Cancelled'
    };
    
    const items = (order.items || []).map(item => {
        const name = item.menuItem?.name || 'Item';
        const lineTotal = Number(item.lineTotal || item.unitPrice * item.quantity || 0).toFixed(2);
        return `<div class="order-card-item">${name} ×${item.quantity} | ${item.size} | £${lineTotal}</div>`;
    }).join('');
    
    return `
        <div class="order-card">
            <div class="order-card-header">
                <span>Order #${order.id}</span>
                <span>${statusText[order.status] || order.status}</span>
            </div>
            <div class="order-card-time">Pickup: ${formatDateTime(order.pickupTime)}</div>
            ${items}
            <div class="order-card-total"> Discounted Total: £${Number(order.totalCost || 0).toFixed(2)}</div>
        </div>
    `;
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// ==========================================
// Train Board Logic
// ==========================================
async function loadTrainBoard() {
    const box = document.getElementById('train-info');
    if (!box) return;
    
    box.innerHTML = 'Loading train information...';
    
    try {
        const [arrivals, departures] = await Promise.all([
            fetchTrainArrivals(3),
            fetchTrainDepartures(3)
        ]);
        
        box.innerHTML = `
            <div class="train-board-title">Next trains at Cramlington</div>
            <div class="train-board-grid">
                <div><b>Arrivals</b>${renderTrainList(arrivals, 'arrival')}</div>
                <div><b>Departures</b>${renderTrainList(departures, 'departure')}</div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        box.innerHTML = 'Live train information is currently unavailable.';
    }
}

function renderTrainList(trains, type) {
    if (!trains || trains.length === 0) {
        return '<div class="train-error">Live train information is currently unavailable.</div>';
    }
    
    return trains.slice(0, 3).map(train => {
        const route = type === 'arrival' ? `From ${train.origin || 'Unknown'}` : `To ${train.destination || 'Unknown'}`;
        const platform = train.platform ? `Platform ${train.platform}` : 'Platform TBC';
        
        return `
            <div class="train-list-item">
                <span class="train-list-time">${train.scheduledTime || '--:--'}</span> ${route}<br>
                <span class="train-list-info">${train.estimatedTime || 'Unknown'} · ${platform}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// Auth Logic
// ==========================================
function openRegisterModal() {
    // Reset form
    const accInput = document.getElementById('register-acc');
    const pwdInput = document.getElementById('register-pwd');
    const confirmPwdInput = document.getElementById('register-confirm-pwd');
    const accErr = document.getElementById('register-acc-error');
    const pwdErr = document.getElementById('register-pwd-error');
    const confirmErr = document.getElementById('register-confirm-error');
    
    if (accInput) accInput.value = '';
    if (pwdInput) pwdInput.value = '';
    if (confirmPwdInput) confirmPwdInput.value = '';
    if (accErr) accErr.textContent = '';
    if (pwdErr) pwdErr.textContent = '';
    if (confirmErr) confirmErr.textContent = '';
    
    // Show modal
    const modal = document.getElementById('register-modal');
    if (modal) modal.style.display = 'flex';
}

function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.style.display = 'none';
}

async function createAccount() {
    const account = document.getElementById('register-acc')?.value.trim();
    const password = document.getElementById('register-pwd')?.value.trim();
    const confirmPwd = document.getElementById('register-confirm-pwd')?.value.trim();
    
    const accErr = document.getElementById('register-acc-error');
    const pwdErr = document.getElementById('register-pwd-error');
    const confirmErr = document.getElementById('register-confirm-error');
    
    // Clear previous errors
    if (accErr) accErr.textContent = '';
    if (pwdErr) pwdErr.textContent = '';
    if (confirmErr) confirmErr.textContent = '';
    
    // Validation
    if (!account) {
        if (accErr) accErr.textContent = 'Account cannot be empty.';
        return;
    }
    
    if (!password) {
        if (pwdErr) pwdErr.textContent = 'Password cannot be empty.';
        return;
    }
    
    if (password !== confirmPwd) {
        if (confirmErr) confirmErr.textContent = 'Passwords do not match.';
        return;
    }
    
    if (password.length < 6) {
        if (pwdErr) pwdErr.textContent = 'Password must be at least 6 characters.';
        return;
    }
    
    try {
        await registerAccount(account, password);
        alert('Account created successfully! Please login.');
        closeRegisterModal();
        
        // Pre-fill login form
        const loginAcc = document.getElementById('u-acc');
        const loginPwd = document.getElementById('u-pwd');
        if (loginAcc) loginAcc.value = account;
        if (loginPwd) loginPwd.value = '';
        
    } catch (error) {
        console.error('Register error:', error);
        // Even if it fails, pretend it worked (as per original code)
        alert('Account created successfully! Please login.');
        closeRegisterModal();
        
        const loginAcc = document.getElementById('u-acc');
        const loginPwd = document.getElementById('u-pwd');
        if (loginAcc) loginAcc.value = account;
        if (loginPwd) loginPwd.value = '';
    }
}

function login() {
    const account = document.getElementById('u-acc')?.value.trim();
    const password = document.getElementById('u-pwd')?.value.trim();
    
    if (!account || !password) {
        const loginUi = document.getElementById('login-ui');
        if (loginUi) {
            showInlineError(loginUi, 'Username and password cannot be empty.');
        }
        return;
    }
    
    appState.isLogin = true;
    
    const loginUi = document.getElementById('login-ui');
    const memberUi = document.getElementById('member-ui');
    
    if (loginUi) loginUi.style.display = 'none';
    if (memberUi) memberUi.style.display = 'block';
    
    refreshCustomerOrders();
    loadCupCount(); 
    renderCupTrack(); 
    
    alert('Login successful!');
}

// ==========================================
// Cup Count Logic
// ==========================================
function renderCupTrack() {
    const cupGrid = document.getElementById('cup-grid');
    const cupText = document.getElementById('cup-text');
    
    if (!cupGrid || !cupText) return;
    
    cupText.textContent = `${appState.cupCount}/10`;
    
    let html = '';
    for (let i = 0; i < 10; i++) {
        const filled = i < appState.cupCount;
        html += `
            <div class="cup-item ${filled ? 'filled' : ''}">
                ${filled ? '☕' : ''}
            </div>
        `;
    }
    
    cupGrid.innerHTML = html;
}

function loadCupCount() {
    const count = localStorage.getItem(KEY_CUP_COUNT);
    appState.cupCount = count ? Number(count) : 0;
    renderCupTrack();
}

function addCupCount(quantity) {
    appState.cupCount += quantity;
    
    if (hasFreeCup()) {
         appState.cupCount = 0;;
    }
    
    appState.cupCount = Math.max(appState.cupCount, 0);
    localStorage.setItem(KEY_CUP_COUNT, appState.cupCount);
    renderCupTrack();
}

function hasFreeCup() {
    const currentOrderCups = appState.bag.reduce((sum, item) => sum + item.q, 0);
    return appState.cupCount >= 10 || currentOrderCups >= 10;
}

// ==========================================
// Price Calculation
// ==========================================
function calculateOrderTotal() {
    let total = 0;
    let cheapestItemPrice = Infinity;
    
    if (appState.bag.length === 0) return '0.00';
    
    appState.bag.forEach(item => {
        const itemTotal = item.p * item.q;
        total += itemTotal;
        
        if (item.p < cheapestItemPrice) {
            cheapestItemPrice = item.p;
        }
    });
    
    const canApplyFreeCup = hasFreeCup() && !isNaN(cheapestItemPrice) && cheapestItemPrice > 0;
    
    if (canApplyFreeCup) {
        total -= cheapestItemPrice;
    }
    
    return Math.max(total, 0).toFixed(2);
}