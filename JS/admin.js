const KEY_MENU = 'ws_menu_data';
const KEY_ORDERS = 'pendingOrders';
const KEY_HISTORY = 'ws_order_history';
const KEY_SHOP_STATS = 'ws_shop_stats';
const API_BASE = "https://1-production-e223.up.railway.app";
const STAFF_TOKEN = "whistlestop-staff-2025";
const DAY_NAMES = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
};
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
        });

        document.getElementById('count-new').innerText = counts.c1;
        document.getElementById('count-prep').innerText = counts.c2;
        document.getElementById('num1').innerText = counts.c1;
        document.getElementById('num2').innerText = counts.c2;
        document.getElementById('num3').innerText = counts.c3;
        document.getElementById('count-done').innerText = counts.done;
        document.getElementById('total-rev').innerText = `£${counts.rev.toFixed(2)}`;
          renderTodayHours();
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


       const allCompletedOrders = filteredHistory.filter(o => o.status === "COLLECTED");
       const completedCount = allCompletedOrders.length;
       const totalRevenue = allCompletedOrders.reduce((sum, ord) => {
                return sum + calculateOrderTotal(ord);}, 0);


        document.getElementById('count-new').innerText = pendingCount;
        document.getElementById('count-prep').innerText = inProgressCount;
        document.getElementById('num1').innerText = pendingCount;
        document.getElementById('num2').innerText = inProgressCount;
        document.getElementById('num3').innerText = readyCount;
        document.getElementById('count-done').innerText = completedCount;
        document.getElementById('total-rev').innerText = totalRevenue.toFixed(2);
    })
    .catch(error => {
        console.error("Could not load shop stats:", error);
    });
}

// ==================== Open time show ====================
async function renderTodayHours() {
    const hoursEl = document.getElementById('today-hours');
    if (!hoursEl) return;

    try {
        const allHours = await adminFetch('/api/opening-hours');
        const jsDay = new Date().getDay();
        const todayJavaDay = jsDay === 0 ? 7 : jsDay;
        const todayHours = allHours.find(h => h.dayOfWeek === todayJavaDay);
        
        if (todayHours) {
            hoursEl.innerText = `${DAY_NAMES[todayJavaDay]}: ${todayHours.openTime} - ${todayHours.closeTime}`;
        } else {
            hoursEl.innerText = 'Hours: Not set';
        }
    } catch (error) {
        console.warn('Loading time failure:', error);
        hoursEl.innerText = '';
    }
}
async function renderHoursSettings() {
    const listEl = document.getElementById('hours-list');
    if (!listEl) return;

    try {
        const allHours = await adminFetch('/api/opening-hours');
        listEl.innerHTML = allHours.map(hours => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f8f8; border-radius: 12px;">
                <div style="font-weight: 800; width: 120px;">${DAY_NAMES[hours.dayOfWeek]}</div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <!-- 只改了这里：加了 || '' -->
                    <input type="time" id="open-${hours.dayOfWeek}" value="${hours.openTime || ''}" style="padding: 8px 12px; border: 1px solid #eee; border-radius: 8px;">
                    <span>to</span>
                    <input type="time" id="close-${hours.dayOfWeek}" value="${hours.closeTime || ''}" style="padding: 8px 12px; border: 1px solid #eee; border-radius: 8px;">
                    <button onclick="saveDayHours(${hours.dayOfWeek})" style="padding: 8px 15px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Save</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Loading time failure:', err);
    }
}

// ====================Save day open time====================
async function saveDayHours(dayOfWeek) {
    const openInput = document.getElementById(`open-${dayOfWeek}`);
    const closeInput = document.getElementById(`close-${dayOfWeek}`);
    const msgEl = document.getElementById('hours-msg');

    if (!openInput || !closeInput.value) return;

    try {
        await adminFetch(`/api/opening-hours/${dayOfWeek}`, {
            method: 'PUT',
            body: JSON.stringify({
                openTime: openInput.value,  
                closeTime: closeInput.value  
            })
        });
        renderTodayHours();

        msgEl.innerText = `${DAY_NAMES[dayOfWeek]} updated!`;
        msgEl.style.color = '#34c759';
        setTimeout(() => msgEl.innerText = '', 3000);

    } catch (err) {
        console.error('Save failure:', err);
        msgEl.innerText = 'Save failed';
        msgEl.style.color = '#ff3b30';
        setTimeout(() => msgEl.innerText = '', 3000);
    }
}


function renderArchive() {
    const currentStation = document.getElementById('stationFilter').value;

    adminFetch("/api/orders/archive")
        .then(history => {
            const archiveBody = document.getElementById('archive-body');
            if (!archiveBody) return;
            archiveBody.innerHTML = '';

            let totalOrders = 0;
            let totalRevenue = 0;

            const filteredHistory = history.filter(ord => {
                return !ord.station || ord.station === currentStation;
            });
            filteredHistory.sort((a,b) => b.id - a.id);

            if (filteredHistory.length === 0) {
                archiveBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:20px; color:#999;">
                            No order history
                        </td>
                    </tr>
                `;
                document.getElementById('archive-total').innerText = 0;
                document.getElementById('archive-rev').innerText = "0.00";
                return;
            }

           filteredHistory.forEach(ord => {
    if (ord.status !== 'COLLECTED') return; 

    const productNames = (ord.items || []).map(item => {
        const name = item.menuItem?.name || item.name || 'Coffee';
        const customisation = item.customisationNote ? ` (${item.customisationNote})` : '';
        return `${name}${customisation}`;
    }).join(', ');

    const quantity = (ord.items || []).reduce((sum, item) => {
        return sum + Number(item.quantity || item.q || 0);
    }, 0);

    const totalPrice = calculateOrderTotal(ord);

    totalOrders++;
    totalRevenue += totalPrice;

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

          
            document.getElementById('archive-total').textContent = totalOrders;
            document.getElementById('archive-rev').textContent = totalRevenue.toFixed(2);
        })
        .catch(error => {
            console.error("Could not load archive:", error);
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
    document.getElementById('view-hours').style.display = id === 'hours' ? 'block' : 'none';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    if (id === 'archive') renderArchive();
    if (id === 'hours') renderHoursSettings(); 
}

setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);
setInterval(() => {
    renderTodayHours();
}, 60000);

window.onload = function() {
    renderAll();
    renderMenuTable();
    renderTodayHours(); 
};