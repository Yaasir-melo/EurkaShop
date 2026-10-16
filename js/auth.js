// Firebase Auth setup and gating for verified users
// 1) Replace the config object below with your Firebase project settings
// 2) Enable Email/Password provider in Firebase Console

import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, reload } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, getDoc, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { auth, db } from './firebase.js';

export { auth };

// Elements
const accountBtn = document.getElementById('accountBtn');
const accountBtnLabel = document.getElementById('accountBtnLabel');
const authModal = document.getElementById('authModal');
const closeAuth = document.getElementById('closeAuth');
const authTabs = document.querySelectorAll('.auth-tab');
const authTabsContainer = document.querySelector('.auth-tabs');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTitle = document.getElementById('authTitle');
const authError = document.getElementById('authError');
const verifyNotice = document.getElementById('verifyNotice');
const verifyMessage = document.getElementById('verifyMessage');
const accountDetails = document.getElementById('accountDetails');
const profileEmail = document.getElementById('profileEmail');
const profileVerification = document.getElementById('profileVerification');
const profileCreated = document.getElementById('profileCreated');
const profileLastSignIn = document.getElementById('profileLastSignIn');
const resendVerification = document.getElementById('resendVerification');
const signOutBtn = document.getElementById('signOutBtn');
const customerOrderList = document.getElementById('customerOrderList');
const signupPasswordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
let currentUserIsAdmin = false;
let stopCustomerOrders = null;

// Let users reveal passwords temporarily while typing.
document.querySelectorAll('[data-password-target]').forEach(button => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.passwordTarget);
        if (!input) return;
        const showPassword = input.type === 'password';
        input.type = showPassword ? 'text' : 'password';
        const icon = button.querySelector('i');
        icon?.classList.toggle('fa-eye', !showPassword);
        icon?.classList.toggle('fa-eye-slash', showPassword);
        button.setAttribute('aria-label', `${showPassword ? 'Hide' : 'Show'} password`);
        button.setAttribute('aria-pressed', String(showPassword));
    });
});

function validatePasswordConfirmation() {
    if (!signupPasswordInput || !confirmPasswordInput) return true;
    const matches = signupPasswordInput.value === confirmPasswordInput.value;
    confirmPasswordInput.setCustomValidity(matches ? '' : 'Passwords do not match.');
    return matches;
}

signupPasswordInput?.addEventListener('input', validatePasswordConfirmation);
confirmPasswordInput?.addEventListener('input', validatePasswordConfirmation);

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function watchCustomerOrders(user) {
    stopCustomerOrders?.();
    if (!customerOrderList || !user) return;
    customerOrderList.innerHTML = '<p>Loading your orders…</p>';
    stopCustomerOrders = onSnapshot(
        query(collection(db, 'orderRequests'), where('userId', '==', user.uid)),
        snapshot => {
            const orders = snapshot.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() }))
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            if (!orders.length) {
                customerOrderList.innerHTML = '<p>You have not sent any order requests yet.</p>';
                return;
            }
            customerOrderList.innerHTML = orders.map(order => {
                const created = order.createdAt?.toDate?.();
                const date = created ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(created) : 'Date unavailable';
                const items = Array.isArray(order.items) ? order.items.map(item => `<li>${escapeHTML(item.title)} × ${Number(item.quantity) || 1}${Object.entries(item.options || {}).map(([name, value]) => ` — ${escapeHTML(name)}: ${escapeHTML(value)}`).join('')}</li>`).join('') : '';
                const status = ['pending', 'confirmed', 'cancelled', 'fulfilled'].includes(order.status) ? order.status : 'pending';
                return `<article class="customer-order-card"><div class="customer-order-heading"><strong>Order ${escapeHTML(order.id.slice(-8))}</strong><span class="customer-order-status status-${status}">${escapeHTML(status)}</span></div><time>${escapeHTML(date)}</time><ul>${items}</ul></article>`;
            }).join('');
        },
        error => { customerOrderList.innerHTML = `<p>Could not load orders: ${escapeHTML(error.message)}</p>`; }
    );
}

// UI helpers
function openAuth(tab = 'login') {
    authModal.classList.add('show');
    setActiveTab(tab);
}

function showAccountDetails(user = auth.currentUser) {
    if (!user) return;
    const formatDate = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not available';
    profileEmail.textContent = user.email || 'Not available';
    profileVerification.textContent = user.emailVerified ? 'Verified' : currentUserIsAdmin ? 'Admin account - verification not required' : 'Verification needed';
    profileCreated.textContent = formatDate(user.metadata?.creationTime);
    profileLastSignIn.textContent = formatDate(user.metadata?.lastSignInTime);
    authTabsContainer.style.display = 'none';
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    accountDetails.style.display = '';
    authTitle.textContent = 'Your Profile';
    authError.style.display = 'none';
}

function openAccount() {
    authModal.classList.add('show');
    showAccountDetails();
}

function closeAuthModal() { authModal.classList.remove('show'); }

async function hasAdminAccess(user) {
    if (!user) return false;
    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        return adminDoc.exists();
    } catch {
        return false;
    }
}

async function sendVerificationEmail() {
    const user = auth.currentUser;
    if (!user) return;
    if (currentUserIsAdmin || await hasAdminAccess(user)) {
        currentUserIsAdmin = true;
        verifyMessage.textContent = 'Admin accounts do not need email verification.';
        return;
    }
    verifyMessage.textContent = 'Sending verification email...';
    try {
        await reload(user);
        if (user.emailVerified) {
            verifyMessage.textContent = 'This email is already verified. Refresh the page if the account still shows otherwise.';
            return;
        }
        await sendEmailVerification(user);
        verifyMessage.textContent = 'Verification email sent. Check your inbox and spam folder.';
    } catch (error) {
        verifyMessage.textContent = `Could not send the email: ${error.message}`;
    }
}

function setActiveTab(tab) {
    authTabsContainer.style.display = '';
    accountDetails.style.display = 'none';
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    loginForm.style.display = tab === 'login' ? '' : 'none';
    signupForm.style.display = tab === 'signup' ? '' : 'none';
    authTitle.textContent = tab === 'login' ? 'Sign In' : 'Sign Up';
    authError.style.display = 'none';
    verifyNotice.style.display = 'none';
    verifyMessage.textContent = '';
}

// Tabs
authTabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

// Open/Close
accountBtn.addEventListener('click', () => {
    if (auth.currentUser) {
        openAccount();
        if (!auth.currentUser.emailVerified && !currentUserIsAdmin) sendVerificationEmail();
        return;
    }
    openAuth(accountBtn.dataset.openSignup === 'true' ? 'signup' : 'login');
});
closeAuth.addEventListener('click', closeAuthModal);
window.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

// Auth flows
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    if (!validatePasswordConfirmation()) {
        authError.textContent = 'The passwords do not match. Please check both fields.';
        authError.style.display = '';
        confirmPasswordInput.reportValidity();
        return;
    }
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const submitButton = signupForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        signupForm.reset();
        verifyNotice.style.display = '';
        try {
            await sendEmailVerification(userCredential.user);
            verifyMessage.textContent = 'Your account was created in Firebase Authentication. Verification email sent; check your inbox and spam folder before checkout.';
        } catch (emailError) {
            verifyMessage.textContent = `Your account was created in Firebase Authentication, but Firebase could not send the verification email (${emailError.code || emailError.message}). Use Resend Verification Email, and check Firebase Authentication email settings.`;
        }
    } catch (err) {
        const messages = {
            'auth/email-already-in-use': 'This email already has a Firebase Authentication account. Sign in instead, or use password reset if needed.',
            'auth/operation-not-allowed': 'Email/password sign-up is disabled. Enable Email/Password under Firebase Console → Authentication → Sign-in method.',
            'auth/unauthorized-domain': 'This website address is not allowed by Firebase. Add its domain under Firebase Console → Authentication → Settings → Authorized domains.',
            'auth/invalid-api-key': 'The Firebase API key in js/firebase.js is not accepted. Check the web app settings in Firebase Console.',
            'auth/weak-password': 'Choose a stronger password (Firebase requires at least 6 characters).',
            'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection and open the site using its local web server or HTTPS hosting.'
        };
        authError.textContent = messages[err.code] || `Firebase could not create the account (${err.code || err.message}).`;
        authError.style.display = '';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await reload(cred.user);
        await cred.user.getIdToken(true);
        const admin = await hasAdminAccess(cred.user);
        if (!cred.user.emailVerified && !admin) {
            verifyNotice.style.display = '';
            verifyMessage.textContent = 'Your account is not verified yet. Click Verify Email to send a new verification link.';
            return;
        }
        closeAuthModal();
    } catch (err) {
        const loginMessages = {
            'auth/invalid-credential': 'That email and password do not match an account. Check the spelling, or use Show to review the password before trying again.',
            'auth/wrong-password': 'That password is incorrect. Check the spelling, or use Show to review it before trying again.',
            'auth/user-not-found': 'No account was found for that email. Check the email or sign up first.',
            'auth/too-many-requests': 'There have been too many sign-in attempts. Wait a little while, then try again.',
            'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection and try again.'
        };
        authError.textContent = loginMessages[err.code] || `Could not sign in (${err.code || err.message}).`;
        authError.style.display = '';
    }
});

resendVerification.addEventListener('click', sendVerificationEmail);

signOutBtn.addEventListener('click', async () => {
    await signOut(auth);
    closeAuthModal();
});

// State changes
onAuthStateChanged(auth, async (user) => {
    window.eurekaCurrentUser = user || null;
    window.dispatchEvent(new CustomEvent('eureka:auth-state', { detail: { user: user || null } }));
    if (user) {
        watchCustomerOrders(user);
        await reload(user);
        const verified = user.emailVerified === true;
        const admin = await hasAdminAccess(user);
        currentUserIsAdmin = admin;
        accountBtnLabel.textContent = verified || admin ? 'My Profile' : 'Verify Email';
        signOutBtn.style.display = '';
        showAccountDetails(user);
        verifyNotice.style.display = verified || admin ? 'none' : '';
    } else {
        stopCustomerOrders?.();
        stopCustomerOrders = null;
        currentUserIsAdmin = false;
        accountBtnLabel.textContent = accountBtn.dataset.openSignup === 'true' ? 'Sign Up' : 'Sign In';
        signOutBtn.style.display = 'none';
        verifyNotice.style.display = 'none';
        accountDetails.style.display = 'none';
        authTabsContainer.style.display = '';
    }
});

window.eurekaAuthReady = true;

// Export a guard function others can use
export async function ensureVerifiedUser() {
    return new Promise((resolve, reject) => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            unsub();
            if (user) {
                await reload(user);
                // Verification changes the account record first; refresh the ID token so
                // Firestore rules also receive the latest email_verified claim.
                await user.getIdToken(true);
                const admin = await hasAdminAccess(user);
                if (user.emailVerified || admin) return resolve(user);
                // Show the account and verification state for an unverified user.
                openAccount();
                verifyNotice.style.display = '';
                return reject(new Error('Email not verified'));
            }
            openAuth('login');
            reject(new Error('Not signed in'));
        });
    });
}



