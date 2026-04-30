// 恢复上一版 Menu 图片
const menu = [
    { name: 'Americano', p1: 1.50, p2: 2.00, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop', id:1 },
    { name: 'Americano with milk', p1: 2.00, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop', id:2 },
    { name: 'Latte', p1: 2.50, p2: 3.00, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop', id:3 },
    { name: 'Cappuccino', p1: 2.50, p2: 3.00, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop', id:4 },
    { name: 'Hot Chocolate', p1: 2.00, p2: 2.50, img: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300&h=200&fit=crop', id:5 },
    { name: 'Mocha', p1: 2.50, p2: 3.00, img: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=300&h=200&fit=crop', id:6 },
    { name: 'Mineral Water', p1: 1.00, p2: null, img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=200&fit=crop', id:7 }
];

let state = { bag: [], curr: null, q: 1, bp: 0, history: [], isLogin: false };

function updateTime() {
    const n = new Date(), d = n.getDay(), h = n.getHours() + n.getMinutes()/60;
    let range = "", open = false;
    if(d >= 1 && d <= 5) { range = "06:30-19:00"; open = (h>=6.5 && h<19); }
    else if(d === 6) { range = "07:00-18:00"; open = (h>=7 && h<18); }
    else { range = "Closed"; }
    document.getElementById('timeBox').innerHTML = `<span style="font-weight:900;color:var(--gold)">${open?'OPEN':'CLOSED'}</span><br>${range}`;
}

function renderMenu() {
    document.getElementById('menu-items').innerHTML = menu.map(i => {
        const isWater = i.name.includes("Mineral Water");
        const action = isWater ? `addBagDirectly(${i.id})` : `openDrawer('${i.name}')`;
        return `<div class="menu-card" onclick="${action}">
            <div class="menu-img-container"><img src="${i.img}" class="menu-img"></div>
            <div style="font-weight: 800; font-size: 14px;">${i.name}</div>
            <div style="font-size: 14px; font-weight: 900; color: var(--gold); margin-top:4px;">£${i.p1.toFixed(2)}</div>
        </div>`;
    }).join('');
}

function addBagDirectly(id) {
    const item = menu.find(m => m.id === id);
    state.bag.push({ name: item.name, p: item.p1, q: 1, milk: "None", id: Date.now() });
    updateBagUI(); alert("Water added to bag.");
}

function openDrawer(name) {
    state.curr = menu.find(m => m.name === name);
    state.q = 1; state.bp = state.curr.p1;
    document.getElementById('drawer').innerHTML = `<div style="padding:35px 25px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
            <h2 style="margin:0;font-size:24px;font-weight:800;">${state.curr.name}</h2>
            <span id="d-price" style="font-size:22px;font-weight:900;color:var(--gold);">£${state.bp.toFixed(2)}</span>
        </div>
        <p style="font-size:11px;font-weight:900;color:#888;text-transform:uppercase;margin-bottom:10px;">Select: Milk</p>
        <div class="opt-grid">
            <button class="opt-btn active" onclick="setOpt(this)">Whole Milk</button>
            <button class="opt-btn" onclick="setOpt(this)">Oat Milk</button>
        </div>
        <div class="opt-grid" id="size-box" style="margin-top:20px;">
            <button class="opt-btn active" onclick="selSize(this, ${state.curr.p1})">Regular</button>
            ${state.curr.p2 ? `<button class="opt-btn" onclick="selSize(this, ${state.curr.p2})">Large</button>` : ''}
        </div>
        <button class="btn-primary-large" onclick="addBag()" style="margin-top:35px;">ADD TO BAG</button>
    </div>`;
    document.getElementById('mask').style.display = 'block';
    setTimeout(() => document.getElementById('drawer').style.bottom = '0', 10);
}

function closeDrawer() { 
    document.getElementById('drawer').style.bottom = '-100%'; 
    setTimeout(() => document.getElementById('mask').style.display='none', 300); 
}

function updateBagUI() {
    const payBar = document.getElementById('pay-bar');
    if(state.bag.length > 0) {
        payBar.style.display = 'block';
        const total = state.bag.reduce((a,b)=>a+(b.p*b.q),0);
        document.getElementById('cart-p-bar').innerText = total.toFixed(2);
    } else { payBar.style.display = 'none'; }
}

function addBag() {
    state.bag.push({ name: state.curr.name, p: state.bp, q: 1, milk: "Selected", id: Date.now() });
    updateBagUI(); closeDrawer();
}

function login() {
    state.isLogin = true;
    document.getElementById('login-ui').style.display = 'none';
    document.getElementById('member-ui').style.display = 'block';
    updateMemberUI();
}

function updateMemberUI() {
    if(!state.isLogin) return;
    const progress = state.history.length % 10;
    document.getElementById('cup-text').innerText = `${progress}/10 Cups`;
    document.getElementById('cup-grid').innerHTML = Array.from({length:10}, (_, i) => 
        `<div class="cup-slot ${i < progress ? 'active' : ''}"><i class="fa-solid fa-mug-hot"></i></div>`
    ).join('');
}

function navTo(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(id==='pg-record') { renderHistory(); updateMemberUI(); }
}

function renderHistory() {
    const box = document.getElementById('orders-box');
    if (state.history.length === 0) { box.innerHTML = '<div class="empty-placeholder">No history found.</div>'; return; }
    box.innerHTML = state.history.map(o => `
        <div class="order-data-row">
            <div><div style="font-weight:800;">Order #${o.id}</div><div style="font-size:12px;color:#95a5a6;margin-top:4px;">${o.time}</div></div>
            <div style="font-weight:900;color:var(--gold);">£${o.total.toFixed(2)}</div>
        </div>`).join('');
}

function checkout() {
    const total = state.bag.reduce((a,b)=>a+(b.p*b.q),0);
    const order = { id: Math.floor(Math.random()*9000+1000), total: total, time: new Date().toLocaleTimeString() };
    state.history.unshift(order); state.bag = []; updateBagUI(); navTo('pg-record');
}

function setOpt(btn) { btn.parentElement.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
function selSize(btn, p) { state.bp = p; setOpt(btn); document.getElementById('d-price').innerText = `£${p.toFixed(2)}`; }

updateTime(); renderMenu(); setInterval(updateTime, 60000);
