import { createApp, h } from 'https://unpkg.com/vue@3.5.22/dist/vue.esm-browser.js';

const currentFile = window.location.pathname.split('/').pop() || 'index.html';
const adminPage = currentFile.startsWith('admin');
const productPage = currentFile === 'product.html';
const currentPage = currentFile.replace('.html', '') || 'index';

const publicLinks = [
    ['index.html', 'Home', 'index'],
    ['products.html', 'Products', 'products'],
    ['track-orders.html', 'Track Orders', 'track-orders'],
    ['about.html', 'About', 'about'],
    ['contact.html', 'Contact', 'contact']
];

const Header = {
    setup() {
        const link = ([href, label, page]) => h('li', [
            h('a', {
                href,
                ...(currentPage === page ? { 'aria-current': 'page' } : {})
            }, label)
        ]);

        return () => h('header', { class: ['header', adminPage && 'admin-header', productPage && 'product-page-header'] }, [
            h('div', { class: 'container' }, [
                h('a', { class: 'logo', href: 'index.html' }, [
                    h('h1', [h('i', { class: 'fas fa-shopping-bag', 'aria-hidden': 'true' }), ' Eureka Shop'])
                ]),
                h('nav', { class: 'nav', 'aria-label': adminPage ? 'Admin navigation' : 'Main navigation' }, [
                    h('ul', adminPage
                        ? [
                            link(['admin.html', 'Dashboard', 'admin']),
                            ...(currentFile !== 'admin-products.html' ? [link(['admin-products.html', 'Manage Products', 'admin-products'])] : []),
                            link(['index.html', 'View Store', 'index'])
                        ]
                        : publicLinks.map(link))
                ]),
                ...(adminPage ? [] : productPage
                    ? [h('div', { class: 'header-actions product-header-actions' }, [
                        h('button', { class: 'wishlist-header-btn', id: 'wishlistToggle', type: 'button', 'aria-label': 'Open wishlist' }, [h('i', { class: 'fas fa-heart', 'aria-hidden': 'true' }), h('span', { class: 'wishlist-label' }, 'Wishlist'), h('span', { class: 'wishlist-count', id: 'wishlistCount', hidden: true }, '0')]),
                        h('button', { class: 'account-btn', id: 'accountBtn', type: 'button' }, [h('i', { class: 'fas fa-user', 'aria-hidden': 'true' }), ' ', h('span', { id: 'accountBtnLabel' }, 'Sign In')]),
                        h('button', { class: 'cart-icon', id: 'cartIcon', type: 'button', 'aria-label': 'Open shopping cart' }, [
                            h('i', { class: 'fas fa-shopping-cart', 'aria-hidden': 'true' }),
                            h('span', { class: 'cart-count', id: 'cartCount' }, '0')
                        ])
                    ])]
                    : ['index', 'products'].includes(currentPage) ? [h('div', { class: ['header-actions', currentPage === 'index' && 'home-actions'] }, [
                        ...(currentPage === 'products' ? [h('div', { class: 'search-box' }, [
                            h('input', { type: 'text', placeholder: 'Search products...', id: 'searchInput', 'aria-label': 'Search products' }),
                            h('button', { id: 'searchBtn', type: 'button', 'aria-label': 'Search' }, [h('i', { class: 'fas fa-search' })])
                        ])] : []),
                        h('button', { class: 'wishlist-header-btn', id: 'wishlistToggle', type: 'button', 'aria-label': 'Open wishlist' }, [h('i', { class: 'fas fa-heart', 'aria-hidden': 'true' }), h('span', { class: 'wishlist-label' }, 'Wishlist'), h('span', { class: 'wishlist-count', id: 'wishlistCount', hidden: true }, '0')]),
                        h('button', { class: 'account-btn', id: 'accountBtn', ...(currentPage === 'index' ? { 'data-open-signup': 'true' } : {}) }, [
                            h('i', { class: 'fas fa-user', 'aria-hidden': 'true' }), ' ',
                            h('span', { id: 'accountBtnLabel' }, currentPage === 'index' ? 'Sign Up' : 'Sign In')
                        ]),
                        h('button', { class: 'cart-icon', id: 'cartIcon', type: 'button', 'aria-label': 'Open shopping cart' }, [
                            h('i', { class: 'fas fa-shopping-cart', 'aria-hidden': 'true' }),
                            h('span', { class: 'cart-count', id: 'cartCount' }, '0')
                        ])
                    ])] : [])
            ])
        ]);
    }
};

const mountPoint = document.querySelector('[data-vue-header]');
if (mountPoint) createApp(Header).mount(mountPoint);
