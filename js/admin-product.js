import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { addDoc, collection, doc, getDoc, onSnapshot, updateDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const loginPanel = document.getElementById('adminLoginPanel');
const editorApp = document.getElementById('adminEditorApp');
const loginForm = document.getElementById('adminLoginForm');
const productForm = document.getElementById('adminProductForm');
const authMessage = document.getElementById('adminAuthMessage');
const productMessage = document.getElementById('adminProductMessage');
const productDocId = new URLSearchParams(location.search).get('id');
let existingProduct = null;
let loadedForUser = null;
let stopCategoryListener = null;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function showMessage(message, isError = false) {
    productMessage.textContent = message;
    productMessage.classList.toggle('is-error', isError);
}

function parseVariations(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.map(line => {
        const separator = line.indexOf(':');
        if (separator < 1) throw new Error(`Use “Name: Value, Value” for variations. Check: ${line}`);
        const name = line.slice(0, separator).trim();
        const values = line.slice(separator + 1).split(',').map(value => value.trim()).filter(Boolean);
        if (!name || values.length === 0) throw new Error(`Add at least one value for the ${name || 'unnamed'} variation.`);
        return { name, values };
    });
}

function populateForm(product) {
    for (const name of ['title', 'description', 'price', 'category']) productForm.elements[name].value = product[name] ?? '';
    productForm.elements.featuredImage.value = product.featuredImage || product.image || '';
    const mainImage = product.featuredImage || product.image || '';
    const extraImages = (Array.isArray(product.images) ? product.images : []).filter(image => image && image !== mainImage);
    productForm.elements.images.value = extraImages.join('\n');
    productForm.elements.variations.value = (Array.isArray(product.variations) ? product.variations : [])
        .map(group => `${group.name}: ${(group.values || []).join(', ')}`).join('\n');
    productForm.elements.featured.checked = product.featured === true;
    productForm.elements.inStock.checked = product.inStock !== false;
}

function populateCategories(categories) {
    const select = productForm.elements.category;
    const selected = existingProduct?.category || select.value;
    select.innerHTML = '<option value="">Choose category</option>' + categories.map(category =>
        `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`
    ).join('');
    if (categories.some(category => category.id === selected)) select.value = selected;
}

async function verifyAndLoad(user) {
    if (!user) {
        stopCategoryListener?.();
        editorApp.hidden = true;
        loginPanel.hidden = false;
        loadedForUser = null;
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
        editorApp.hidden = false;
        document.getElementById('adminSignedInAs').textContent = `Signed in as ${user.email || 'Admin'}`;
        stopCategoryListener?.();
        stopCategoryListener = onSnapshot(doc(db, 'appConfig', 'catalog'), snapshot => {
            const settings = snapshot.exists() ? snapshot.data() : {};
            const categories = Array.isArray(settings.categories) && settings.categories.length ? settings.categories : (window.EUREKA_BASE_CATEGORIES || []);
            populateCategories(categories);
        }, error => showMessage(`Could not load categories: ${error.message}`, true));
        if (loadedForUser === user.uid) return;
        loadedForUser = user.uid;
        if (productDocId) {
            const productSnapshot = await getDoc(doc(db, 'products', productDocId));
            if (!productSnapshot.exists()) {
                showMessage('This product no longer exists.', true);
                productForm.querySelector('button[type="submit"]').disabled = true;
                return;
            }
            existingProduct = productSnapshot.data();
            populateForm(existingProduct);
            document.getElementById('adminEditorTitle').textContent = 'Edit product';
            document.getElementById('adminSaveLabel').textContent = 'Save changes';
            document.title = 'Edit Product | Eureka Shop';
        }
    } catch (error) {
        await signOut(auth);
        authMessage.textContent = `Could not verify admin access: ${error.message}`;
    }
}

onAuthStateChanged(auth, verifyAndLoad);
loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    authMessage.textContent = 'Signing in...';
    try {
        await signInWithEmailAndPassword(auth, loginForm.email.value.trim(), loginForm.password.value);
        authMessage.textContent = '';
    } catch (error) { authMessage.textContent = error.message; }
});

productForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(productForm);
    const featuredImage = String(data.get('featuredImage')).trim();
    const images = String(data.get('images')).split(/\r?\n/).map(image => image.trim()).filter(Boolean);
    let variations;
    try { variations = parseVariations(String(data.get('variations') || '')); }
    catch (error) { showMessage(error.message, true); return; }
    const price = Number(data.get('price'));
    if (!Number.isFinite(price) || price <= 0) { showMessage('Enter a valid price greater than zero.', true); return; }

    const product = {
        ...existingProduct,
        title: String(data.get('title')).trim(),
        description: String(data.get('description')).trim(),
        price,
        category: String(data.get('category')),
        image: featuredImage || images[0] || existingProduct?.image || './product-images/add-your-image-here.jpg',
        featuredImage: featuredImage || images[0] || existingProduct?.image || './product-images/add-your-image-here.jpg',
        images: [...new Set([featuredImage, ...images].filter(Boolean))],
        variations,
        featured: productForm.elements.featured.checked,
        inStock: productForm.elements.inStock.checked,
        rating: existingProduct?.rating ?? 0,
        reviews: existingProduct?.reviews ?? 0,
        reviewsList: existingProduct?.reviewsList ?? []
    };
    if (!productDocId) product.id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    if (!product.title || !product.description) { showMessage('Enter a product name and description.', true); return; }

    const saveButton = productForm.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    try {
        if (productDocId) await updateDoc(doc(db, 'products', productDocId), product);
        else await addDoc(collection(db, 'products'), product);
        showMessage('Product saved. Returning to the product list...');
        setTimeout(() => { location.href = 'admin-products.html'; }, 700);
    } catch (error) {
        showMessage(`Could not save product: ${error.message}`, true);
        saveButton.disabled = false;
    }
});
