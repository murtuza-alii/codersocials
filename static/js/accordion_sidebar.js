/**
 * Community Sanctuary Platform - Accordion Sidebar Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('drawer-toggle-btn');
    const accordion = document.querySelector('.secondary-accordion');
    const pinBtn = document.getElementById('pin-accordion-btn');

    if (toggleBtn && accordion) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accordion.classList.toggle('is-open');
        });
    }

    if (pinBtn && accordion) {
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accordion.classList.toggle('is-pinned');
            const isPinned = accordion.classList.contains('is-pinned');
            pinBtn.innerHTML = isPinned ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-solid fa-angles-left"></i>';
        });
    }

    // Close on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (accordion && accordion.classList.contains('is-open')) {
            if (!accordion.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                accordion.classList.remove('is-open');
            }
        }
    });
});
