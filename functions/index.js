import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { logger } from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

initializeApp();

const db = getFirestore();
// Keep this region aligned with the Cloud Firestore database location.
const region = 'us-central1';
const orderStatuses = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    fulfilled: 'Fulfilled'
};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

async function queueEmail(eventId, recipient, subject, text, html) {
    if (typeof recipient !== 'string' || !recipient.includes('@')) {
        logger.warn('Order email skipped because the order has no valid customer email.', { eventId });
        return;
    }
    const documentId = createHash('sha256').update(eventId).digest('hex');
    try {
        await db.collection('mail').doc(documentId).create({
            to: recipient,
            message: { subject, text, html }
        });
    } catch (error) {
        // Firestore event delivery may retry; do not enqueue a duplicate email.
        if (error.code === 6 || error.code === 'already-exists') return;
        throw error;
    }
}

function orderSummary(order) {
    return (Array.isArray(order.items) ? order.items : []).map(item => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const options = Object.entries(item.options || {})
            .map(([name, value]) => `${name}: ${value}`)
            .join(', ');
        return `${quantity} × ${String(item.title || 'Product')}${options ? ` (${options})` : ''}`;
    });
}

export const emailOrderReceived = onDocumentCreated({
    document: 'orderRequests/{orderId}',
    region,
    retry: true,
    maxInstances: 3
}, async event => {
    const order = event.data?.data();
    if (!order) return;
    const orderNumber = event.params.orderId.slice(-8);
    const items = orderSummary(order);
    const greeting = String(order.fullName || 'Customer');
    const subject = `Eureka Shop received order ${orderNumber}`;
    const text = `Hello ${greeting},\n\nWe received your order request ${orderNumber}.\n${items.map(item => `• ${item}`).join('\n')}\n\nThe shop will contact you to confirm the order total and payment method. No payment has been taken yet.`;
    const htmlItems = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const html = `<p>Hello ${escapeHtml(greeting)},</p><p>We received your order request <strong>${escapeHtml(orderNumber)}</strong>.</p><ul>${htmlItems}</ul><p>The shop will contact you to confirm the order total and payment method. No payment has been taken yet.</p>`;
    await queueEmail(event.id, order.email, subject, text, html);
});

export const emailOrderStatusChanged = onDocumentUpdated({
    document: 'orderRequests/{orderId}',
    region,
    retry: true,
    maxInstances: 3
}, async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;
    const status = orderStatuses[after.status];
    if (!status) return;
    const orderNumber = event.params.orderId.slice(-8);
    const subject = `Eureka Shop order ${orderNumber}: ${status}`;
    const text = `Hello ${String(after.fullName || 'Customer')},\n\nThe status of order ${orderNumber} is now ${status}.\n\nIf you have questions, please reply to this email or contact the shop.`;
    const html = `<p>Hello ${escapeHtml(after.fullName || 'Customer')},</p><p>The status of order <strong>${escapeHtml(orderNumber)}</strong> is now <strong>${escapeHtml(status)}</strong>.</p><p>If you have questions, please reply to this email or contact the shop.</p>`;
    await queueEmail(event.id, after.email, subject, text, html);
});
