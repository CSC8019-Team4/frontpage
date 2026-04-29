const KEY_ORDERS = 'pendingOrders';
const KEY_HISTORY = 'ws_h';  
const menu = [
    { name: 'Americano', p1: 1.50, p2: 2.00, icon: 'fa-coffee', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop', id:1 },
    { name: 'Americano with milk', p1: 2.00, icon: 'fa-mug-hot', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop', id:2 },
    { name: 'Latte', p1: 2.50, p2: 3.00, icon: 'fa-droplet', img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop', id:3 },
    { name: 'Cappuccino', p1: 2.50, p2: 3.00, icon: 'fa-cloud', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop', id:4 },
    { name: 'Hot Chocolate', p1: 2.00, p2: 2.50, icon: 'fa-cookie', img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&h=200&fit=crop', id:5 },
    { name: 'Mocha', p1: 2.50, p2: 3.00, icon: 'fa-mug-hot', img: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=300&h=200&fit=crop', id:6 },
    { name: 'Mineral Water', p1: 1.00, p2: null, icon: 'fa-bottle-water', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=200&fit=crop', id:7 }
];

let state = {
    bag: [],
    curr: null,
    q: 1,
    bp: 0,
    pendingOrders: [],
    history: [],
    isLogin: false
};

function updateTime() {
    const n = new Date(), d = n.getDay(), h = n.getHours() + n.getMinutes()/60;
    let range = "", open = false;
    if(d >= 1 && d <= 5) { range = "06:30-19:00"; open = (h>=6.5 && h<19); }
    else if(d === 6) { range = "07:00-18:00"; open = (h>=7 && h<18); }
    else { range = "Closed"; }
    document.getElementById('timeBox').innerHTML = `<span class="status-dot ${open?'dot-open':'dot-close'}"></span>${open?'Open':'Closed'}<br>${range}`;
}

function renderMenu() {
    document.getElementById('menu-items').innerHTML = menu.map(i => `
        <div class="menu-card" onclick="openDrawer('${i.name}')">
            <div class="menu-img-container">
                <img src="${i.img}" alt="${i.name}" class="menu-img">
            </div>
            <div style="font-weight: 700; font-size: 14px;">${i.name}</div>
            <div style="font-size: 13px; font-weight: bold;">£${i.p1.toFixed(2)}</div>
        </div>
    `).join('');
}

function navTo(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(event?.currentTarget) event.currentTarget.classList.add('active');

    if (id === 'pg-record') {
        renderPendingOrders(); 
        renderHistory();      
    }
}

function openDrawer(name) {
    state.curr = menu.find(m => m.name === name);
    state.q = 1; 
    state.bp = state.curr.p1; 
    document.getElementById('drawer').innerHTML = `
    <div style="padding: 20px; display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="width: 45%; min-width: 150px; max-width: 220px; aspect-ratio: 1/1; border-radius: 14px; overflow: hidden; flex-shrink: 0;">
        <img src="${state.curr.img}" 
             style="width:100%; height:100%; object-fit:cover;"
             onclick="window.open('${state.curr.img}','_blank')">
      </div>
      <div style="flex: 1; min-width: 250px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h2 id="d-name" style="margin:0; font-size:22px;">${state.curr.name}</h2>
          <span id="d-price" style="font-size:20px; font-weight:900;">£${state.bp.toFixed(2)}</span>
        </div>

        <p class="config-label">MILK OPTIONS</p>
        <div class="opt-grid">
          <button class="opt-btn active" onclick="setOpt(this,'milk')">Whole Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Oat Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Skimmed Milk</button>
          <button class="opt-btn" onclick="setOpt(this,'milk')">Coconut Milk</button>
        </div>

        <p class="config-label">SUGAR LEVEL</p>
        <div class="opt-grid">
          <button class="opt-btn active" onclick="setOpt(this,'sugar')">No Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">30% Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">50% Sugar</button>
          <button class="opt-btn" onclick="setOpt(this,'sugar')">100% Sugar</button>
        </div>

        <p class="config-label">CUP SIZE</p>
        <div class="opt-grid" id="size-box">
          <button class="opt-btn active" onclick="selSize(this, ${state.curr.p1})">Regular</button>
          ${state.curr.p2 ? `<button class="opt-btn" onclick="selSize(this, ${state.curr.p2})">Large</button>` : ''}
        </div>
      </div>
      <div style="width:100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:15px; border-top:1px solid #eee;">
          <span style="font-weight:800;">Arrival Time</span>
          <input type="time" id="p-time" style="border:1px solid #eee; padding:6px; border-radius:8px;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
          <span style="font-weight:800;">Quantity</span>
          <div style="display:flex; gap:15px; align-items:center;">
            <button onclick="qty(-1)" style="width:32px; height:32px; border:2px solid #000; border-radius:50%; background:#fff;">-</button>
            <span id="q-val" style="font-size:18px; font-weight:900;">1</span>
            <button onclick="qty(1)" style="width:32px; height:32px; border:2px solid #000; border-radius:50%; background:#fff;">+</button>
          </div>
        </div>

        <button class="btn-black" onclick="addBag()" style="margin-top:20px; width:100%;">ADD TO BAG</button>
      </div>
    </div>
    `;

    document.getElementById('mask').style.display = 'block';
    setTimeout(() => document.getElementById('drawer').style.bottom = '0', 10);
    updatePrice();
}


function closeDrawer() { 
    document.getElementById('drawer').style.bottom = '-100%'; 
    setTimeout(() => {
        document.getElementById('mask').style.display = 'none';
    }, 300); 
}

function openCart() {
    if (state.bag.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    const cartModal = document.createElement('div');
    cartModal.id = 'cart-modal';
    cartModal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 998; display: flex;
        justify-content: center; align-items: center;
    `;

    let cartHtml = `
        <div style="background: #fff; width: 90%; max-width: 500px; border-radius: 20px; padding: 25px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-weight: 800;">Your Cart</h3>
                <button onclick="closeCart()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div id="cart-items">
    `;

    state.bag.forEach((item, idx) => {
        cartHtml += `
            <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 12px; color: #888;">${item.size} | ${item.milk} | ${item.sugar}</div>
                    <div style="font-size: 13px; font-weight: bold; margin-top: 5px;">£${item.p.toFixed(2)}/item</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="updateCartQty(${idx}, -1)" style="width: 30px; height: 30px; border: 1px solid #eee; border-radius: 50%; background: none; cursor: pointer;">-</button>
                    <span>${item.q}</span>
                    <button onclick="updateCartQty(${idx}, 1)" style="width: 30px; height: 30px; border: 1px solid #eee; border-radius: 50%; background: none; cursor: pointer;">+</button>
                    <button onclick="removeCartItem(${idx})" style="color: #ff3b30; background: none; border: none; cursor: pointer; font-size: 16px;">🗑</button>
                </div>
            </div>
        `;
    });
   
    const totalPrice = state.bag.reduce((sum, item) => sum + (item.p * item.q), 0).toFixed(2);
    cartHtml += `
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #000;">
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; margin-bottom: 15px;">
                    <span>Total</span>
                    <span>£${totalPrice}</span>
                </div>
                <button onclick="checkout(); closeCart()" class="btn-black" style="margin-bottom: 10px;">Checkout</button>
                <button onclick="closeCart()" class="btn-ghost">Cancel</button>
            </div>
        </div>
    `;
    cartModal.innerHTML = cartHtml;
    document.body.appendChild(cartModal);
}
function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.remove();
}
function updateCartQty(idx, val) {
    state.bag[idx].q = Math.max(1, state.bag[idx].q + val);
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
function selSize(el, price) {
    document.querySelectorAll('#size-box .opt-btn').forEach(item => {
        item.classList.remove('active');
    });
    el.classList.add('active');
    state.bp = price;
    updatePrice();
}

function setOpt(el, type) {
    document.querySelectorAll(`.opt-btn`).forEach(btn => {
        const btnType = btn.onclick.toString().includes('milk') ? 'milk' : 'sugar';
        if (btnType === type) {
            btn.classList.remove('active');
        }
    });
    el.classList.add('active');
}

function qty(v) { 
    state.q = Math.max(1, state.q + v); 
    updatePrice(); 
}

function updatePrice() { 
    document.getElementById('q-val').innerText = state.q;
    const total = (state.bp * state.q).toFixed(2);
    document.getElementById('d-price').innerText = `£${total}`;
}

function addBag() {
    const selectedMilk = document.querySelector('.opt-btn.active[onclick*="milk"]')?.innerText || "Whole Milk";
    const selectedSugar = document.querySelector('.opt-btn.active[onclick*="sugar"]')?.innerText || "No Sugar";
    const selectedSize = document.querySelector('#size-box .opt-btn.active')?.innerText || "Regular";
    const pickTime = document.getElementById('p-time')?.value || '';

    state.bag.push({ 
        name: state.curr.name, 
        p: state.bp, 
        q: state.q,
        milk: selectedMilk,
        sugar: selectedSugar,
        size: selectedSize,
        pickTime: pickTime,
        menuItemId: state.curr.id
    });

    updateBag();
    closeDrawer();
    alert(`${state.q} x ${state.curr.name} added to bag!`);
}

function updateBag() {
    const payBar = document.getElementById('pay-bar');
    if(state.bag.length > 0) {
        payBar.style.display = 'flex';
        const totalQty = state.bag.reduce((sum, item) => sum + item.q, 0);
        const totalPrice = state.bag.reduce((sum, item) => sum + (item.p * item.q), 0).toFixed(2);
        payBar.innerHTML = `
            <div style="flex: 1;">
                <span style="font-weight: 800;">${totalQty} items</span>
                <span style="font-size: 12px; color: #888; margin-left: 5px;">£${totalPrice}</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="openCart()" style="
                    background: #fff; color: #000; border: 1px solid #000;
                    padding: 8px 15px; border-radius: 12px; font-weight: 700;
                    cursor: pointer;
                ">View Cart</button>
                <button onclick="checkout()" style="
                    background: #fff; color: #000; border: 1px solid #000;
                    padding: 8px 15px; border-radius: 12px; font-weight: 700;
                    cursor: pointer;
                ">Checkout</button>
            </div>
        `;
    } else {
        payBar.style.display = 'none';
    }
}


function checkout() {
    if (!state.bag.length) {
        alert("Shopping bag is empty!");
        return;
    }
    const pickupTimeValue = document.getElementById('p-time')?.value || "";
    const now = new Date();
    const formattedTime = pickupTimeValue 
        ? `${now.toISOString().split('T')[0]}T${pickupTimeValue}:00`
        : now.toISOString();

    const orderPayload = {
        customerName: "Customer",
        customerEmail: "customer@test.com",
        pickupTime: formattedTime,
        items: state.bag.map(item => ({
            menuItemId: item.menuItemId,
            size: item.size.toUpperCase(),
            quantity: item.q
        }))
    };
    fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
    })
    .then(res => {
        if (!res.ok) throw new Error("Backend disconnected");
        return res.json();
    })
    .then(data => {
        alert("Order placed successfully!");
        state.bag = [];
        updateBag();
        navTo("pg-record");
    })
    .catch(err => {
        const mockOrder = {
            id: Date.now(),
            time: new Date().toLocaleString(),
            status: "PENDING",
            total: state.bag.reduce((a,b)=>a+(b.p*b.q),0),
            items: state.bag.map(i=>({name:i.name, quantity:i.q}))
        };
        state.pendingOrders = [mockOrder];
        state.history.push(mockOrder);
        state.bag = [];
        updateBag();
        navTo("pg-record");;
    });
}

function login() {
    const account = document.getElementById('u-acc').value.trim();
    const password = document.getElementById('u-pwd').value.trim();
    
    if(!account || !password) {
        alert('Username and password cannot be empty!');
        return;
    }

    state.isLogin = true;
    document.getElementById('login-ui').style.display = 'none';
    document.getElementById('member-ui').style.display = 'block';
    loadOrderData();
    alert(`Welcome back, ${account}!`);
}

function loadOrderData() {
    fetch("http://localhost:8080/api/orders/dashboard")
    .then(res => res.json())
    .then(data => {
        state.pendingOrders = data;
        renderPendingOrders();
    });

    fetch("http://localhost:8080/api/orders/archive")
    .then(res => res.json())
    .then(data => {
        state.history = data;
        renderHistory();
    });
}

function renderHistory() {
    const box = document.getElementById('orders-box');
    if (!state.history || state.history.length === 0) {
        box.innerHTML = "No record found.";
        return;
    }
    box.innerHTML = state.history.map((order, idx) => `
    <div style="background:#fff;padding:12px;border-radius:8px;margin:8px 0;border:1px solid #eee;">
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
            <span>Order #${idx+1}</span>
            <span style="color:#34c759;">Completed</span>
        </div>
        <div style="font-size:12px;color:#888;margin:4px 0;">${order.time || order.completedTime}</div>
        ${order.items?.map(item => `
        <div style="font-size:12px;padding:2px 0;">${item.name} ×${item.quantity} | £${(item.price * item.quantity).toFixed(2)}</div>
        `).join('') || ''}
        <div style="text-align:right;font-weight:bold;margin-top:4px;">Total: £${order.total?.toFixed(2) || 0}</div>
    </div>
    `).join('');
}

function renderPendingOrders() {
    const box = document.getElementById('pending-orders');
    if (!state.pendingOrders || state.pendingOrders.length === 0) {
        box.innerHTML = "no pending orders";
        return;
    }

    const statusText = { PENDING:"Pending", IN_PROGRESS:"Preparing", READY:"Ready for Pickup", COLLECTED:"Collected" };
    const statusColor = { PENDING:"#ff9500", IN_PROGRESS:"#007aff", READY:"#34c759", COLLECTED:"#999" };

    box.innerHTML = state.pendingOrders.map((order, idx) => `
    <div style="background:#fff;padding:12px;border-radius:8px;margin:8px 0;border:1px solid #eee;color:#000;">
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
            <span>Order #${order.id}</span>
            <span style="color:${statusColor[order.status]}">${statusText[order.status]}</span>
        </div>
        <div style="font-size:12px;margin:4px 0;">${order.time}</div>
        ${order.items?.map(item => `
        <div style="font-size:12px;padding:2px 0;">${item.name} ×${item.quantity}</div>
        `).join('') || ''}
        <div style="text-align:right;font-weight:bold;margin-top:4px;">Total: £${order.total?.toFixed(2) || 0}</div>
    </div>
    `).join('');
}

if(state.isLogin) {
    const totalCups = (state.history || []).reduce((sum, item) => sum + (item.items?.reduce((a,b)=>a+b.quantity,0)||0), 0);
    const progress = totalCups % 10; 
    document.getElementById('cup-text').innerText = `${progress}/10 Cups`;
    document.getElementById('cup-grid').innerHTML = Array.from({length:10}, (_, i) => 
        `<div class="cup-slot ${i < progress ? 'active' : ''}">
            <i class="fa-solid fa-mug-hot"></i>
        </div>`
    ).join('');
}

function openOrderModal(index) {
    const order = state.history[state.history.length - 1 - index];
    if (!order) return;
    const modal = document.getElementById('orderModal');
    const itemsBox = document.getElementById('modalItems');

    itemsBox.innerHTML = (order.items || []).map(i => `
    <div style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
        <div style="display:flex;justify-content:space-between;">
            <span>${i.name} ×${i.quantity}</span>
            <span>£${(i.price * i.quantity).toFixed(2)}</span>
        </div>
    </div>
    `).join('');

    modal.style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Train arrivals
function loadTrainArrivals() {
  fetch("http://localhost:8080/api/trains/arrivals?count=3")
  .then(res => res.json())
  .then(data => {
    document.getElementById('train-info').innerText =
    "Next Trains: " + JSON.stringify(data);
  }).catch(()=>{
    document.getElementById('train-info').innerText = "Next Trains: (Offline)";
  });
}

loadTrainArrivals();
updateTime(); 
renderMenu(); 
loadOrderData();
setInterval(updateTime, 60000);