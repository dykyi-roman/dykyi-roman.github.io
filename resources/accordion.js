// Accordion functionality for principles.html
document.addEventListener('DOMContentLoaded', function() {
    // Main accordion headers
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.accordion-icon');
            
            // Toggle active class
            this.classList.toggle('active');
            content.classList.toggle('active');
        });
    });
    
    // Sub-accordion headers (for nested sections like in Practice)
    const subAccordionHeaders = document.querySelectorAll('.sub-accordion-header');
    
    subAccordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.sub-accordion-icon');
            
            // Toggle active class
            this.classList.toggle('active');
            content.classList.toggle('active');
        });
    });
    
    // Open first section by default (optional)
    // Uncomment the following lines to open the first section on page load
    /*
    if (accordionHeaders.length > 0) {
        accordionHeaders[0].classList.add('active');
        accordionHeaders[0].nextElementSibling.classList.add('active');
    }
    */
});

// Function to scroll to section and open accordion
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Find the accordion header within this section
        const accordionHeader = section.querySelector('.accordion-header');
        if (accordionHeader && !accordionHeader.classList.contains('active')) {
            // Open the accordion
            accordionHeader.click();
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
}
