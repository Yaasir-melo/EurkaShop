// Keep admin credentials out of the address bar if the page is opened with file://
// (ES modules and Firebase Auth require localhost or HTTPS to run correctly).
if (window.location.protocol === 'file:') {
    document.querySelectorAll('#adminLoginForm').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();
            const message = form.querySelector('#adminAuthMessage');
            if (message) {
                message.textContent = 'Admin sign-in cannot run from a file opened directly. Start the site with "node serve.js" from the project folder, then open http://localhost:8000/admin.html.';
                message.classList.add('is-error');
            }
        });
    });
}
