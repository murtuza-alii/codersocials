/**
 * Sanctuary Cyberpunk - Discord Accordion Sidebar Navigation
 * Smooth collapsible categories, buttery staggered options reveals,
 * hover intent stabilization, and radiant light halo generation.
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('drawer-toggle-btn');
    const accordion = document.querySelector('.secondary-accordion');
    const rail = document.querySelector('.primary-rail');
    const pinBtn = document.getElementById('pin-accordion-btn');

    // 1. Ensure Light Halos & Item Stagger Indices on Nav Items
    function setupNavItemsLight() {
        const navItems = document.querySelectorAll('.accordion-nav-item');
        navItems.forEach((item, idx) => {
            if (!item.style.getPropertyValue('--item-idx')) {
                item.style.setProperty('--item-idx', idx % 8);
            }
            if (!item.querySelector('.nav-icon-light')) {
                const halo = document.createElement('span');
                halo.className = 'nav-icon-light';
                halo.setAttribute('aria-hidden', 'true');
                item.insertBefore(halo, item.firstChild);
            }
        });
    }
    setupNavItemsLight();

    // 2. Restore pinned preference from localStorage
    if (accordion && pinBtn) {
        const savedPinned = localStorage.getItem('sanctuary_sidebar_pinned');
        if (savedPinned === 'true') {
            accordion.classList.add('is-pinned');
            pinBtn.innerHTML = '<i class="fa-solid fa-thumbtack" style="color: var(--sanctuary-cyan);"></i>';
            pinBtn.setAttribute('data-tooltip', 'Unpin Sidebar');
        }
    }

    // 3. Mobile Drawer Toggle
    if (toggleBtn && accordion) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accordion.classList.toggle('is-open');
        });
    }

    // 4. Pin / Dock Toggle
    if (pinBtn && accordion) {
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accordion.classList.toggle('is-pinned');
            const isPinned = accordion.classList.contains('is-pinned');
            localStorage.setItem('sanctuary_sidebar_pinned', isPinned ? 'true' : 'false');
            pinBtn.innerHTML = isPinned 
                ? '<i class="fa-solid fa-thumbtack" style="color: var(--sanctuary-cyan);"></i>' 
                : '<i class="fa-solid fa-angles-left"></i>';
            pinBtn.setAttribute('data-tooltip', isPinned ? 'Unpin Sidebar' : 'Pin Sidebar');
            
            if (window.showCyberToast) {
                window.showCyberToast(isPinned ? 'Sidebar docked & pinned' : 'Sidebar unpinned (hover mode)', 'info', 2000);
            }
        });
    }

    // 5. Hover Intent Stabilization between Rail & Accordion (Zero Choppy Snapping)
    if (rail && accordion) {
        let hoverTimeout = null;

        function activateHover() {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            accordion.classList.add('is-hover-active');
        }

        function deactivateHover() {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                if (!rail.matches(':hover') && !accordion.matches(':hover')) {
                    accordion.classList.remove('is-hover-active');
                }
            }, 140);
        }

        rail.addEventListener('mouseenter', activateHover);
        rail.addEventListener('mouseleave', deactivateHover);
        accordion.addEventListener('mouseenter', activateHover);
        accordion.addEventListener('mouseleave', deactivateHover);
    }

    // 6. Collapsible Category Sections with Smooth Easing & State Memory
    const categoryHeaders = document.querySelectorAll('.accordion-category-header');
    categoryHeaders.forEach(header => {
        const section = header.closest('.accordion-section');
        if (!section) return;

        const sectionId = section.getAttribute('data-section-id') || header.textContent.trim().toLowerCase().replace(/\s+/g, '_');

        // Restore collapsed state from localStorage
        const savedState = localStorage.getItem('sanctuary_sec_' + sectionId);
        if (savedState === 'collapsed') {
            section.classList.add('is-collapsed');
            header.setAttribute('aria-expanded', 'false');
        } else {
            section.classList.remove('is-collapsed');
            header.setAttribute('aria-expanded', 'true');
        }

        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isCurrentlyCollapsed = section.classList.contains('is-collapsed');
            const willCollapse = !isCurrentlyCollapsed;

            section.classList.toggle('is-collapsed', willCollapse);
            header.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
            localStorage.setItem('sanctuary_sec_' + sectionId, willCollapse ? 'collapsed' : 'expanded');

            // If expanding, run smooth staggered entrance on revealed options
            if (!willCollapse && typeof gsap !== 'undefined') {
                const childItems = section.querySelectorAll('.accordion-nav-item');
                if (childItems.length > 0) {
                    gsap.fromTo(childItems,
                        { opacity: 0, x: -10 },
                        { 
                            opacity: 1, 
                            x: 0, 
                            stagger: 0.035, 
                            duration: 0.32, 
                            ease: 'power2.out',
                            clearProps: 'opacity,transform'
                        }
                    );
                }
            }
        });
    });

    // 7. Close on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (accordion && accordion.classList.contains('is-open')) {
            if (!accordion.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                accordion.classList.remove('is-open');
            }
        }
    });
});
