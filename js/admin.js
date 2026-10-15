import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const loginPanel = document.getElementById('adminLoginPanel');
const dashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const authMessage = document.getElementById('adminAuthMessage');
const messageElement = document.getElementById('adminMessage');
let stopSettingsListener = null;
let stopOrdersListener = null;
let storeCategories = window.EUREKA_BASE_CATEGORIES || [];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function showMessage(message, isError = false) {
    messageElement.textContent = message;
    messageElement.classList.toggle('is-error', isError);
}

async function checkAdmin(user) {
    if (!user) {
        stopSettingsListener?.();
        stopOrdersListener?.();
        dashboard.hidden = true;
        loginPanel.hidden = false;
        return;
    }
    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists()) {
            await signOut(auth);
            authMessage.textContent = `Firebase sign-in worked, but this account is not authorized for the admin dashboard. In Firestore → Data, create admins/${user.uid} using this exact document ID.`;
            return;
        }
        loginPanel.hidden = true;
        dashboard.hidden = false;
        document.getElementById('adminSignedInAs').textContent = user.email || 'Admin';
        stopSettingsListener?.();
        stopOrdersListener?.();
        startOrdersListener();
        stopSettingsListener = onSnapshot(doc(db, 'appConfig', 'catalog'), snapshot => {
            const settings = snapshot.exists() ? snapshot.data() : {};
            const migrated = settings.builtInCatalogMigrated === true;
            storeCategories = Array.isArray(settings.categories) && settings.categories.length ? settings.categories : (window.EUREKA_BASE_CATEGORIES || []);
            document.getElementById('migrateCatalog').hidden = migrated;
            document.getElementById('migrationStatus').textContent = migrated
                ? 'The built-in catalog is now managed in Firestore.'
                : 'Move the products currently built into the site into Firestore so you can manage them here.';
            renderCategoryList();
        }, error => showMessage(error.message, true));
    } catch (error) {
        await signOut(auth);
        authMessage.textContent = error.code === 'permission-denied'
            ? 'Firebase sign-in worked, but Firestore denied the admin check. Publish the docs/firestore.rules rules to Cloud Firestore in project eureka-shop-dd9fd.'
            : `Could not verify admin access (${error.code || 'unknown-error'}): ${error.message}`;
    }
}

function startOrdersListener() {
    const rows = document.getElementById('adminOrderRows');
    const empty = document.getElementById('adminOrdersEmpty');
    const message = document.getElementById('adminOrdersMessage');
    stopOrdersListener = onSnapshot(query(collection(db, 'orderRequests'), orderBy('createdAt', 'desc')), snapshot => {
        empty.hidden = snapshot.docs.length > 0;
        rows.innerHTML = snapshot.docs.map(orderDoc => {
            const order = orderDoc.data();
            const created = order.createdAt?.toDate?.();
            const date = created ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(created) : 'Date unavailable';
            const items = Array.isArray(order.items) ? order.items.map(item => {
                const options = Object.entries(item.options || {}).map(([name, value]) => `${escapeHTML(name)}: ${escapeHTML(value)}`).join(', ');
                return `<li>${escapeHTML(item.title)} × ${Number(item.quantity) || 1}${options ? `<small>${options}</small>` : ''}</li>`;
            }).join('') : '<li>No item details</li>';
            const status = ['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(order.status) ? order.status : 'pending';
            return `<tr><td><strong>${escapeHTML(orderDoc.id.slice(-8))}</strong><small>${escapeHTML(date)}</small></td><td>${escapeHTML(order.fullName || 'Customer')}<small>${escapeHTML(order.email || '')}</small></td><td>${escapeHTML(order.phone || '')}<small>${escapeHTML(order.address || '')}</small></td><td><ul class="admin-order-items">${items}</ul></td><td><select class="admin-order-status" data-order-status="${escapeHTML(orderDoc.id)}" aria-label="Status for order ${escapeHTML(orderDoc.id.slice(-8))}"><option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option><option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option><option value="fulfilled" ${status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option></select></td><td><button class="admin-order-save" type="button" data-save-order="${escapeHTML(orderDoc.id)}">Save status</button></td></tr>`;
        }).join('');
        message.textContent = '';
    }, error => {
        empty.hidden = true;
        message.textContent = `Could not load order requests: ${error.message}`;
        message.classList.add('is-error');
    });
}

document.getElementById('adminOrderRows').addEventListener('click', async event => {
    const button = event.target.closest('[data-save-order]');
    if (!button) return;
    const id = button.dataset.saveOrder;
    const status = document.querySelector(`[data-order-status="${CSS.escape(id)}"]`)?.value;
    if (!['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(status)) return;
    const message = document.getElementById('adminOrdersMessage');
    button.disabled = true;
    try {
        await updateDoc(doc(db, 'orderRequests', id), { status });
        message.classList.remove('is-error');
        message.textContent = `Order ${id.slice(-8)} updated to ${status}.`;
    } catch (error) {
        message.classList.add('is-error');
        message.textContent = `Could not update order: ${error.message}`;
    } finally {
        button.disabled = false;
    }
});

onAuthStateChanged(auth, checkAdmin);
loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    authMessage.textContent = 'Signing in...';
    try {
        await signInWithEmailAndPassword(auth, loginForm.email.value.trim(), loginForm.password.value);
        authMessage.textContent = '';
    } catch (error) {
        const messages = {
            'auth/invalid-credential': 'Email or password is incorrect. Make sure this account exists under Firebase Console → Authentication → Users.',
            'auth/user-not-found': 'No Firebase Authentication user was found for this email. Create the user first or check the email.',
            'auth/wrong-password': 'The password is incorrect. Check it and try again.',
            'auth/operation-not-allowed': 'Email/password sign-in is disabled. Enable it under Firebase Console → Authentication → Sign-in method.',
            'auth/unauthorized-domain': 'This website domain is not allowed. Add localhost or your hosted domain under Firebase Console → Authentication → Settings → Authorized domains.',
            'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection and reload the page.'
        };
        authMessage.textContent = messages[error.code] || `Firebase sign-in failed (${error.code || 'unknown-error'}): ${error.message}`;
    }
});

function renderCategoryList() {
    document.getElementById('adminCategoryList').innerHTML = storeCategories.map(category =>
        `<span class="admin-category-chip">${escapeHTML(category.name)}</span>`
    ).join('');
}

document.getElementById('adminCategoryForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get('name')).trim();
    const image = String(new FormData(form).get('image')).trim();
    const id = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const message = document.getElementById('categoryMessage');
    if (!id) { message.textContent = 'Enter a category name with letters or numbers.'; message.classList.add('is-error'); return; }
    if (storeCategories.some(category => category.id === id || category.name.toLowerCase() === name.toLowerCase())) {
        message.textContent = 'That category already exists.'; message.classList.add('is-error'); return;
    }
    try {
        await setDoc(doc(db, 'appConfig', 'catalog'), { categories: [...storeCategories, { id, name, image }] }, { merge: true });
        form.reset();
        message.classList.remove('is-error');
        message.textContent = `${name} added. It is now available in the store and product editor.`;
    } catch (error) { message.textContent = `Could not add category: ${error.message}`; message.classList.add('is-error'); }
});
document.getElementById('adminSignOut').addEventListener('click', () => signOut(auth));

document.getElementById('migrateCatalog').addEventListener('click', async () => {
    const builtInProducts = window.EUREKA_BASE_PRODUCTS;
    if (!Array.isArray(builtInProducts) || builtInProducts.length === 0) {
        showMessage('The built-in product list could not be loaded. Refresh the page and try again.', true);
        return;
    }
    if (!confirm(`Import ${builtInProducts.length} built-in products into Firestore? Existing dashboard products will stay in place.`)) return;
    const button = document.getElementById('migrateCatalog');
    button.disabled = true;
    showMessage('Importing built-in products...');
    try {
        const settingsSnapshot = await getDoc(doc(db, 'appConfig', 'catalog'));
        const currentSettings = settingsSnapshot.exists() ? settingsSnapshot.data() : {};
        const categoriesToKeep = Array.isArray(currentSettings.categories) && currentSettings.categories.length
            ? currentSettings.categories
            : storeCategories;
        const savedSnapshot = await getDocs(collection(db, 'products'));
        const savedDocIds = new Set(savedSnapshot.docs.map(productDoc => productDoc.id));
        const savedProductIds = new Set(savedSnapshot.docs.map(productDoc => Number(productDoc.data().id)));
        let batch = writeBatch(db);
        let pendingWrites = 0;
        let imported = 0;
        for (const product of builtInProducts) {
            const productDocId = `builtin-${product.id}`;
            if (savedDocIds.has(productDocId) || savedProductIds.has(Number(product.id))) continue;
            batch.set(doc(db, 'products', productDocId), { ...product, source: 'built-in' });
            imported++;
            pendingWrites++;
            if (pendingWrites >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                pendingWrites = 0;
            }
        }
        batch.set(doc(db, 'appConfig', 'catalog'), {
            categories: categoriesToKeep,
            builtInCatalogMigrated: true,
            builtInProductCount: builtInProducts.length,
            migratedAt: serverTimestamp()
        });
        await batch.commit();
        showMessage(`Migration complete. Imported ${imported} products; the full catalog is now managed in Firestore.`);
    } catch (error) {
        showMessage(`Migration failed: ${error.message}`, true);
    } finally {
        button.disabled = false;
    }
});
