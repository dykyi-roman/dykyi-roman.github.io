// Accordion functionality for principles.html
document.addEventListener('DOMContentLoaded', function() {
    // Main accordion headers
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach((header, index) => {
        // Add ARIA attributes
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', 'accordion-content-' + index);

        const content = header.nextElementSibling;
        if (content) {
            content.id = 'accordion-content-' + index;
            content.setAttribute('role', 'region');
            content.setAttribute('aria-labelledby', 'accordion-header-' + index);
        }
        header.id = 'accordion-header-' + index;

        header.addEventListener('click', function() {
            toggleAccordion(this);
        });

        // Keyboard support
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAccordion(this);
            }
        });
    });

    // Sub-accordion headers (for nested sections like in Practice)
    const subAccordionHeaders = document.querySelectorAll('.sub-accordion-header');

    subAccordionHeaders.forEach((header, index) => {
        // Add ARIA attributes
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', 'sub-accordion-content-' + index);

        const content = header.nextElementSibling;
        if (content) {
            content.id = 'sub-accordion-content-' + index;
        }

        header.addEventListener('click', function() {
            toggleSubAccordion(this);
        });

        // Keyboard support
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSubAccordion(this);
            }
        });
    });
});

// Toggle main accordion
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = header.classList.toggle('active');
    content.classList.toggle('active');
    header.setAttribute('aria-expanded', isActive.toString());
}

// Toggle sub-accordion
function toggleSubAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = header.classList.toggle('active');
    content.classList.toggle('active');
    header.setAttribute('aria-expanded', isActive.toString());
}

// Override scrollToSection for accordion pages
// This version opens accordions and uses larger offset
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Find the accordion header within this section
        const accordionHeader = section.querySelector('.accordion-header');
        if (accordionHeader && !accordionHeader.classList.contains('active')) {
            // Open the accordion
            toggleAccordion(accordionHeader);
        }

        // Scroll to section with offset
        const offset = 100;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // Close mobile navigation if expanded
    if (window.innerWidth <= 1200) {
        const sideNav = document.querySelector('.side-nav');
        if (sideNav && sideNav.classList.contains('expanded')) {
            sideNav.classList.remove('expanded');
            if (typeof updateNavToggleAria === 'function') {
                updateNavToggleAria(false);
            }
        }
    }
};
