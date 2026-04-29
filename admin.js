const KEY_MENU = 'ws_menu_data';
const KEY_ORDERS = 'pendingOrders';
const KEY_HISTORY = 'ws_order_history';
const KEY_SHOP_STATS = 'ws_shop_stats';

let products = JSON.parse(localStorage.getItem(KEY_MENU)) || [
    { name: 'Americano', p1: 1.5, p2: 2.0, stock: true },
    { name: 'Americano with milk', p1: 2.0, p2: 2.5, stock: true },
    { name: 'Latte', p1: 2.5, p2: 3.0, stock: true },
    { name: 'Cappuccino', p1: 2.5, p2: 3.0, stock: true },
    { name: 'Hot Chocolate', p1: 2.0, p2: 2.5, stock: true },
    { name: 'Mocha', p1: 2.5, p2: 3.0, stock: true }
];

function renderAll() {
    const currentStation = document.getElementById('stationFilter').value;

   
    fetch("http://localhost:8080/api/orders/dashboard")
    .then(res => res.json())
    .then(orders => {

        document.getElementById('list-new').innerHTML = '';
        document.getElementById('list-prep').innerHTML = '';
        document.getElementById('list-ready').innerHTML = '';

        let counts = { c1:0, c2:0, c3:0, rev:0, done:0 };

        orders = orders.map(ord => {
            return {
                ...ord,
                name: ord.items?.[0]?.name || "Coffee Order",
                q: ord.items?.reduce((a, b) => a + b.q, 0) || 1,
                p: ord.total / (ord.items?.reduce((a, b) => a + b.q, 0) || 1) || 0,
                pTime: ord.time || "ASAP",
                status: ord.status === "PENDING" ? "new" : ord.status === "IN_PROGRESS" ? "prepping" : ord.status
            };
        });

        orders.forEach((ord, idx) => {
            if(ord.station && ord.station !== currentStation) return;

            const card = `
                <div class="order-card ${ord.status === 'READY' ? 'ready' : ''}">
                    <div style="display:flex; justify-content:space-between;">
                        <b>#${ord.id}</b>
                        <span style="font-size:12px; color:#007aff;">${ord.pTime || 'ASAP'}</span>
                    </div>
                    <div style="margin:10px 0; font-size:14px;">${ord.name} x${ord.q}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700;">£${(ord.p * ord.q).toFixed(2)}</span>
                        <div>${renderBtns(ord, ord.id)}</div>
                    </div>
                </div>
            `;

            if(!ord.status || ord.status === 'new') { document.getElementById('list-new').innerHTML += card; counts.c1++; }
            else if(ord.status === 'prepping') { document.getElementById('list-prep').innerHTML += card; counts.c2++; }
            else if(ord.status === 'READY') { document.getElementById('list-ready').innerHTML += card; counts.c3++; }
            else if(ord.status === 'COLLECTED') {
                counts.done++;
                counts.rev += (ord.total || (ord.p * ord.q));
            }
        });

        document.getElementById('count-new').innerText = counts.c1;
        document.getElementById('count-prep').innerText = counts.c2;
        document.getElementById('num1').innerText = counts.c1;
        document.getElementById('num2').innerText = counts.c2;
        document.getElementById('num3').innerText = counts.c3;

        renderMenuTable();
        renderShopStats();
    });
}

function renderBtns(ord, orderId) {
    if(!ord.status || ord.status === 'new') {
        return `<button onclick="updateOrderStatus(${orderId},'ACCEPTED')" style="background:#000; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Accept</button>`;
    }
    if(ord.status === 'prepping') {
        return `<button onclick="updateOrderStatus(${orderId},'READY')" style="background:#000; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Finish</button>`;
    }
    if(ord.status === 'READY') {
        return `<button onclick="updateOrderStatus(${orderId},'COLLECTED')" style="background:#34c759; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Collected</button>`;
    }
    return '';
}

// 后端状态更新（已改好）
function updateOrderStatus(orderId, status) {
    fetch(`http://localhost:8080/api/orders/${orderId}/status?status=${status}`, {
        method: "PATCH"
    }).then(() => {
        renderAll();
    });
}

function renderShopStats() {
    fetch("http://localhost:8080/api/orders/dashboard")
    .then(res => res.json())
    .then(ords => {
        const currentStation = document.getElementById('stationFilter').value;
        ords = ords.filter(ord => !ord.station || ord.station === currentStation);

        const pendingCount = ords.filter(o => o.status === "PENDING" || o.status === "new").length;
        const inProgressCount = ords.filter(o => o.status === "IN_PROGRESS" || o.status === "prepping").length;

        document.getElementById('count-new').innerText = pendingCount;
        document.getElementById('count-prep').innerText = inProgressCount;
        document.getElementById('count-done').innerText = '0';
        document.getElementById('total-rev').innerText = '0.00';
    });
}

function renderArchive() {
    const currentStation = document.getElementById('stationFilter').value;
    // 从后端获取历史订单
    fetch("http://localhost:8080/api/orders/archive")
    .then(res => res.json())
    .then(history => {
        const archiveBody = document.getElementById('archive-body');
        if (!archiveBody) return;
        archiveBody.innerHTML = '';

        const filteredHistory = history.filter(ord => ord.station === currentStation);
        if (filteredHistory.length === 0) {
            archiveBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">No order history</td></tr>`;
            return;
        }

        filteredHistory.forEach((ord, idx) => {
            const productNames = ord.items?.map(item => item.name).join(', ') || ord.name || 'Coffee';
            const quantity = ord.items?.reduce((a, b) => a + b.q, 0) || ord.q || 1;
            const totalPrice = ord.total || (ord.p * quantity) || 0;
            const time = ord.completedTime || ord.time || 'Unknown';

            archiveBody.innerHTML += `
                <tr>
                    <td>#${ord.id}</td>
                    <td>${productNames}</td>
                    <td>${quantity}</td>
                    <td>£${totalPrice.toFixed(2)}</td>
                    <td>${time}</td>
                    <td>${ord.station}</td>
                </tr>
            `;
        });
    });
}

function renderMenuTable() {
    if(!products || products.length === 0) return;
    document.getElementById('p-body').innerHTML = products.map((p, i) => `
        <tr>
            <td><b>${p.name}</b></td>
            <td>£${p.p1.toFixed(2)}</td>
            <td>${p.p2 ? '£'+p.p2.toFixed(2) : '-'}</td>
            <td><span style="color:${p.stock?'#34c759':'#ff3b30'}">${p.stock?'In Stock':'Out of Stock'}</span></td>
            <td>
                <button onclick="toggleS(${i})" style="cursor:pointer;">Toggle Stock</button>
                <button onclick="delP(${i})" style="color:red; cursor:pointer; margin-left:10px; border:none; background:none;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openPModal() { document.getElementById('p-modal').style.display = 'flex'; }
function closePModal() { document.getElementById('p-modal').style.display = 'none'; }

function saveP() {
    const n = document.getElementById('p-name').value;
    const p1 = parseFloat(document.getElementById('p-p1').value);
    const p2 = parseFloat(document.getElementById('p-p2').value);
    if(!n || isNaN(p1)) return alert('Name and Price are required');
    products.push({ name: n, p1, p2: p2||null, stock: true });
    sync(); closePModal();
}

function delP(i) { if(confirm('Delete this product?')) { products.splice(i, 1); sync(); } }
function toggleS(i) { products[i].stock = !products[i].stock; sync(); }

function sync() {
    localStorage.setItem(KEY_MENU, JSON.stringify(products));
    renderAll();
}

function nav(id, el) {
    document.getElementById('view-orders').style.display = id === 'orders' ? 'block' : 'none';
    document.getElementById('view-products').style.display = id === 'products' ? 'block' : 'none';
    document.getElementById('view-archive').style.display = id === 'archive' ? 'block' : 'none';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    if (id === 'archive') renderArchive();
}

setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

window.onload = function() {
    renderAll();
    renderMenuTable();
    renderShopStats();
};