// Main JavaScript functionality for SocialConnect
document.addEventListener('DOMContentLoaded', () => {
    // Auto-dismiss alert toasts after 4 seconds
    const toasts = document.querySelectorAll('.toast-alert');
    if (toasts.length > 0) {
        setTimeout(() => {
            toasts.forEach(toast => {
                toast.style.transition = 'opacity 0.5s ease';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 500);
            });
        }, 4000);
    }
});
