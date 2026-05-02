const API_BASE = 'http://localhost:8080';
const KEY_CUSTOMER_ORDERS = 'ws_customer_order_ids';
const KEY_CUP_COUNT = 'ws_cup_count';
const FREE_CUP_THRESHOLD = 10;

function showInlineError(element, message) {
    const err = document.createElement('div');
    err.style.color = '#ff3b30';
    err.style.fontSize = '12px';
    err.style.margin = '4px 0';
    err.textContent = message;
    element.appendChild(err);
    setTimeout(() => err.remove(), 2500);
}

const fallbackMenu = [
    {
        id: 1,
        name: 'Americano',
        regularPrice: 1.50,
        largePrice: 2.00,
        supportsMilk: false,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://qcloud.dpfile.com/pc/ubxJ-VNoyN4uOfTBepm1tCeKrZ0UPsS5TWmMGkZvPbK86DRaYKVlOfP__9y-SpoC.jpg'
    },
    {
        id: 2,
        name: 'Americano with milk',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://miaobi-lite.bj.bcebos.com/miaobi/5mao/b%275ZKW5ZWh54mb5aW2XzE3MzU1MTIyNTMuMTMyNDI5OF8xNzM1NTEyMjUzLjUxNDA2OQ%3D%3D%27/1.png'
    },
    {
        id: 3,
        name: 'Latte',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://preview.qiantucdn.com/58pic/vj/HJ/QS/7A/7r1oqpv3yzd6h49xlm2ntisw0k8j5ucf_PIC2018.png!w1024_new_small_1'
    },
    {
        id: 4,
        name: 'Cappuccino',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://inews.gtimg.com/newsapp_bt/0/12407295198/1000.jpg'
    },
    {
        id: 5,
        name: 'Hot Chocolate',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://gips3.baidu.com/it/u=1743325701,3884706280&fm=3074&app=3074&f=JPEG'
    },
    {
        id: 6,
        name: 'Mocha',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://5b0988e595225.cdn.sohucs.com/a_auto,c_cut,x_2,y_0,w_825,h_550/images/20190129/bc09903321a640c581236122a1b7123c.jpeg'
    },
    {
        id: 7,
        name: 'Mineral Water',
        regularPrice: 1.00,
        largePrice: null,
        supportsMilk: false,
        supportsSugar: false,
        supportsLarge: false,
        img: 'https://pic.rmb.bdstatic.com/c61e5447d36ae72409dbefb59aedac28@h_1280'
    }
];

let menu = [...fallbackMenu];
let state = {
    bag: [],
    curr: null,
    q: 1,
    bp: 0,
    cupCount: 0,
    selectedSize: 'REGULAR',
    paymentMethod: 'CARD',
    pendingOrders: [],
    history: [],
    isLogin: false
};


async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${body}`);
    }
    return response.status === 204 ? null : response.json();
}

function updateTime() {
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

async function loadMenu() {
    try {
        const backendMenu = await apiFetch('/api/menu');
        menu = backendMenu.map(item => {
            const fallback = fallbackMenu.find(i =>
                i.name.toLowerCase() === String(item.name).toLowerCase()
            );

            return {
                id: item.id,
                name: item.name,
                regularPrice: Number(item.regularPrice),
                largePrice: item.largePrice == null ? null : Number(item.largePrice),
                supportsMilk: fallback?.supportsMilk ?? true,
                supportsSugar: fallback?.supportsSugar ?? true,
                supportsLarge: fallback?.supportsLarge ?? item.largePrice != null,
                img: imageForItem(item.name)
            };
        });
    } catch (error) {
        console.warn('Using fallback menu because backend menu failed:', error.message);
        menu = [...fallbackMenu];
    }
    renderMenu();
}

function imageForItem(name) {
    const fallback = fallbackMenu.find(i => i.name.toLowerCase() === String(name).toLowerCase());
    return fallback?.img || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop';
}

function renderMenu() {

    const menuBox = document.getElementById('menu-items');
    if (!menuBox) return;
    menuBox.innerHTML = menu.map(item => `
    <div class="menu-card" onclick="openDrawer(${item.id})">
      <div class="menu-img-container">
        <img src="${item.img}" alt="${item.name}" class="menu-img">
      </div>
      <div class="menu-name">${item.name}</div>
      <div class="menu-price">£${Number(item.regularPrice).toFixed(2)}</div>
    </div>
  `).join('');
}

function navTo(id) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (window.event?.currentTarget) window.event.currentTarget.classList.add('active');

    if (id === 'pg-record') {
        refreshCustomerOrders();
    }
}


function openDrawer(menuItemId) {
    state.curr = menu.find(item => item.id === menuItemId);
    if (!state.curr) return;
    state.q = 1;
    state.bp = Number(state.curr.regularPrice);
    state.selectedSize = 'REGULAR';
    const milkOptionsHtml = state.curr.supportsMilk ? `
        <p class="config-label">Milk options</p>
        <div class="opt-grid" id="milk-options">
          <button class="opt-btn active" onclick="setOpt(this,'milk')">Whole Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Oat Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Skimmed Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Coconut Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">No Milk</button>
        </div>
    ` : '';

 
    const sugarOptionsHtml = state.curr.supportsSugar ? `
        <p class="config-label">Sugar level</p>
        <div class="opt-grid" id="sugar-options">
          <button class="opt-btn active" onclick="setOpt(this,'sugar')">No Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">30% Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">50% Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">100% Sugar</button>
        </div>
    ` : '';


    const sizeOptionsHtml = `
        <p class="config-label">Cup size</p>
        <div class="opt-grid" id="size-box">
          <button class="opt-btn active" onclick="selSize(this, ${Number(state.curr.regularPrice)}, 'REGULAR')">Regular</button>
          ${state.curr.supportsLarge && state.curr.largePrice
        ? `<button class="opt-btn" onclick="selSize(this, ${Number(state.curr.largePrice)}, 'LARGE')">Large</button>`
        : ''}
        </div>
    `;

    const drawer = document.getElementById('drawer');
    drawer.innerHTML = `
    <div class="drawer-container">
      <div class="drawer-img-box">
        <img src="${state.curr.img}" class="drawer-img">
      </div>

      <div class="drawer-info">
        <div class="drawer-header">
          <h2 id="d-name" class="drawer-title">${state.curr.name}</h2>
          <span id="d-price" class="drawer-price">£${state.bp.toFixed(2)}</span>
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
            <button onclick="qty(-1)" class="qty-btn">-</button>
            <span id="q-val" class="qty-text">1</span>
            <button onclick="qty(1)" class="qty-btn">+</button>
          </div>
        </div>

        <button class="btn-black" onclick="addBag()">Add to bag</button>
      </div>
    </div>`;

    
    document.getElementById('mask').style.display = 'block';
    setTimeout(() => drawer.style.bottom = '0', 10);
    
    updatePrice();
}

function closeDrawer() {
    const drawer = document.getElementById('drawer');
    drawer.style.bottom = '-100%';
    setTimeout(() => document.getElementById('mask').style.display = 'none', 300);
}

function selSize(el, price, size) {
    document.querySelectorAll('#size-box .opt-btn').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    state.bp = Number(price);
    state.selectedSize = size;
    updatePrice();
}

function setOpt(el, type) {
    const group = el.parentElement;
    group.querySelectorAll('.opt-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
}

function qty(v) {
    state.q = Math.max(1, Math.min(20, state.q + v));
    updatePrice();
}

function updatePrice() {
    const qVal = document.getElementById('q-val');
    const dPrice = document.getElementById('d-price');
    if (qVal) qVal.innerText = state.q;
    if (dPrice) dPrice.innerText = `£${(state.bp * state.q).toFixed(2)}`;
}

function addBag() {
    const pickDate = document.getElementById('p-date')?.value;
    const pickTime = document.getElementById('p-time')?.value;
    const station = document.getElementById('pickup-station').value;

    if (!pickDate || !pickTime) {
        alert('Please select a pickup date and time.');
        return;
    }

    const selectedMilk = state.curr.supportsMilk
        ? document.querySelector('#milk-options .opt-btn.active')?.innerText
        : null;

    const selectedSugar = state.curr.supportsSugar
        ? document.querySelector('#sugar-options .opt-btn.active')?.innerText
        : null;

    state.bag.push({
        menuItemId: state.curr.id,
        name: state.curr.name,
        p: state.bp,
        q: state.q,
        size: state.selectedSize,
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

    if (state.bag.length === 0) {
        payBar.style.display = 'none';
        return;
    }

    payBar.style.display = 'flex';
    const totalQty = state.bag.reduce((sum, item) => sum + item.q, 0);
    const totalPrice = calculateOrderTotal();
    payBar.innerHTML = `
    <div class="pay-info">
        <b>${totalQty} items</b> 
        <span class="pay-sub">£${totalPrice}</span>
    </div>
    <div class="pay-buttons">
      <button onclick="openCart()" class="pay-btn">View Cart</button>
      <button onclick="checkout()" class="pay-btn">Checkout</button>
    </div>`;
}


function openCart() {
    if (state.bag.length === 0) {
        alert('Your cart is empty.');
        return;
    }
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
        <button onclick="closeCart()" class="cart-close">×</button>
      </div>
      
      ${state.bag.map((item, idx) => `
        <div class="cart-item">
          <div class="cart-item-left">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-desc">
                ${[item.size, item.milk, item.sugar, `Station: ${item.station} | Pickup: ${item.pickTime}`].filter(Boolean).join(' | ')}
            </div>
            <div class="cart-item-price">£${item.p.toFixed(2)}/item</div>
          </div>
          <div class="cart-item-right">
            <button onclick="updateCartQty(${idx}, -1)">-</button>
            <span>${item.q}</span>
            <button onclick="updateCartQty(${idx}, 1)">+</button>
            <button onclick="removeCartItem(${idx})" class="cart-remove">Remove</button>
          </div>
        </div>`).join('')}
      
      <div class="cart-footer">
        <div class="cart-total-row">
          <span>Total</span>
          <span>£${totalPrice}</span>
        </div>
        <button onclick="openCheckoutModal()" class="btn-black">Checkout</button>
      </div>
    </div>`;
    document.body.appendChild(cartModal);
}


function closeCart() {
    document.getElementById('cart-modal')?.remove();
}


function openCheckoutModal() {

    if (state.bag.length === 0) {
        alert('Your cart is empty.');
        return;
    }

 
    closeCart();

 
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
                <button onclick="closeCheckoutModal()" class="checkout-close">×</button>
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
                    <button
                        id="pay-card"
                        onclick="setPaymentMethod('CARD')"
                        class="payment-btn active"
                        type="button">
                        Card
                    </button>
                    <button
                        id="pay-cash"
                        onclick="setPaymentMethod('CASH')"
                        class="payment-btn"
                        type="button">
                        Cash
                    </button>
                </div>
            </div>

            <div class="checkout-summary">
                <div class="summary-total">
                    <span>Total</span>
                    <span>£${totalPrice}</span>
                </div>
                <div class="summary-info">
                    ${state.bag.length} item${state.bag.length === 1 ? '' : 's'} in your order
                </div>
            </div>

            <button onclick="checkout()" class="btn-black checkout-full-btn">
                Place order
            </button>

            <button onclick="closeCheckoutModal()" class="checkout-cancel-btn">
                Cancel
            </button>
        </div>
    `;
    document.body.appendChild(checkoutModal);
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal')?.remove();
}

function updateCartQty(idx, val) {
    state.bag[idx].q = Math.max(1, Math.min(20, state.bag[idx].q + val));
    updateBag();
    closeCart();
    openCart();
}

function removeCartItem(idx) {
    state.bag.splice(idx, 1);
    updateBag();
    closeCart();
    if (state.bag.length > 0) openCart();
}

function buildPickupDateTime(pickDate, pickTime) {
    if (!pickDate || !pickTime) return null;
    const [y, m, d] = pickDate.split('-').map(Number);
    const [hours, minutes] = pickTime.split(':').map(Number);
    const pickup = new Date(y, m - 1, d, hours, minutes);
    const yyyy = pickup.getFullYear();
    const mm = String(pickup.getMonth() + 1).padStart(2, '0');
    const dd = String(pickup.getDate()).padStart(2, '0');
    const hh = String(pickup.getHours()).padStart(2, '0');
    const min = String(pickup.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}


async function checkout() {
    if (!document.getElementById('checkout-modal')) {
        openCheckoutModal();
        return;
    }
    if (state.bag.length === 0) {
        alert('Shopping bag is empty.');
        return;
    }
    const customerName = document.getElementById('checkout-name')?.value.trim();
    const customerEmail = document.getElementById('checkout-email')?.value.trim();
    const nameErr = document.getElementById('name-error');
    const emailErr = document.getElementById('email-error');

    nameErr.textContent = '';
    emailErr.textContent = '';

    if (!customerName) {
        nameErr.textContent = 'Please enter your full name.';
        return;
    }
    if (!customerEmail) {
        emailErr.textContent = 'Please enter your email address.';
        return;
    }
    if (!customerEmail.includes('@')) {
        emailErr.textContent = 'Please enter a valid email address.';
        return;
    }
    const firstItem = state.bag[0];
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

  const orderPayload = {
    customerName,
    customerEmail,
    pickupTime: buildPickupDateTime(firstItem.pickDate, firstItem.pickTime),
    station: firstItem.station,
    paymentMethod: state.paymentMethod,
    totalCost: parseFloat(calculateOrderTotal()), 
    isFreeCup: hasFreeCup(),
    discountAmount: hasFreeCup() ? Math.min(...state.bag.map(item => item.p)) : 0,
    items: state.bag.map(item => ({
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
        const savedOrder = await apiFetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const ids = JSON.parse(localStorage.getItem(KEY_CUSTOMER_ORDERS) || '[]');
        ids.push(savedOrder.id);
        localStorage.setItem(KEY_CUSTOMER_ORDERS, JSON.stringify([...new Set(ids)]));

        state.pendingOrders.push(savedOrder);
        state.bag = [];
        state.paymentMethod = 'CARD';

        updateBag();
        closeCheckoutModal();

        const totalCups = orderPayload.items.reduce((sum, item) => sum + item.quantity, 0);
        addCupCount(totalCups);
        alert(`Order placed successfully. Order #${savedOrder.id}`);
        navTo('pg-record');

    } catch (error) {
        console.error(error);
        alert('Failed to place order. Please verify your information and try again.');
    }
}


async function refreshCustomerOrders() {
    const ids = JSON.parse(localStorage.getItem(KEY_CUSTOMER_ORDERS) || '[]');
    const orders = [];

    for (const id of ids) {
        try {
            orders.push(await apiFetch(`/api/orders/${id}`));
        } catch (error) {
            console.warn(`Could not load order ${id}`, error.message);
        }
    }

    state.pendingOrders = orders.filter(order => !['COLLECTED', 'CANCELLED'].includes(order.status));
    state.history = orders.filter(order => ['COLLECTED', 'CANCELLED'].includes(order.status));
    renderPendingOrders();
    renderHistory();
}

function setPaymentMethod(method) {
    state.paymentMethod = method;

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

function loadOrderData() {
    refreshCustomerOrders();
}

function renderHistory() {
    const box = document.getElementById('orders-box');
    if (!box) return;

    if (!state.history.length) {
        box.innerHTML = 'No record found.';
        return;
    }

    box.innerHTML = state.history.map(order => renderOrderCard(order, true)).join('');
}

function renderPendingOrders() {
    const box = document.getElementById('pending-orders');
    if (!box) return;

    if (!state.pendingOrders.length) {
        box.innerHTML = 'No pending orders.';
        return;
    }

    box.innerHTML = state.pendingOrders.map(order => renderOrderCard(order, false)).join('');
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
    </div>`;
}


function openOrderModal(index) {
    const order = state.history[state.history.length - 1 - index];
    if (!order) return;

    document.getElementById('modalItems').innerHTML = (order.items || []).map(item => `
    <div class="order-modal-item">
      <div class="order-modal-item-row">
        <span>${item.menuItem?.name || 'Item'} ×${item.quantity}</span>
        <span>£${Number(item.lineTotal || item.unitPrice * item.quantity || 0).toFixed(2)}</span>
      </div>
    </div>`).join('');
    document.getElementById('orderModal').style.display = 'flex';
}


function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}


async function loadTrainBoard() {
    const box = document.getElementById('train-info');
    if (!box) return;

    box.innerHTML = 'Loading train information...';
    try {
        const [arrivals, departures] = await Promise.all([
            apiFetch('/api/trains/arrivals?count=3'),
            apiFetch('/api/trains/departures?count=3')
        ]);
        box.innerHTML = `
      <div class="train-board-title">Next trains at Cramlington</div>
      <div class="train-board-grid">
        <div><b>Arrivals</b>${renderTrainList(arrivals, 'arrival')}</div>
        <div><b>Departures</b>${renderTrainList(departures, 'departure')}</div>
      </div>`;
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
      </div>`;
    }).join('');
}

function formatDateTime(value) {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function openRegisterModal() {
    
    document.getElementById('register-acc').value = '';
    document.getElementById('register-pwd').value = '';
    document.getElementById('register-confirm-pwd').value = '';
    document.getElementById('register-acc-error').textContent = '';
    document.getElementById('register-pwd-error').textContent = '';
    document.getElementById('register-confirm-error').textContent = '';
    

    document.getElementById('register-modal').style.display = 'flex';
}

function closeRegisterModal() {
    document.getElementById('register-modal').style.display = 'none';
}
async function createAccount() {
    const account = document.getElementById('register-acc').value.trim();
    const password = document.getElementById('register-pwd').value.trim();
    const confirmPwd = document.getElementById('register-confirm-pwd').value.trim();
    const accErr = document.getElementById('register-acc-error');
    const pwdErr = document.getElementById('register-pwd-error');
    const confirmErr = document.getElementById('register-confirm-error');
    accErr.textContent = '';
    pwdErr.textContent = '';
    confirmErr.textContent = '';
    if (!account) {
        accErr.textContent = 'Account cannot be empty.';
        return;
    }
    if (!password) {
        pwdErr.textContent = 'Password cannot be empty.';
        return;
    }
    if (password !== confirmPwd) {
        confirmErr.textContent = 'Passwords do not match.';
        return;
    }
    if (password.length < 6) {
        pwdErr.textContent = 'Password must be at least 6 characters.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password })
        });

        if (!response.ok) throw new Error('Registration failed');
        alert('Account created successfully! Please login.');
        closeRegisterModal();
        document.getElementById('u-acc').value = account;
        document.getElementById('u-pwd').value = '';

    } catch (error) {
        console.error('Register error:', error);
        alert('Account created successfully! Please login.');
        closeRegisterModal();
        document.getElementById('u-acc').value = account;
        document.getElementById('u-pwd').value = '';
    }
}
function login() {
    const account = document.getElementById('u-acc')?.value.trim();
    const password = document.getElementById('u-pwd')?.value.trim();
    
    if (!account || !password) {
        showInlineError(document.getElementById('login-ui'), 'Username and password cannot be empty.');
        return;
    }

    state.isLogin = true;
    document.getElementById('login-ui').style.display = 'none';
    document.getElementById('member-ui').style.display = 'block';
    refreshCustomerOrders();
    loadCupCount(); 
    renderCupTrack(); 

    alert('Login successful!');
}

function renderCupTrack() {
    const cupGrid = document.getElementById('cup-grid');
    const cupText = document.getElementById('cup-text');
    if (!cupGrid || !cupText) return;
    cupText.textContent = `${state.cupCount}/10`;
    let html = '';
    for (let i = 0; i < 10; i++) {
        const filled = i < state.cupCount;
        html += `
        <div class="cup-item ${filled ? 'filled' : ''}" 
             style="width:24px; height:24px; border-radius:50%; background:#f6f6f6; display:flex; align-items:center; justify-content:center; font-size:12px;">
            ${filled ? '☕' : ''}
        </div>`;
    }
    cupGrid.innerHTML = html;
    cupGrid.style.display = 'flex';
    cupGrid.style.gap = '8px';
    cupGrid.style.marginTop = '10px';
}


function loadCupCount() {
    const count = localStorage.getItem(KEY_CUP_COUNT);
    state.cupCount = count ? Number(count) : 0;
    renderCupTrack();
}

function addCupCount(quantity) {
    state.cupCount += quantity;
    if (hasFreeCup()) {
        state.cupCount -= 10;
    }
    state.cupCount = Math.max(state.cupCount, 0);
    localStorage.setItem(KEY_CUP_COUNT, state.cupCount);
    renderCupTrack();
}

function hasFreeCup() {
    const currentOrderCups = state.bag.reduce((sum, item) => sum + item.q, 0);
    return state.cupCount >= 10 || currentOrderCups >= 10;
}


function calculateOrderTotal() {
    let total = 0;
    let cheapestItemPrice = Infinity;
    if (state.bag.length === 0) return '0.00';
    
    state.bag.forEach(item => {
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
updateTime();
loadMenu();
refreshCustomerOrders();
loadTrainBoard();
loadCupCount();
setInterval(updateTime, 60000);
setInterval(refreshCustomerOrders, 10000);
setInterval(loadTrainBoard, 60000);