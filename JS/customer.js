const API_BASE = 'http://localhost:8080';
const KEY_CUSTOMER_ORDERS = 'ws_customer_order_ids';

const fallbackMenu = [
    {
        id: 1,
        name: 'Americano',
        regularPrice: 1.50,
        largePrice: 2.00,
        supportsMilk: false,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop'
    },
    {
        id: 2,
        name: 'Americano with milk',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop'
    },
    {
        id: 3,
        name: 'Latte',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop'
    },
    {
        id: 4,
        name: 'Cappuccino',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop'
    },
    {
        id: 5,
        name: 'Hot Chocolate',
        regularPrice: 2.00,
        largePrice: 2.50,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&h=200&fit=crop'
    },
    {
        id: 6,
        name: 'Mocha',
        regularPrice: 2.50,
        largePrice: 3.00,
        supportsMilk: true,
        supportsSugar: true,
        supportsLarge: true,
        img: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=300&h=200&fit=crop'
    },
    {
        id: 7,
        name: 'Mineral Water',
        regularPrice: 1.00,
        largePrice: null,
        supportsMilk: false,
        supportsSugar: false,
        supportsLarge: false,
        img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=200&fit=crop'
    }
];

let menu = [...fallbackMenu];
let state = {
    bag: [],
    curr: null,
    q: 1,
    bp: 0,
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
      <div style="font-weight:700;font-size:14px;">${item.name}</div>
      <div style="font-size:13px;font-weight:bold;">£${Number(item.regularPrice).toFixed(2)}</div>
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
    <div style="padding:20px;display:flex;flex-wrap:wrap;gap:20px;">
      <div style="width:45%;min-width:150px;max-width:220px;aspect-ratio:1/1;border-radius:14px;overflow:hidden;flex-shrink:0;">
        <img src="${state.curr.img}" style="width:100%;height:100%;object-fit:cover;">
      </div>

      <div style="flex:1;min-width:250px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 id="d-name" style="margin:0;font-size:22px;">${state.curr.name}</h2>
          <span id="d-price" style="font-size:20px;font-weight:900;">£${state.bp.toFixed(2)}</span>
        </div>

        ${milkOptionsHtml}
        ${sugarOptionsHtml}
        ${sizeOptionsHtml}
      </div>

      <div style="width:100%;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:15px;border-top:1px solid #eee;">
          <span style="font-weight:800;">Pickup time</span>
          <input type="time" id="p-time" style="border:1px solid #eee;padding:6px;border-radius:8px;">
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px;">
          <span style="font-weight:800;">Quantity</span>
          <div style="display:flex;gap:15px;align-items:center;">
            <button onclick="qty(-1)" style="width:32px;height:32px;border:2px solid #000;border-radius:50%;background:#fff;">-</button>
            <span id="q-val" style="font-size:18px;font-weight:900;">1</span>
            <button onclick="qty(1)" style="width:32px;height:32px;border:2px solid #000;border-radius:50%;background:#fff;">+</button>
          </div>
        </div>

        <button class="btn-black" onclick="addBag()" style="margin-top:20px;width:100%;">Add to bag</button>
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
        const pickTime = document.getElementById('p-time')?.value;

        if (!pickTime) {
            alert('Please choose a pickup time.');
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
            pickTime
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
    const totalPrice = state.bag.reduce((sum, item) => sum + item.p * item.q, 0).toFixed(2);
    payBar.innerHTML = `
    <div style="flex:1;"><b>${totalQty} items</b> <span style="font-size:12px;color:#888;">£${totalPrice}</span></div>
    <div style="display:flex;gap:10px;">
      <button onclick="openCart()" style="background:#fff;color:#000;border:1px solid #000;padding:8px 15px;border-radius:12px;font-weight:700;cursor:pointer;">View Cart</button>
      <button onclick="checkout()" style="background:#fff;color:#000;border:1px solid #000;padding:8px 15px;border-radius:12px;font-weight:700;cursor:pointer;">Checkout</button>
    </div>`;
}

function openCart() {
    if (state.bag.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    const existing = document.getElementById('cart-modal');
    if (existing) existing.remove();

    const totalPrice = state.bag.reduce((sum, item) => sum + item.p * item.q, 0).toFixed(2);
    const cartModal = document.createElement('div');
    cartModal.id = 'cart-modal';
    cartModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:998;display:flex;justify-content:center;align-items:center;';
    cartModal.innerHTML = `
    <div style="background:#fff;width:90%;max-width:500px;border-radius:20px;padding:25px;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;font-weight:800;">Your Cart</h3>
        <button onclick="closeCart()" style="background:none;border:none;font-size:20px;cursor:pointer;">×</button>
      </div>
      ${state.bag.map((item, idx) => `
        <div style="display:flex;justify-content:space-between;padding:15px 0;border-bottom:1px solid #eee;">
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">${item.name}</div>
<div style="font-size:12px;color:#888;">
    ${[
        item.size,
        item.milk,
        item.sugar,
        `pickup ${item.pickTime}`
    ].filter(Boolean).join(' | ')}
</div>            <div style="font-size:13px;font-weight:bold;margin-top:5px;">£${item.p.toFixed(2)}/item</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button onclick="updateCartQty(${idx}, -1)">-</button>
            <span>${item.q}</span>
            <button onclick="updateCartQty(${idx}, 1)">+</button>
            <button onclick="removeCartItem(${idx})" style="color:#ff3b30;background:none;border:none;cursor:pointer;">Remove</button>
          </div>
        </div>`).join('')}
      <div style="margin-top:20px;padding-top:20px;border-top:2px solid #000;">
  <div style="display:flex;justify-content:space-between;font-weight:800;font-size:18px;margin-bottom:15px;">
    <span>Total</span><span>£${totalPrice}</span>
  </div>

<button 
    onclick="openCheckoutModal()" 
    class="btn-black" 
    style="margin-bottom:10px;">Checkout</button></div>
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

    const totalPrice = state.bag.reduce((sum, item) => sum + item.p * item.q, 0).toFixed(2);

    const checkoutModal = document.createElement('div');
    checkoutModal.id = 'checkout-modal';
    checkoutModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    checkoutModal.innerHTML = `
        <div style="
            background: #fff;
            width: 90%;
            max-width: 480px;
            border-radius: 24px;
            padding: 26px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h2 style="margin:0;font-size:22px;">Checkout</h2>
                    <p style="margin:6px 0 0;color:#777;font-size:13px;">Confirm your details and payment method.</p>
                </div>
                <button onclick="closeCheckoutModal()" style="
                    background:none;
                    border:none;
                    font-size:24px;
                    cursor:pointer;
                ">×</button>
            </div>

            <div style="margin-bottom:18px;">
                <label class="config-label">Customer name</label>
                <input
                    id="checkout-name"
                    type="text"
                    placeholder="Enter your name"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #eee;
                        border-radius:12px;
                        font-size:14px;
                        outline:none;
                    "
                >
            </div>

            <div style="margin-bottom:18px;">
                <label class="config-label">Email address</label>
                <input
                    id="checkout-email"
                    type="email"
                    placeholder="Enter your email"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #eee;
                        border-radius:12px;
                        font-size:14px;
                        outline:none;
                    "
                >
            </div>

            <div style="margin-bottom:20px;">
                <label class="config-label">Payment method</label>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
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

            <div style="
                background:#f8f8f8;
                border-radius:16px;
                padding:14px;
                margin-bottom:20px;
            ">
                <div style="display:flex;justify-content:space-between;font-weight:800;font-size:18px;">
                    <span>Total</span>
                    <span>£${totalPrice}</span>
                </div>
                <div style="font-size:12px;color:#777;margin-top:6px;">
                    ${state.bag.length} item${state.bag.length === 1 ? '' : 's'} in your order
                </div>
            </div>

            <button onclick="checkout()" class="btn-black" style="width:100%;margin-bottom:10px;">
                Place order
            </button>

            <button onclick="closeCheckoutModal()" class="btn-ghost" style="
                width:100%;
                padding:12px;
                border-radius:14px;
                border:1px solid #eee;
                background:#fff;
                font-weight:700;
                cursor:pointer;
            ">
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

function buildPickupDateTime(timeValue) {
    const now = new Date();
    const [hours, minutes] = timeValue.split(':').map(Number);
    const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    if (pickup < now) pickup.setDate(pickup.getDate() + 1);

    const yyyy = pickup.getFullYear();
    const mm = String(pickup.getMonth() + 1).padStart(2, '0');
    const dd = String(pickup.getDate()).padStart(2, '0');
    const hh = String(pickup.getHours()).padStart(2, '0');
    const min = String(pickup.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

async function checkout() {
    if (state.bag.length === 0) {
        alert('Shopping bag is empty.');
        return;
    }

    const customerName = document.getElementById('checkout-name')?.value.trim();
    const customerEmail = document.getElementById('checkout-email')?.value.trim();

    if (!customerName) {
        alert('Please enter your name.');
        return;
    }

    if (!customerEmail) {
        alert('Please enter your email address.');
        return;
    }

    const orderPayload = {
        customerName,
        customerEmail,
        pickupTime: buildPickupDateTime(state.bag[0].pickTime),
        paymentMethod: state.paymentMethod,
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

        alert(`Order placed successfully. Order #${savedOrder.id}`);
        navTo('pg-record');

    } catch (error) {
        console.error(error);
        alert(`Could not place order: ${error.message}`);
    }
}

function login() {
    const account = document.getElementById('u-acc')?.value.trim();
    const password = document.getElementById('u-pwd')?.value.trim();
    if (!account || !password) {
        alert('Username and password cannot be empty.');
        return;
    }
    state.isLogin = true;
    document.getElementById('login-ui').style.display = 'none';
    document.getElementById('member-ui').style.display = 'block';
    refreshCustomerOrders();
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
        return `<div style="font-size:12px;padding:2px 0;">${name} ×${item.quantity} | ${item.size} | £${lineTotal}</div>`;
    }).join('');

    return `
    <div style="background:#fff;padding:12px;border-radius:8px;margin:8px 0;border:1px solid #eee;color:#000;">
      <div style="display:flex;justify-content:space-between;font-weight:bold;">
        <span>Order #${order.id}</span>
        <span>${statusText[order.status] || order.status}</span>
      </div>
      <div style="font-size:12px;color:#888;margin:4px 0;">Pickup: ${formatDateTime(order.pickupTime)}</div>
      ${items}
      <div style="text-align:right;font-weight:bold;margin-top:4px;">Total: £${Number(order.totalCost || 0).toFixed(2)}</div>
    </div>`;
}

function openOrderModal(index) {
    const order = state.history[state.history.length - 1 - index];
    if (!order) return;
    document.getElementById('modalItems').innerHTML = (order.items || []).map(item => `
    <div style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
      <div style="display:flex;justify-content:space-between;">
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
      <div style="font-weight:800;margin-bottom:6px;">Next trains at Cramlington</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
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
        return '<div style="color:#777;margin-top:6px;">Live train information is currently unavailable.</div>';
    }

    return trains.slice(0, 3).map(train => {
        const route = type === 'arrival' ? `From ${train.origin || 'Unknown'}` : `To ${train.destination || 'Unknown'}`;
        const platform = train.platform ? `Platform ${train.platform}` : 'Platform TBC';
        return `
      <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">
        <b>${train.scheduledTime || '--:--'}</b> ${route}<br>
        <span style="color:#777;">${train.estimatedTime || 'Unknown'} · ${platform}</span>
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

updateTime();
loadMenu();
refreshCustomerOrders();
loadTrainBoard();
setInterval(updateTime, 60000);
setInterval(refreshCustomerOrders, 10000);
setInterval(loadTrainBoard, 60000);