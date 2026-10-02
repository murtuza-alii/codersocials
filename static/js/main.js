/**
 * Sanctuary Cyberpunk - Main Application Scripts
 * Smooth toast dismissals using GSAP Core.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Smooth dismissal for server-rendered Django messages using GSAP
    const toasts = document.querySelectorAll('.toast-alert');
    if (toasts.length > 0) {
        if (typeof gsap !== 'undefined') {
            gsap.from(toasts, {
                y: -15,
                autoAlpha: 0,
                duration: 0.35,
                stagger: 0.1,
                ease: 'back.out(1.5)'
            });

            setTimeout(() => {
                gsap.to(toasts, {
                    x: 40,
                    autoAlpha: 0,
                    duration: 0.3,
                    stagger: 0.08,
                    ease: 'power2.in',
                    onComplete: () => {
                        toasts.forEach(t => t.remove());
                    }
                });
            }, 4500);
        } else {
            setTimeout(() => {
                toasts.forEach(toast => {
                    toast.style.transition = 'opacity 0.5s ease';
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 500);
                });
            }, 4500);
        }
    }
});
