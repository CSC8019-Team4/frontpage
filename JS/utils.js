/**
 * Utility Functions
 * Helper functions used across the app
 */

/**
 * Show a temporary inline error message
 */
function showInlineError(element, message) {
    const err = document.createElement('div');
    err.style.color = '#ff3b30';
    err.style.fontSize = '12px';
    err.style.margin = '4px 0';
    err.textContent = message;
    element.appendChild(err);
    
    // Remove after 2.5 seconds
    setTimeout(() => {
        if (err.parentNode) {
            err.remove();
        }
    }, 2500);
}

/**
 * Get image URL for a menu item
 */
function imageForItem(name) {
    const fallback = fallbackMenu.find(i => i.name.toLowerCase() === String(name).toLowerCase());
    return fallback?.img || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop';
}

/**
 * Format date/time for display
 */
function formatDateTime(value) {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Check if a date is today
 */
function isToday(dateValue) {
    if (!dateValue) return false;
    const orderDate = new Date(dateValue);
    const today = new Date();
    return orderDate.getFullYear() === today.getFullYear()
        && orderDate.getMonth() === today.getMonth()
        && orderDate.getDate() === today.getDate();
}

/**
 * Build pickup datetime string
 */
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