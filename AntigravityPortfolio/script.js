// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.section-fade').forEach(section => {
    observer.observe(section);
});

// Form Handling (Mock)
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = contactForm.querySelector('.submit-btn');
        const originalText = btn.textContent;

        btn.textContent = 'Sending...';
        btn.style.opacity = '0.7';

        // Simulate network request
        setTimeout(() => {
            btn.textContent = 'Message Sent!';
            btn.style.backgroundColor = '#27c93f';
            btn.style.backgroundImage = 'none'; // remove gradient

            contactForm.reset();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.backgroundImage = '';
                btn.style.opacity = '1';
                // Trigger an alert or toast here if you want
            }, 3000);
        }, 1500);
    });
}
