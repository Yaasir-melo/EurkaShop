import { auth } from './auth.js';
import { db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const message = document.getElementById('trackingMessage');
const orderList = document.getElementById('trackingOrderList');
let stopWatchingOrders = null;

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const progressStatuses = [
    ['pending', 'Pending'],
    ['confirmed', 'Confirmed'],
    ['preparing', 'Preparing'],
    ['out_for_delivery', 'Out for delivery'],
    ['fulfilled', 'Delivered']
];

function renderOrders(orderDocs) {
    if (!orderDocs.length) {
        message.textContent = 'You have not placed any orders yet.';
        orderList.innerHTML = '<a class="tracking-shop-link" href="products.html">Browse products</a>';
        return;
    }

    message.textContent = 'Your order progress updates here when the shop changes the status.';
    const orders = orderDocs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    orderList.innerHTML = orders.map(order => {
        const status = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'fulfilled', 'cancelled'].includes(order.status) ? order.status : 'pending';
        const created = order.createdAt?.toDate?.();
        const date = created ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(created) : 'Date unavailable';
        const items = Array.isArray(order.items) ? order.items.map(item => `<li>${escapeHTML(item.title)} × ${Number(item.quantity) || 1}</li>`).join('') : '';
        const currentStep = progressStatuses.findIndex(([key]) => key === status);
        const progress = status === 'cancelled'
            ? '<p class="tracking-cancelled">This order was cancelled. Contact the shop if you need help.</p>'
            : `<ol class="tracking-steps">${progressStatuses.map(([key, label], index) => `<li class="${index < currentStep ? 'is-complete' : ''} ${index === currentStep ? 'is-current' : ''}"><span>${index < currentStep ? '<i class="fas fa-check" aria-hidden="true"></i>' : index + 1}</span><small>${label}</small></li>`).join('')}</ol>`;

        return `<article class="tracking-order-card">
            <div class="tracking-order-heading"><div><p>Order placed ${escapeHTML(date)}</p><h3>Order ${escapeHTML(order.id.slice(-8))}</h3></div><span class="customer-order-status status-${escapeHTML(status)}">${escapeHTML(status.replaceAll('_', ' '))}</span></div>
            ${progress}
            <div class="tracking-order-details"><div><h4>Items</h4><ul>${items}</ul></div><div class="tracking-code-panel"><h4>Delivery claim code</h4><p>Show this code to the delivery person when you receive your order.</p><div class="tracking-code-row"><code>${escapeHTML(order.id)}</code><button type="button" class="tracking-copy-btn" data-copy-code="${escapeHTML(order.id)}" aria-label="Copy delivery claim code"><i class="far fa-copy" aria-hidden="true"></i> Copy</button></div><p class="tracking-copy-message" data-copy-message="${escapeHTML(order.id)}" aria-live="polite"></p></div></div>
        </article>`;
    }).join('');
}

onAuthStateChanged(auth, user => {
    stopWatchingOrders?.();
    orderList.replaceChildren();
    if (!user) {
        message.textContent = 'Sign in to see your orders and delivery claim codes.';
        orderList.innerHTML = '<button type="button" class="tracking-signin-btn" id="trackingSignIn">Sign in to view orders</button>';
        document.getElementById('trackingSignIn').addEventListener('click', () => document.getElementById('accountBtn')?.click());
        return;
    }

    message.textContent = 'Loading your orders…';
    stopWatchingOrders = onSnapshot(
        query(collection(db, 'orderRequests'), where('userId', '==', user.uid)),
        snapshot => renderOrders(snapshot.docs),
        error => { message.textContent = `Could not load your orders: ${error.message}`; }
    );
});

orderList.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-code]');
    if (!button) return;
    const code = button.dataset.copyCode;
    const status = orderList.querySelector(`[data-copy-message="${CSS.escape(code)}"]`);
    try {
        await navigator.clipboard.writeText(code);
        status.textContent = 'Code copied.';
    } catch {
        status.textContent = `Copy unavailable. Select and copy: ${code}`;
    }
});
