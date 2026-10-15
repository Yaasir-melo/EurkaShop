const products = window.EUREKA_BASE_PRODUCTS;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function safeImageUrl(value) {
    const source = String(value || '').trim();
    if (!source || source.startsWith('//')) return '';
    const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(source);
    try {
        const protocol = new URL(source, window.location.href).protocol;
        const allowedProtocols = hasExplicitScheme ? ['http:', 'https:'] : ['http:', 'https:', 'file:'];
        return allowedProtocols.includes(protocol) ? source : '';
    }
    catch { return ''; }
}
function productImageUrl(value, productId) {
    const savedImage = safeImageUrl(value);
    if (savedImage) return savedImage;
    const builtInImage = (window.EUREKA_BASE_PRODUCTS || []).find(product => Number(product.id) === Number(productId))?.image;
    return safeImageUrl(builtInImage);
}
function handleProductImageError(image, productId) {
    const fallback = (window.EUREKA_BASE_PRODUCTS || []).find(product => Number(product.id) === Number(productId))?.image;
    const fallbackUrl = safeImageUrl(fallback);
    const currentUrl = image.currentSrc || image.src;
    const resolvedFallback = fallbackUrl ? new URL(fallbackUrl, window.location.href).href : '';
    if (resolvedFallback && currentUrl !== resolvedFallback && image.dataset.fallbackTried !== 'true') {
        image.dataset.fallbackTried = 'true';
        image.src = fallbackUrl;
        return;
    }
    image.style.display = 'none';
    const placeholder = image.nextElementSibling;
    if (placeholder?.tagName === 'DIV') placeholder.style.display = 'flex';
}
window.handleProductImageError = handleProductImageError;

const moneyFormatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
function formatPrice(value) { return moneyFormatter.format(Number(value) || 0); }

window.addEventListener('eureka:remote-products', event => {
    const catalogState = event.detail || {};
    if (Array.isArray(catalogState.categories)) {
        categoryLabels = Object.fromEntries(catalogState.categories.map(category => [category.id, category.name]));
        renderCategoryFilters();
    }
    if (catalogState.categoriesReady && currentFilter !== 'all' && !Object.hasOwn(categoryLabels, currentFilter)) currentFilter = 'all';
    const remoteProducts = Array.isArray(catalogState.products) ? catalogState.products : [];
    if (catalogState.migrated) {
        products.splice(0, products.length, ...remoteProducts.map(product => ({ ...product, firestoreManaged: true })));
    } else {
        const remoteIds = new Set(remoteProducts.map(product => Number(product.id)));
        for (let i = products.length - 1; i >= 0; i--) {
            if (products[i].firestoreManaged || remoteIds.has(Number(products[i].id))) products.splice(i, 1);
        }
        remoteProducts.forEach(product => products.push({ ...product, firestoreManaged: true }));
    }
    if (document.getElementById('productPage')) renderProductPage();
    else {
        renderCategoryShowcase();
        if (productsGrid) renderProducts();
    }
    renderWishlist();
});

// Shopping cart state
let cart = [];
try {
    const savedCart = JSON.parse(localStorage.getItem('eurekaCart') || '[]');
    if (Array.isArray(savedCart)) cart = savedCart;
} catch {
    cart = [];
}
let wishlist = [];
try {
    const savedWishlist = JSON.parse(localStorage.getItem('eurekaWishlist') || '[]');
    if (Array.isArray(savedWishlist)) wishlist = [...new Set(savedWishlist.map(Number).filter(Number.isFinite))];
} catch {
    wishlist = [];
}
let categoryLabels = Object.fromEntries((window.EUREKA_BASE_CATEGORIES || []).map(category => [category.id, category.name]));
let currentFilter = new URLSearchParams(window.location.search).get('category') || 'all';

// DOM elements
const productsGrid = document.getElementById('productsGrid');
let cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
let cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const closeCart = document.getElementById('closeCart');
const clearCartButton = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const productModal = document.getElementById('productModal');
const productDetails = document.getElementById('productDetails');
const closeProduct = document.getElementById('closeProduct');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
let searchInput = document.getElementById('searchInput');
let searchBtn = document.getElementById('searchBtn');
const filterButtonsContainer = document.getElementById('categoryFilters');
let wishlistModal = null;
let productReviewUnsubscribe = null;
let activeReviewProductId = null;

function renderCategoryFilters() {
    if (!filterButtonsContainer) return;
    filterButtonsContainer.innerHTML = `<button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-category="all">All</button>` +
        Object.entries(categoryLabels).map(([id, name]) => `<button class="filter-btn ${currentFilter === id ? 'active' : ''}" data-category="${escapeHTML(id)}">${escapeHTML(name)}</button>`).join('');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // The shared header is rendered by Vue immediately before DOMContentLoaded.
    cartIcon = document.getElementById('cartIcon');
    cartCount = document.getElementById('cartCount');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    setupWishlist();
    setupEventListeners();
    updateCartDisplay();
    if (document.getElementById('productPage')) {
        renderProductPage();
        return;
    }
    renderCategoryShowcase();
    renderCategoryFilters();
    if (productsGrid) renderProducts();
    if (currentFilter !== 'all') {
        filterButtonsContainer?.querySelectorAll('.filter-btn').forEach(button => button.classList.toggle('active', button.dataset.category === currentFilter));
    }
    const addProductId = Number(new URLSearchParams(window.location.search).get('addToCart'));
    if (addProductId) {
        addToCart(addProductId);
        window.history.replaceState({}, '', `${window.location.pathname}#products`);
    }
});

function setupWishlist() {
    wishlistModal = document.getElementById('wishlistModal');
    if (!wishlistModal) {
        wishlistModal = document.createElement('div');
        wishlistModal.className = 'wishlist-modal';
        wishlistModal.id = 'wishlistModal';
        wishlistModal.setAttribute('aria-hidden', 'true');
        wishlistModal.innerHTML = `
            <section class="wishlist-content" role="dialog" aria-modal="true" aria-labelledby="wishlistTitle">
                <header class="wishlist-header"><div><p class="wishlist-eyebrow">YOUR SAVED FINDS</p><h2 id="wishlistTitle">My Wishlist</h2></div>
                    <div class="wishlist-header-actions"><button class="clear-wishlist-btn" type="button" data-wishlist-clear>Clear all</button>
                    <button class="close-wishlist" type="button" aria-label="Close wishlist">&times;</button></div></header>
                <div class="wishlist-items" id="wishlistItems"></div>
            </section>`;
        document.body.append(wishlistModal);
    }
    document.getElementById('wishlistToggle')?.addEventListener('click', openWishlist);
    wishlistModal.querySelector('.close-wishlist')?.addEventListener('click', closeWishlist);
    wishlistModal.addEventListener('click', event => {
        if (event.target.closest('[data-wishlist-clear]')) {
            clearWishlist();
            return;
        }
        const removeButton = event.target.closest('[data-wishlist-remove]');
        if (removeButton) {
            const productId = Number(removeButton.dataset.wishlistRemove);
            const product = products.find(item => Number(item.id) === productId);
            const productName = product?.title || 'this product';
            if (window.confirm(`Are you sure you want to remove “${productName}” from your wishlist?`)) {
                toggleWishlist(productId);
            }
        }
        if (event.target === wishlistModal) closeWishlist();
    });
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && wishlistModal.classList.contains('show')) closeWishlist();
    });
    updateWishlistCount();
    renderWishlist();
}

function openWishlist() {
    if (!wishlistModal) return;
    renderWishlist();
    wishlistModal.classList.add('show');
    wishlistModal.setAttribute('aria-hidden', 'false');
    wishlistModal.querySelector('.close-wishlist')?.focus();
}

function closeWishlist() {
    if (!wishlistModal) return;
    wishlistModal.classList.remove('show');
    wishlistModal.setAttribute('aria-hidden', 'true');
    document.getElementById('wishlistToggle')?.focus();
}

function updateWishlistCount() {
    const count = document.getElementById('wishlistCount');
    if (!count) return;
    count.textContent = wishlist.length;
    count.hidden = wishlist.length === 0;
}

function renderWishlist() {
    const list = document.getElementById('wishlistItems');
    if (!list) return;
    const clearButton = wishlistModal?.querySelector('[data-wishlist-clear]');
    if (clearButton) clearButton.disabled = wishlist.length === 0;
    const savedProducts = wishlist.map(id => products.find(product => Number(product.id) === id)).filter(Boolean);
    if (!savedProducts.length) {
        list.innerHTML = '<div class="wishlist-empty"><i class="far fa-heart" aria-hidden="true"></i><h3>Your wishlist is empty</h3><p>Tap the heart on a product to save it here.</p><a href="products.html" class="wishlist-shop-link">Browse products</a></div>';
        return;
    }
    list.innerHTML = savedProducts.map(product => `
        <article class="wishlist-item">
            <a class="wishlist-item-photo" href="product.html?id=${Number(product.id)}" aria-label="View ${escapeHTML(product.title)}">
                <img src="${escapeHTML(productImageUrl(product.featuredImage || product.image, product.id))}" alt="${escapeHTML(product.title)}" onerror="handleProductImageError(this, ${Number(product.id)});">
            </a>
            <div class="wishlist-item-info"><a href="product.html?id=${Number(product.id)}" class="wishlist-item-title">${escapeHTML(product.title)}</a><span>${formatPrice(product.price)}</span>
                <div class="wishlist-item-actions"><button type="button" class="wishlist-add-btn" onclick="addToCart(${Number(product.id)})" ${product.inStock === false ? 'disabled' : ''}>Add to cart</button><button type="button" class="wishlist-remove-btn" data-wishlist-remove="${Number(product.id)}">Remove</button></div>
            </div>
        </article>`).join('');
}

function clearWishlist() {
    if (wishlist.length === 0) return;
    if (!window.confirm('Are you sure you want to remove all products from your wishlist?')) return;
    wishlist = [];
    try { localStorage.setItem('eurekaWishlist', JSON.stringify(wishlist)); } catch { /* Keep this session's wishlist if storage is unavailable. */ }
    updateWishlistCount();
    renderWishlist();
    if (productsGrid) renderProducts();
    if (document.getElementById('productPage')) renderProductPage();
    showNotification('Your wishlist has been cleared.', 'info');
}

function renderCategoryShowcase() {
    const showcase = document.getElementById('categoryShowcase');
    const feature = document.getElementById('welcomeFeature');
    if (!showcase || !feature) return;
    const featuredProduct = products.find(product => product.featured) || products.find(product => product.category === 'home') || products[0];
    const featureImage = productImageUrl(featuredProduct?.featuredImage || featuredProduct?.image, featuredProduct?.id);
    let featurePhoto = feature.querySelector('.welcome-feature-image');
    if (featureImage && featuredProduct) {
        if (!featurePhoto) {
            featurePhoto = document.createElement('img');
            featurePhoto.className = 'welcome-feature-image';
            featurePhoto.alt = '';
            featurePhoto.setAttribute('aria-hidden', 'true');
            feature.prepend(featurePhoto);
        }
        featurePhoto.onerror = () => handleProductImageError(featurePhoto, featuredProduct.id);
        featurePhoto.src = featureImage;
    } else {
        featurePhoto?.remove();
    }
    showcase.innerHTML = Object.entries(categoryLabels).map(([category, label]) => {
        const product = products.find(item => item.category === category);
        const categoryImage = productImageUrl(product?.featuredImage || product?.image || (window.EUREKA_BASE_CATEGORIES || []).find(item => item.id === category)?.image, product?.id);
        return `<a class="category-tile category-${escapeHTML(category)}" href="products.html?category=${encodeURIComponent(category)}" data-shop-category="${escapeHTML(category)}">
            ${categoryImage ? `<img class="category-tile-image" src="${escapeHTML(categoryImage)}" alt="" aria-hidden="true" onerror="handleProductImageError(this, ${Number(product?.id)});">` : ''}
            <span>${escapeHTML(label)}</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
        </a>`;
    }).join('');
}

function renderProductPage() {
    const params = new URLSearchParams(window.location.search);
    const product = products.find(item => item.id === Number(params.get('id')));
    const root = document.getElementById('productPage');
    if (!product) {
        document.title = 'Product not found | Eureka Shop';
        root.innerHTML = `<div class="product-not-found"><h1>We couldn't find that product.</h1><a href="index.html">Back to Eureka Shop</a></div>`;
        return;
    }
    document.title = `${product.title} | Eureka Shop`;
    const label = categoryLabels[product.category] || product.category;
    const galleryImages = [...new Set([product.featuredImage || product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean))];
    const variations = Array.isArray(product.variations) ? product.variations : [];
    root.innerHTML = `
        <nav class="product-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="products.html?category=${encodeURIComponent(product.category)}#products">${escapeHTML(label)}</a><span>/</span><span>${escapeHTML(product.title)}</span></nav>
        <article class="product-page-card">
            <div class="product-gallery"><div class="product-page-image"><img id="productGalleryMain" src="${escapeHTML(productImageUrl(galleryImages[0] || product.image, product.id))}" alt="${escapeHTML(product.title)}" onerror="handleProductImageError(this, ${Number(product.id)});" /></div>
                ${galleryImages.length > 1 ? `<div class="product-gallery-thumbnails">${galleryImages.map((image, index) => `<button type="button" class="product-gallery-thumb ${index === 0 ? 'active' : ''}" data-product-image="${escapeHTML(productImageUrl(image, product.id))}" aria-label="View product photo ${index + 1}"><img src="${escapeHTML(productImageUrl(image, product.id))}" alt=""></button>`).join('')}</div>` : ''}
            </div>
            <div class="product-page-info">
                <span class="product-category-label">${escapeHTML(label)}</span>
                ${product.featured ? '<span class="store-featured-label"><i class="fas fa-star"></i> Featured</span>' : ''}
                <h1>${escapeHTML(product.title)}</h1>
                <div class="product-rating"><span class="stars">${generateStars(product.rating)}</span><span class="rating-text">${product.rating} · ${product.reviews} reviews</span></div>
                <p class="product-page-price">${formatPrice(product.price)}</p>
                <p class="product-page-description">${escapeHTML(product.description)}</p>
                ${variations.length ? `<div class="product-variation-selectors">${variations.map(group => `<label>${escapeHTML(group.name)}<select data-variation-option="${escapeHTML(group.name)}" required><option value="">Choose ${escapeHTML(group.name)}</option>${(group.values || []).map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}</select></label>`).join('')}</div>` : ''}
                <div class="product-facts"><div><span>Category</span><strong>${escapeHTML(label)}</strong></div><div><span>Availability</span><strong>${product.inStock ? 'In stock' : 'Currently unavailable'}</strong></div><div><span>Customer rating</span><strong>${Number(product.rating) || 0} out of 5</strong></div><div><span>Reviews</span><strong>${Number(product.reviews) || 0}</strong></div></div>
                <button class="product-page-add" type="button" onclick="addToCart(${Number(product.id)}, true)" ${product.inStock === false ? 'disabled' : ''}><i class="fas fa-shopping-cart"></i> Add to cart</button>
                <p class="product-page-note">See the full product collection and your cart at Eureka Shop.</p>
            </div>
        </article>
        <section class="product-review-panel"><h2>Customer reviews</h2><p class="review-summary">${generateStars(product.rating)} <strong>${product.rating} out of 5</strong> · Based on ${product.reviews} reviews</p>
            <div class="product-reviews">${(Array.isArray(product.reviewsList) ? product.reviewsList : []).map(review => `<article class="product-review"><div><strong>${escapeHTML(review.user)}</strong><span>${generateStars(review.rating)}</span></div><p>${escapeHTML(review.comment)}</p></article>`).join('')}</div>
            <div class="review-auth-prompt" id="reviewAuthPrompt"><p>Sign in or create an account to rate and review this product.</p><button type="button" id="reviewSignInBtn">Sign in / Sign up</button></div>
            <form class="product-review-form" id="productReviewForm" hidden>
                <h3>Write a review</h3>
                <label>Your name<input name="reviewerName" type="text" maxlength="60" autocomplete="name" required></label>
                <fieldset class="rating-star-picker"><legend>Your rating</legend>
                    <input id="reviewRating5" name="rating" type="radio" value="5" required><label for="reviewRating5" aria-label="5 stars">★</label>
                    <input id="reviewRating4" name="rating" type="radio" value="4"><label for="reviewRating4" aria-label="4 stars">★</label>
                    <input id="reviewRating3" name="rating" type="radio" value="3"><label for="reviewRating3" aria-label="3 stars">★</label>
                    <input id="reviewRating2" name="rating" type="radio" value="2"><label for="reviewRating2" aria-label="2 stars">★</label>
                    <input id="reviewRating1" name="rating" type="radio" value="1"><label for="reviewRating1" aria-label="1 star">★</label>
                </fieldset>
                <label>Your review<textarea name="comment" rows="4" minlength="5" maxlength="1000" required placeholder="Share your experience with this product"></textarea></label>
                <button type="submit" class="submit-review-btn">Submit review</button>
                <p id="productReviewMessage" class="review-form-message" role="status" aria-live="polite"></p>
            </form>
        </section>`;
    setupProductReviewForm(product);
    root.querySelectorAll('[data-product-image]').forEach(button => button.addEventListener('click', () => {
        root.querySelector('#productGalleryMain').src = productImageUrl(button.dataset.productImage, product.id);
        root.querySelectorAll('.product-gallery-thumb').forEach(thumb => thumb.classList.toggle('active', thumb === button));
    }));
}

function setupProductReviewForm(product) {
    const root = document.getElementById('productPage');
    const form = root?.querySelector('#productReviewForm');
    if (!form) return;
    const authPrompt = root.querySelector('#reviewAuthPrompt');
    const updateAuthState = () => {
        const signedIn = Boolean(window.eurekaCurrentUser);
        form.hidden = !signedIn;
        authPrompt.hidden = signedIn;
    };
    root.querySelector('#reviewSignInBtn')?.addEventListener('click', () => document.getElementById('accountBtn')?.click());
    window.addEventListener('eureka:auth-state', updateAuthState);
    updateAuthState();
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const message = form.querySelector('#productReviewMessage');
        const submitButton = form.querySelector('[type="submit"]');
        const formData = new FormData(form);
        message.textContent = '';
        submitButton.disabled = true;
        try {
            if (!window.eurekaCurrentUser) throw new Error('Sign in or create an account before submitting a review.');
            if (typeof window.submitEurekaProductReview !== 'function') throw new Error('Reviews are not available right now. Please try again later.');
            await window.submitEurekaProductReview({ productId: product.id, name: formData.get('reviewerName'), rating: formData.get('rating'), comment: formData.get('comment') });
            form.reset();
            message.textContent = 'Thanks! Your review has been submitted.';
            showNotification('Your review was submitted.', 'success');
        } catch (error) {
            message.textContent = error.message || 'We could not submit your review. Please try again.';
        } finally {
            submitButton.disabled = false;
        }
    });
    if (activeReviewProductId === Number(product.id)) return;
    productReviewUnsubscribe?.();
    activeReviewProductId = Number(product.id);
    if (typeof window.watchEurekaProductReviews !== 'function') return;
    productReviewUnsubscribe = window.watchEurekaProductReviews(product.id, reviews => {
        const sortedReviews = reviews.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const legacyReviews = Array.isArray(product.reviewsList) ? product.reviewsList : [];
        const baseCount = Number(product.reviews) || 0;
        const totalCount = baseCount + sortedReviews.length;
        const totalScore = (baseCount * (Number(product.rating) || 0)) + sortedReviews.reduce((sum, review) => sum + Number(review.rating), 0);
        const average = totalCount ? totalScore / totalCount : 0;
        const summary = root.querySelector('.review-summary');
        if (summary) summary.innerHTML = `${generateStars(average)} <strong>${average.toFixed(1)} out of 5</strong> · Based on ${totalCount} reviews`;
        const list = root.querySelector('.product-reviews');
        if (list) {
            list.innerHTML = [...legacyReviews.map(review => ({ name: review.user || 'Shopper', rating: review.rating, comment: review.comment })), ...sortedReviews].map(review =>
                `<article class="product-review"><div><strong>${escapeHTML(review.name || 'Shopper')}</strong><span>${generateStars(review.rating)}</span></div><p>${escapeHTML(review.comment)}</p></article>`
            ).join('') || '<p class="no-product-reviews">No reviews yet. Be the first to review this product.</p>';
        }
    }, error => console.error('Could not load product reviews.', error));
}

// Setup event listeners
function setupEventListeners() {
    const authModalElement = document.getElementById('authModal');
    const accountButton = document.getElementById('accountBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginFormElement = document.getElementById('loginForm');
    const signupFormElement = document.getElementById('signupForm');
    const authTitleElement = document.getElementById('authTitle');
    const activateAuthTab = tab => {
        authTabs.forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
        if (loginFormElement) loginFormElement.style.display = tab === 'login' ? '' : 'none';
        if (signupFormElement) signupFormElement.style.display = tab === 'signup' ? '' : 'none';
        if (authTitleElement) authTitleElement.textContent = tab === 'login' ? 'Sign In' : 'Sign Up';
    };
    const requireSignedInForCheckout = async () => {
        if (typeof window.ensureVerifiedUser !== 'function') {
            if (authModalElement) {
                authModalElement.classList.add('show');
                activateAuthTab('login');
            }
            showNotification('Please sign in or create an account before checkout.', 'info');
            return false;
        }
        try {
            await window.ensureVerifiedUser();
            return true;
        } catch {
            return false;
        }
    };
    accountButton?.addEventListener('click', () => {
        if (window.eurekaAuthReady || !authModalElement) return;
        authModalElement.classList.add('show');
        activateAuthTab(accountButton.dataset.openSignup === 'true' ? 'signup' : 'login');
    });
    document.getElementById('closeAuth')?.addEventListener('click', () => authModalElement?.classList.remove('show'));
    authTabs.forEach(button => button.addEventListener('click', () => activateAuthTab(button.dataset.tab)));

    if (productsGrid) productsGrid.addEventListener('click', event => {
        if (event.target.closest('button')) return;
        const card = event.target.closest('.product-card');
        if (card) window.location.href = `product.html?id=${card.dataset.id}`;
    });
    if (productsGrid) productsGrid.addEventListener('keydown', event => {
        if (event.target.closest('button, a')) return;
        const card = event.target.closest('.product-card');
        if (card && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            window.location.href = `product.html?id=${card.dataset.id}`;
        }
    });
    const showcase = document.getElementById('categoryShowcase');
    if (showcase) showcase.addEventListener('click', event => {
        const tile = event.target.closest('[data-shop-category]');
        if (!tile || !productsGrid) return;
        event.preventDefault();
        currentFilter = tile.dataset.shopCategory;
        filterButtonsContainer?.querySelectorAll('.filter-btn').forEach(button => button.classList.toggle('active', button.dataset.category === currentFilter));
        renderProducts();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState({}, '', `products.html?category=${encodeURIComponent(currentFilter)}#products`);
    });
    // Cart modal
    cartIcon?.addEventListener('click', () => cartModal.classList.add('show'));
    closeCart?.addEventListener('click', () => cartModal.classList.remove('show'));
    clearCartButton?.addEventListener('click', clearCart);
    
    // Product modal
    closeProduct?.addEventListener('click', () => productModal.classList.remove('show'));
    
    // Checkout modal
    checkoutBtn?.addEventListener('click', async () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty.', 'info');
            return;
        }
        cartModal.classList.remove('show');
        if (!(await requireSignedInForCheckout())) return;
        checkoutModal.classList.add('show');
    });
    closeCheckout?.addEventListener('click', () => checkoutModal.classList.remove('show'));
    
    // Checkout form
    checkoutForm?.addEventListener('submit', handleCheckout);
    
    // Search functionality
    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Filter buttons
    filterButtonsContainer?.addEventListener('click', event => {
        const button = event.target.closest('.filter-btn');
        if (!button) return;
        currentFilter = button.dataset.category;
        filterButtonsContainer.querySelectorAll('.filter-btn').forEach(filterButton => filterButton.classList.toggle('active', filterButton === button));
        renderProducts();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModalElement) authModalElement.classList.remove('show');
        if (e.target === cartModal) cartModal.classList.remove('show');
        if (e.target === productModal) productModal.classList.remove('show');
        if (e.target === checkoutModal) checkoutModal.classList.remove('show');
    });
}

// Render products based on current filter and search
function renderProducts() {
    let filteredProducts = products;
    
    // Apply category filter
    if (currentFilter !== 'all') {
        filteredProducts = products.filter(product => product.category === currentFilter);
    }
    
    // Apply search filter
    // The Vue header provides search on the shop page. Keep the catalog visible
    // if that external Vue module fails to load or the search input is absent.
    const searchTerm = searchInput?.value?.toLowerCase() || '';
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Render products
    productsGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-id="${Number(product.id)}" tabindex="0" role="link" aria-label="View ${escapeHTML(product.title)} details">
            <div class="product-image">
                <img src="${escapeHTML(productImageUrl(product.featuredImage || product.image, product.id))}" alt="${escapeHTML(product.title)}" loading="lazy" onerror="handleProductImageError(this, ${Number(product.id)});">
                <div class="product-image-fallback" style="display: none; align-items: center; justify-content: center; font-size: 4rem; color: #adb5bd;">
                    <i class="fas fa-image"></i>
                </div>
                ${product.featured ? '<span class="store-featured-label"><i class="fas fa-star"></i> Featured</span>' : ''}
                <button class="wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}" onclick="toggleWishlist(${Number(product.id)})">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHTML(product.title)}</h3>
                <p class="product-description">${escapeHTML(product.description)}</p>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStars(product.rating)}
                    </div>
                    <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
                </div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-actions">
                    <button class="add-to-cart" onclick="addToCart(${Number(product.id)})" ${product.inStock === false ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <a class="view-details" href="product.html?id=${Number(product.id)}" onclick="event.stopPropagation()">
                        <i class="fas fa-eye"></i> View
                    </a>
                </div>
            </div>
        </article>
    `).join('');
}

// Add products to the cart before sign-in; sign-in is required at checkout.
async function addToCart(productId, fromProductPage = false) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const variations = Array.isArray(product.variations) ? product.variations : [];
    if (variations.length && !fromProductPage) {
        window.location.href = `product.html?id=${productId}`;
        return;
    }
    const selectedOptions = {};
    if (variations.length) {
        for (const group of variations) {
            const select = document.querySelector(`[data-variation-option="${CSS.escape(group.name)}"]`);
            if (!select?.value) {
                showNotification(`Please choose ${group.name} before adding this product.`, 'info');
                return;
            }
            selectedOptions[group.name] = select.value;
        }
    }
    const selectedKey = JSON.stringify(selectedOptions);
    const existingIndex = cart.findIndex(item => item.id === productId && JSON.stringify(item.selectedOptions || {}) === selectedKey);
    if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            ...product,
            image: product.featuredImage || product.image,
            selectedOptions,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showNotification(`${product.title} added to cart!`);
}

// Remove product from cart
function removeFromCart(cartIndex) {
    const item = cart[cartIndex];
    if (!item) return;
    if (!confirm(`Are you sure you want to remove "${item.title}" from your cart?`)) return;
    cart.splice(cartIndex, 1);
    updateCartDisplay();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!window.confirm('Are you sure you want to remove all products from your cart?')) return;
    cart = [];
    updateCartDisplay();
    showNotification('Your cart has been cleared.', 'info');
}

// Update quantity in cart
function updateQuantity(cartIndex, change) {
    const item = cart[cartIndex];
    if (!item) return;
    if (item.quantity + change <= 0) {
        removeFromCart(cartIndex);
    } else {
        item.quantity += change;
        updateCartDisplay();
    }
}

// Update cart display
function updateCartDisplay() {
    try { localStorage.setItem('eurekaCart', JSON.stringify(cart)); } catch { /* Storage can be unavailable in private browsing. */ }
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    if (clearCartButton) clearCartButton.disabled = cart.length === 0;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
        cartTotal.textContent = formatPrice(0);
        return;
    }
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${escapeHTML(productImageUrl(item.image, item.id))}" alt="${escapeHTML(item.title)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="handleProductImageError(this, ${Number(item.id)});">
                <div style="display: none; align-items: center; justify-content: center; font-size: 1.5rem; color: #adb5bd;">
                    <i class="fas fa-image"></i>
                </div>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-title">${escapeHTML(item.title)}</div>
                ${Object.keys(item.selectedOptions || {}).length ? `<div class="cart-item-variations">${Object.entries(item.selectedOptions).map(([name, value]) => `${escapeHTML(name)}: ${escapeHTML(value)}`).join(' · ')}</div>` : ''}
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})" aria-label="Remove ${escapeHTML(item.title)} from cart">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);
}

// View product details
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    productDetails.innerHTML = `
        <div class="product-detail-image">
            <img src="${escapeHTML(productImageUrl(product.image, product.id))}" alt="${escapeHTML(product.title)}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;" onerror="handleProductImageError(this, ${Number(product.id)});">
            <div style="display: none; align-items: center; justify-content: center; font-size: 4rem; color: #adb5bd;">
                <i class="fas fa-image"></i>
            </div>
        </div>
        <div class="product-detail-info">
            <h3>${escapeHTML(product.title)}</h3>
            <div class="product-detail-rating">
                <div class="stars">
                    ${generateStars(product.rating)}
                </div>
                <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
            </div>
            <div class="product-detail-price">${formatPrice(product.price)}</div>
            <div class="product-detail-description">${escapeHTML(product.description)}</div>
            <div class="product-actions" style="margin-top: 2rem;">
                <button class="add-to-cart" onclick="addToCart(${Number(product.id)}); productModal.classList.remove('show');">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}" onclick="toggleWishlist(${Number(product.id)})">
                    <i class="fas fa-heart"></i> ${wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
            </div>
            <div class="reviews-section" style="margin-top: 2rem;">
                <h4>Customer Reviews</h4>
                <div class="reviews-list">
                    ${(Array.isArray(product.reviewsList) ? product.reviewsList : []).map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="review-user">${escapeHTML(review.user)}</span>
                                <div class="review-stars">${generateStars(review.rating)}</div>
                            </div>
                            <p class="review-comment">${escapeHTML(review.comment)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    productModal.classList.add('show');
}

// Handle search
function handleSearch() {
    renderProducts();
}

// Handle checkout (gated by verified user)
async function handleCheckout(e) {
    e.preventDefault();
    if (typeof window.ensureVerifiedUser !== 'function') {
        document.getElementById('checkoutModal')?.classList.remove('show');
        const authModal = document.getElementById('authModal');
        authModal?.classList.add('show');
        document.querySelector('.auth-tab[data-tab="login"]')?.click();
        showNotification('Please sign in or create an account before checkout.', 'info');
        return;
    }
    try { await window.ensureVerifiedUser(); } catch { return; }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    if (typeof window.submitEurekaOrderRequest !== 'function') {
        showNotification('Order requests are unavailable right now. Please try again later.', 'error');
        return;
    }
    const submitButton = checkoutForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Sending request...';
    try {
        const result = await window.submitEurekaOrderRequest({
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            items: cart.map(item => ({ productId: Number(item.id), title: String(item.title), quantity: Number(item.quantity), options: item.selectedOptions || {} }))
        });
        cart = [];
        updateCartDisplay();
        checkoutModal.classList.remove('show');
        checkoutForm.reset();
        showNotification(`Order request sent (${result.id}). The shop will contact you to confirm price and payment. No payment was taken.`, 'success');
    } catch (error) {
        console.error('Could not send order request.', error);
        const code = error?.code || 'unknown-error';
        const help = code === 'permission-denied'
            ? 'Firebase rejected the request. Check that the latest docs/firestore.rules were published.'
            : code === 'unavailable' || code === 'network-request-failed'
                ? 'Firebase could not be reached. Check your internet connection and try again.'
                : `Firebase reported ${code}.`;
        showNotification(`Could not send order request. ${help} Your cart is still saved.`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Send order request';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const notificationContent = document.createElement('div');
    notificationContent.className = 'notification-content';
    const notificationIcon = document.createElement('i');
    notificationIcon.className = `fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}`;
    notificationIcon.setAttribute('aria-hidden', 'true');
    const notificationText = document.createElement('span');
    notificationText.textContent = message;
    notificationContent.append(notificationIcon, notificationText);
    notification.append(notificationContent);
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#00bcd4' : '#0097a7'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Toggle wishlist
function toggleWishlist(productId) {
    productId = Number(productId);
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        showNotification('Removed from wishlist', 'info');
    } else {
        wishlist.push(productId);
        showNotification('Added to wishlist', 'success');
    }
    try { localStorage.setItem('eurekaWishlist', JSON.stringify(wishlist)); } catch { /* Keep this session's wishlist if storage is unavailable. */ }
    updateWishlistCount();
    renderWishlist();
    renderProducts(); // Re-render to update wishlist button state
}

// Scroll to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to product cards
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.product-card')) {
            e.target.closest('.product-card').style.transform = 'translateY(-5px)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.product-card')) {
            e.target.closest('.product-card').style.transform = 'translateY(0)';
        }
    });
    
});
