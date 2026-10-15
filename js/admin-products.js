import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const loginPanel = document.getElementById('adminLoginPanel');
const appPanel = document.getElementById('adminProductsApp');
const loginForm = document.getElementById('adminLoginForm');
const authMessage = document.getElementById('adminAuthMessage');
const listMessage = document.getElementById('adminListMessage');
const productRows = document.getElementById('adminProductRows');
const searchInput = document.getElementById('adminProductSearch');
const categoryFilter = document.getElementById('adminCategoryFilter');
let categoryNames = Object.fromEntries((window.EUREKA_BASE_CATEGORIES || []).map(category => [category.id, category.name]));
let allProducts = [];
let stopProductsListener = null;
let stopSettingsListener = null;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

const moneyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

function renderProducts() {
    const term = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const visible = allProducts.filter(({ product }) =>
        (category === 'all' || product.category === category) &&
        (!term || `${product.title} ${product.description}`.toLowerCase().includes(term))
    );
    document.getElementById('adminProductCount').textContent = allProducts.length;
    document.getElementById('adminEmpty').hidden = visible.length > 0;
    productRows.innerHTML = visible.map(({ id, product }) => {
        const image = product.featuredImage || product.image;
        const featured = product.featured ? '<span class="admin-featured-label"><i class="fas fa-star"></i> Featured</span>' : '';
        const variantCount = Array.isArray(product.variations) ? product.variations.length : 0;
        return `<tr>
            <td><a class="admin-table-photo" href="admin-product.html?id=${encodeURIComponent(id)}"><img src="${escapeHTML(image || '')}" alt="" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span hidden><i class="fas fa-image"></i></span></a></td>
            <td><strong>${escapeHTML(product.title)}</strong><br>${featured}</td>
            <td>${escapeHTML(categoryNames[product.category] || product.category)}</td>
            <td>${moneyFormatter.format(Number(product.price) || 0)}</td>
            <td>${variantCount}</td>
            <td class="admin-table-actions"><div class="admin-action-buttons"><a class="admin-edit" href="admin-product.html?id=${encodeURIComponent(id)}" aria-label="Edit ${escapeHTML(product.title)}"><i class="fas fa-pen"></i><span>Edit</span></a><button class="admin-delete" type="button" data-delete-id="${escapeHTML(id)}" data-product-title="${escapeHTML(product.title)}" aria-label="Delete ${escapeHTML(product.title)}"><i class="fas fa-trash"></i><span>Delete</span></button></div></td>
        </tr>`;
    }).join('');
}

async function checkAdmin(user) {
    if (!user) {
        stopProductsListener?.();
        stopSettingsListener?.();
        appPanel.hidden = true;
        loginPanel.hidden = false;
        return;
    }
    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists()) {
            await signOut(auth);
            authMessage.textContent = 'This account does not have admin access.';
            return;
        }
        loginPanel.hidden = true;
        appPanel.hidden = false;
        document.getElementById('adminSignedInAs').textContent = `Signed in as ${user.email || 'Admin'}`;
        stopProductsListener?.();
        stopSettingsListener?.();
        stopProductsListener = onSnapshot(collection(db, 'products'), snapshot => {
            allProducts = snapshot.docs.map(productDoc => ({ id: productDoc.id, product: productDoc.data() }));
            renderProducts();
        }, error => { listMessage.textContent = error.message; });
        stopSettingsListener = onSnapshot(doc(db, 'appConfig', 'catalog'), snapshot => {
            const settings = snapshot.exists() ? snapshot.data() : {};
            const categories = Array.isArray(settings.categories) && settings.categories.length ? settings.categories : (window.EUREKA_BASE_CATEGORIES || []);
            categoryNames = Object.fromEntries(categories.map(category => [category.id, category.name]));
            const selectedCategory = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="all">All categories</option>' + categories.map(category => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`).join('');
            if (categories.some(category => category.id === selectedCategory)) categoryFilter.value = selectedCategory;
            renderProducts();
        }, error => { listMessage.textContent = error.message; });
    } catch (error) {
        await signOut(auth);
        authMessage.textContent = `Could not verify admin access: ${error.message}`;
    }
}

onAuthStateChanged(auth, checkAdmin);
loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    authMessage.textContent = 'Signing in...';
    try {
        await signInWithEmailAndPassword(auth, loginForm.email.value.trim(), loginForm.password.value);
        authMessage.textContent = '';
    } catch (error) { authMessage.textContent = error.message; }
});
document.getElementById('adminSignOut').addEventListener('click', () => signOut(auth));
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

productRows.addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;
    const title = button.dataset.productTitle;
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove it from the shop.`)) return;
    button.disabled = true;
    try {
        await deleteDoc(doc(db, 'products', button.dataset.deleteId));
        listMessage.textContent = `${title} was deleted.`;
    } catch (error) {
        listMessage.textContent = `Could not delete product: ${error.message}`;
        button.disabled = false;
    }
});
