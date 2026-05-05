/**
 * API Layer - All backend calls go here
 * No changes to API endpoints or payloads
 */

const API_BASE = 'http://localhost:8080';

/**
 * Generic fetch wrapper for API calls
 */
async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${body}`);
    }
    
    return response.status === 204 ? null : response.json();
}

/**
 * Menu API
 */
async function fetchMenuFromBackend() {
    try {
        const backendMenu = await apiFetch('/api/menu');
        return backendMenu.map(item => {
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
        return [...fallbackMenu];
    }
}

/**
 * Orders API
 */
async function placeOrder(orderPayload) {
    return await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
    });
}

async function fetchOrderById(id) {
    return await apiFetch(`/api/orders/${id}`);
}

/**
 * Train Board API
 */
async function fetchTrainArrivals(count = 3) {
    return await apiFetch(`/api/trains/arrivals?count=${count}`);
}

async function fetchTrainDepartures(count = 3) {
    return await apiFetch(`/api/trains/departures?count=${count}`);
}

/**
 * Auth API
 */
async function registerAccount(account, password) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password })
    });
    
    if (!response.ok) throw new Error('Registration failed');
    return response;
}