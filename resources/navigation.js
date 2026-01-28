function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 20,
            behavior: 'smooth'
        });
    }

    // Close mobile navigation after selection
    if (window.innerWidth <= 1200) {
        const sideNav = document.querySelector('.side-nav');
        if (sideNav && sideNav.classList.contains('expanded')) {
            sideNav.classList.remove('expanded');
            updateNavToggleAria(false);
        }
    }
}

// Toggle side navigation state
function toggleSideNav() {
    const sideNav = document.querySelector('.side-nav');
    if (!sideNav) return;

    const isExpanded = sideNav.classList.toggle('expanded');
    updateNavToggleAria(isExpanded);
}

// Update ARIA attributes for nav toggle
function updateNavToggleAria(isExpanded) {
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.setAttribute('aria-expanded', isExpanded.toString());
        navToggle.setAttribute('aria-label', isExpanded ? 'Close navigation menu' : 'Open navigation menu');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for toggle button
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleSideNav);
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation menu');
        navToggle.setAttribute('aria-controls', 'side-nav');

        // Add keyboard support
        navToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSideNav();
            }
        });
    }

    // Add ARIA role to side nav
    const sideNav = document.querySelector('.side-nav');
    if (sideNav) {
        sideNav.setAttribute('role', 'navigation');
        sideNav.setAttribute('aria-label', 'Page sections navigation');
        sideNav.id = 'side-nav';
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1200) {
            const sideNav = document.querySelector('.side-nav');
            if (sideNav) {
                sideNav.classList.remove('expanded');
                updateNavToggleAria(false);
            }
        }
    });

    // Initialize collapsible topics
    initCollapsibleTopics();
});

// Initialize collapsible topic blocks
function initCollapsibleTopics() {
    const topicBlocks = document.querySelectorAll('.topic-block');

    topicBlocks.forEach(function(block, index) {
        const h4 = block.querySelector('h4');
        if (!h4) return;

        // Check if wrapper already exists
        if (h4.parentElement.classList.contains('topic-header')) return;

        // Create wrapper for header
        const header = document.createElement('div');
        header.className = 'topic-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', 'topic-content-' + index);

        // Create toggle icon
        const toggle = document.createElement('span');
        toggle.className = 'topic-toggle';
        toggle.innerHTML = '▼';
        toggle.setAttribute('aria-hidden', 'true');

        // Insert wrapper before h4
        h4.parentNode.insertBefore(header, h4);

        // Move h4 inside wrapper
        header.appendChild(h4);
        header.appendChild(toggle);

        // Add content ID for aria-controls
        const content = block.querySelector('.content');
        if (content) {
            content.id = 'topic-content-' + index;
        }

        // Add click handler
        header.addEventListener('click', function() {
            const isExpanded = block.classList.toggle('expanded');
            header.setAttribute('aria-expanded', isExpanded.toString());
        });

        // Add keyboard support
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isExpanded = block.classList.toggle('expanded');
                header.setAttribute('aria-expanded', isExpanded.toString());
            }
        });
    });

    // Initialize collapsible content blocks with h5
    initCollapsibleContent();
}

// Initialize collapsible content blocks
function initCollapsibleContent() {
    const contentBlocks = document.querySelectorAll('.topic-block .content');

    contentBlocks.forEach(function(content, index) {
        const h5 = content.querySelector('h5');
        if (!h5) return;

        // Check if wrapper already exists
        if (h5.classList.contains('content-header')) return;

        // Add class for styling
        h5.classList.add('content-header');
        h5.setAttribute('role', 'button');
        h5.setAttribute('tabindex', '0');
        h5.setAttribute('aria-expanded', 'false');

        // Create toggle icon
        const toggle = document.createElement('span');
        toggle.className = 'content-toggle';
        toggle.innerHTML = '▼';
        toggle.setAttribute('aria-hidden', 'true');
        h5.appendChild(toggle);

        // Collapsed by default
        content.classList.add('collapsed');

        // Add click handler on h5
        h5.addEventListener('click', function() {
            const isCollapsed = content.classList.toggle('collapsed');
            h5.setAttribute('aria-expanded', (!isCollapsed).toString());
        });

        // Add keyboard support
        h5.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isCollapsed = content.classList.toggle('collapsed');
                h5.setAttribute('aria-expanded', (!isCollapsed).toString());
            }
        });
    });
}
