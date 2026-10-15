import { auth, db } from './firebase.js';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

window.submitEurekaOrderRequest = async ({ fullName, phone, address, items }) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Please sign in before sending an order request.');
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
        throw new Error('Your cart must contain between 1 and 30 items.');
    }

    return addDoc(collection(db, 'orderRequests'), {
        userId: user.uid,
        email: user.email || '',
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
        items: items.map(item => ({
            productId: Number(item.productId),
            title: String(item.title).slice(0, 120),
            quantity: Number(item.quantity),
            options: item.options && typeof item.options === 'object' ? item.options : {}
        })),
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

window.submitEurekaProductReview = async ({ productId, name, rating, comment }) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in or create an account before submitting a review.');
    const score = Number(rating);
    const reviewerName = String(name || '').trim();
    const reviewText = String(comment || '').trim();
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Choose a rating from 1 to 5 stars.');
    if (!reviewerName || reviewerName.length > 60) throw new Error('Enter a name of 1 to 60 characters.');
    if (reviewText.length < 5 || reviewText.length > 1000) throw new Error('Your review must be between 5 and 1,000 characters.');
    return addDoc(collection(db, 'productReviews'), {
        productId: Number(productId),
        userId: user.uid,
        name: reviewerName,
        rating: score,
        comment: reviewText,
        createdAt: serverTimestamp()
    });
};

window.watchEurekaProductReviews = (productId, onReviews, onError = () => {}) => onSnapshot(
    query(collection(db, 'productReviews'), where('productId', '==', Number(productId))),
    snapshot => onReviews(snapshot.docs.map(reviewDoc => ({ id: reviewDoc.id, ...reviewDoc.data() }))),
    onError
);

let products = [];
let migrated = false;
let categories = window.EUREKA_BASE_CATEGORIES || [];
let categoriesReady = false;

function publishCatalog() {
    window.dispatchEvent(new CustomEvent('eureka:remote-products', {
        detail: { products, migrated, categories, categoriesReady }
    }));
}

onSnapshot(collection(db, 'products'), snapshot => {
    products = snapshot.docs.map(productDoc => ({ ...productDoc.data(), id: Number(productDoc.data().id) }));
    publishCatalog();
}, error => console.error('Could not load store products from Firebase.', error));

onSnapshot(doc(db, 'appConfig', 'catalog'), snapshot => {
    const settings = snapshot.exists() ? snapshot.data() : {};
    migrated = settings.builtInCatalogMigrated === true;
    categories = Array.isArray(settings.categories) && settings.categories.length
        ? settings.categories
        : (window.EUREKA_BASE_CATEGORIES || []);
    categoriesReady = true;
    publishCatalog();
}, error => console.error('Could not load catalog settings from Firebase.', error));
