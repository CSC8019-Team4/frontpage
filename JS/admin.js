const KEY_MENU = 'ws_menu_data';
const KEY_ORDERS = 'pendingOrders';
const KEY_HISTORY = 'ws_order_history';
const KEY_SHOP_STATS = 'ws_shop_stats';
const API_BASE = "http://localhost:8080";
const STAFF_TOKEN = "whistlestop-staff-2025";

function isToday(dateValue) {
    if (!dateValue) return false;
    const orderDate = new Date(dateValue);
    const today = new Date();
    return orderDate.getFullYear() === today.getFullYear()
        && orderDate.getMonth() === today.getMonth()
        && orderDate.getDate() === today.getDate();
}

async function adminFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-Staff-Token": STAFF_TOKEN,
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${body}`);
    }

    return response.status === 204 ? null : response.json();
}


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
    adminFetch("/api/orders/dashboard")
        .then(orders => {

        document.getElementById('list-new').innerHTML = '';
        document.getElementById('list-prep').innerHTML = '';
        document.getElementById('list-ready').innerHTML = '';

        let counts = { c1:0, c2:0, c3:0, rev:0, done:0 };

        orders = orders.map(ord => {
            const totalQuantity = (ord.items || []).reduce((sum, item) => {
                return sum + Number(item.quantity || item.q || 0);
            }, 0);

            return {
                ...ord,
                q: totalQuantity || 1,
                totalPrice: calculateOrderTotal(ord),
                pTime: ord.pickupTime || ord.time || "ASAP",
                displayStatus:
                    ord.status === "PENDING" ? "new" :
                        ord.status === "IN_PROGRESS" ? "prepping" :
                            ord.status
            };
        });
        orders.forEach((ord, idx) => {
            if(ord.station && ord.station !== currentStation) {
                return;
            }


            const card = `
    <div class="order-card ${ord.status === 'READY' ? 'ready' : ''}">
        <div style="display:flex; justify-content:space-between;">
            <b>#${ord.id}</b>
            <span style="font-size:12px; color:#007aff;">
                ${ord.pickupTime ? new Date(ord.pickupTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'ASAP'}
            </span>
        </div>

        <div style="margin-top:10px;">
            ${renderOrderItems(ord.items)}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;margin-top:10px;">
            <span style="font-weight:700;">£${Number(ord.totalCost || 0).toFixed(2)}</span>
            <div>${renderBtns(ord, ord.id)}</div>
        </div>
    </div>
`;

            if (!ord.displayStatus || ord.displayStatus === 'new') {
                document.getElementById('list-new').innerHTML += card;
                counts.c1++;
            } else if (ord.displayStatus === 'prepping' || ord.status === 'ACCEPTED') {
                document.getElementById('list-prep').innerHTML += card;
                counts.c2++;
            } else if (ord.displayStatus === 'READY') {
                document.getElementById('list-ready').innerHTML += card;
                counts.c3++;
            }
            else if(ord.status === 'COLLECTED' && isToday(ord.updatedAt || ord.pickupTime)) {
                counts.done++;
                counts.rev += calculateOrderTotal(ord);
            }
        });

        document.getElementById('count-new').innerText = counts.c1;
        document.getElementById('count-prep').innerText = counts.c2;
        document.getElementById('num1').innerText = counts.c1;
        document.getElementById('num2').innerText = counts.c2;
        document.getElementById('num3').innerText = counts.c3;
        document.getElementById('count-done').innerText = counts.done;
        document.getElementById('total-rev').innerText = `£${counts.rev.toFixed(2)}`;
        renderShopStats();
        })
        .catch(error => {
            console.error("Could not load dashboard orders:", error);
            document.getElementById('list-new').innerHTML =
                '<div style="padding:12px;color:#777;">Could not load orders.</div>';
        });
}

function renderOrderItems(items) {
    if (!items || items.length === 0) {
        return '<div style="font-size:12px;color:#777;">No items</div>';
    }

    return items.map(item => {
        const name = item.menuItem?.name || item.name || 'Item';
        const quantity = item.quantity || item.q || 1;
        const size = item.size || '';
        const customisation = item.customisationNote || '';
        const lineTotal = Number(
            item.lineTotal || (item.unitPrice * quantity) || item.price || 0
        ).toFixed(2);

        return `
            <div style="margin:8px 0;padding:8px;border-radius:8px;background:#f8f8f8;">
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span><b>${name}</b> ×${quantity}</span>
                    <span>£${lineTotal}</span>
                </div>

                <div style="font-size:11px;color:#777;margin-top:3px;">
                    ${size}
                </div>

                ${customisation ? `
                    <div style="font-size:11px;color:#555;margin-top:4px;">
                        ${customisation}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function calculateOrderTotal(order) {
    if (order.totalCost != null) {
        return Number(order.totalCost);
    }

    if (order.total != null) {
        return Number(order.total);
    }

    return (order.items || []).reduce((sum, item) => {
        const quantity = item.quantity || item.q || 1;
        const lineTotal = item.lineTotal || (item.unitPrice * quantity) || item.price || 0;
        return sum + Number(lineTotal);
    }, 0);
}

function renderBtns(ord, orderId) {
    if (ord.status === 'PENDING' || ord.displayStatus === 'new') {
        return `<button onclick="updateOrderStatus(${orderId},'ACCEPTED')" style="background:#000; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Accept</button>`;
    }

    if (ord.status === 'ACCEPTED') {
        return `<button onclick="updateOrderStatus(${orderId},'IN_PROGRESS')" style="background:#000; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Start</button>`;
    }

    if (ord.status === 'IN_PROGRESS' || ord.displayStatus === 'prepping') {
        return `<button onclick="updateOrderStatus(${orderId},'READY')" style="background:#000; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Finish</button>`;
    }

    if (ord.status === 'READY') {
        return `<button onclick="updateOrderStatus(${orderId},'COLLECTED')" style="background:#34c759; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">Collected</button>`;
    }

    return '';
}

function updateOrderStatus(orderId, status) {
    adminFetch(`/api/orders/${orderId}/status?status=${status}`, {
        method: "PATCH"
    }).then(() => {
        renderAll();
    });
}

function renderShopStats() {
    Promise.all([
        adminFetch("/api/orders/dashboard"),  
        adminFetch("/api/orders/archive")    
    ])
    .then(([activeOrders, historyOrders]) => {
        const currentStation = document.getElementById('stationFilter').value;

        const filteredActive = activeOrders.filter(ord => 
            !ord.station || ord.station === currentStation
        );
        const filteredHistory = historyOrders.filter(ord => 
            !ord.station || ord.station === currentStation
        );
        const pendingCount = filteredActive.filter(o => o.status === "PENDING").length;
        const inProgressCount = filteredActive.filter(o =>
            o.status === "ACCEPTED" || o.status === "IN_PROGRESS"
        ).length;
        const readyCount = filteredActive.filter(o => o.status === "READY").length;

        const todayCompletedOrders = filteredHistory.filter(o => 
            o.status === "COLLECTED" && isToday(o.updatedAt || o.pickupTime || o.createdAt)
        );
        const completedTodayCount = todayCompletedOrders.length;
        const todayRevenue = todayCompletedOrders.reduce((sum, ord) => {
            return sum + calculateOrderTotal(ord);
        }, 0);

        document.getElementById('count-new').innerText = pendingCount;
        document.getElementById('count-prep').innerText = inProgressCount;
        document.getElementById('num1').innerText = pendingCount;
        document.getElementById('num2').innerText = inProgressCount;
        document.getElementById('num3').innerText = readyCount;
        document.getElementById('count-done').innerText = completedTodayCount;
        document.getElementById('total-rev').innerText = todayRevenue.toFixed(2);
    })
    .catch(error => {
        console.error("Could not load shop stats:", error);
    });
}

function renderArchive() {
    const currentStation = document.getElementById('stationFilter').value;

    adminFetch("/api/orders/archive")
        .then(history => {
            const archiveBody = document.getElementById('archive-body');
            if (!archiveBody) return;

            archiveBody.innerHTML = '';

            const filteredHistory = history.filter(ord => {
                return !ord.station || ord.station === currentStation;
            });

            if (filteredHistory.length === 0) {
                archiveBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:20px; color:#999;">
                            No order history
                        </td>
                    </tr>
                `;
                return;
            }

            filteredHistory.forEach(ord => {
                const productNames = (ord.items || []).map(item => {
                    const name = item.menuItem?.name || item.name || 'Coffee';
                    const customisation = item.customisationNote
                        ? ` (${item.customisationNote})`
                        : '';
                    return `${name}${customisation}`;
                }).join(', ');

                const quantity = (ord.items || []).reduce((sum, item) => {
                    return sum + Number(item.quantity || item.q || 0);
                }, 0);

                const totalPrice = calculateOrderTotal(ord);

                const time = ord.pickupTime
                    ? new Date(ord.pickupTime).toLocaleString('en-GB')
                    : 'Unknown';

                archiveBody.innerHTML += `
                    <tr>
                        <td>#${ord.id}</td>
                        <td>${productNames}</td>
                        <td>${quantity}</td>
                        <td>£${totalPrice.toFixed(2)}</td>
                        <td>${time}</td>
                        <td>${ord.station || 'Cramlington Station'}</td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Could not load archive:", error);

            const archiveBody = document.getElementById('archive-body');
            if (archiveBody) {
                archiveBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:20px; color:#999;">
                            Could not load order history
                        </td>
                    </tr>
                `;
            }
        });
}

function renderMenuTable() {
    const tableBody = document.getElementById('p-body');

    if (!tableBody) {
        return;
    }

    if (!products || products.length === 0) {
        tableBody.innerHTML = '';
        return;
    }

    tableBody.innerHTML = products.map((p, i) => `
        <tr>
            <td><b>${p.name}</b></td>
            <td>£${p.p1.toFixed(2)}</td>
            <td>${p.p2 ? '£' + p.p2.toFixed(2) : '-'}</td>
            <td>
                <span style="color:${p.stock ? '#34c759' : '#ff3b30'}">
                    ${p.stock ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
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
};