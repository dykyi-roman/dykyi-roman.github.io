// Create back to top button element
document.addEventListener('DOMContentLoaded', function() {
    // Create the back to top button element (using button for accessibility)
    const backToTopButton = document.createElement('button');
    backToTopButton.id = 'backToTop';
    backToTopButton.className = 'back-to-top';
    backToTopButton.title = 'Back to top';
    backToTopButton.setAttribute('aria-label', 'Scroll back to top of page');
    backToTopButton.setAttribute('type', 'button');
    document.body.appendChild(backToTopButton);

    // Show button when user scrolls down 300px from the top
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
            backToTopButton.setAttribute('aria-hidden', 'false');
        } else {
            backToTopButton.classList.remove('visible');
            backToTopButton.setAttribute('aria-hidden', 'true');
        }
    });

    // Smooth scroll to top when button is clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Support keyboard navigation
    backToTopButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
});
