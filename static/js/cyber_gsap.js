/**
 * Sanctuary Cyberpunk - GSAP Core Motion Engine
 * Delivers buttery Discord-style animations, popups, tooltips, and hover physics.
 * Adheres strictly to gsap-core best practices: transform aliases, autoAlpha, cleanup, and reduced-motion.
 */

(function () {
    'use strict';

    // 1. Ensure GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.warn('[CyberMotion] GSAP not detected. Falling back to CSS transitions.');
        return;
    }

    // Set project-wide GSAP defaults
    gsap.defaults({
        duration: 0.25,
        ease: 'power2.out'
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Global Modal Engine
    function initCyberModal() {
        const backdrop = document.getElementById('cyber-modal-backdrop');
        const card = document.getElementById('cyber-modal-card');
        const closeBtn = document.getElementById('cyber-modal-close-btn');
        const cancelBtn = document.getElementById('cyber-modal-cancel-btn');
        const confirmBtn = document.getElementById('cyber-modal-confirm-btn');
        const titleEl = document.getElementById('cyber-modal-title');
        const msgEl = document.getElementById('cyber-modal-msg');
        const typeLabel = document.getElementById('cyber-modal-type-label');
        const customSlot = document.getElementById('cyber-modal-custom-slot');

        if (!backdrop || !card) return;

        let currentConfirmCallback = null;
        let currentCancelCallback = null;
        let isModalOpen = false;

        function closeModal() {
            if (!isModalOpen) return;
            isModalOpen = false;

            if (prefersReducedMotion) {
                gsap.set(backdrop, { autoAlpha: 0 });
                return;
            }

            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(backdrop, { autoAlpha: 0 });
                    if (customSlot) customSlot.innerHTML = '';
                }
            });

            tl.to(card, {
                scale: 0.92,
                y: 16,
                autoAlpha: 0,
                duration: 0.2,
                ease: 'power2.in'
            }).to(backdrop, {
                autoAlpha: 0,
                duration: 0.15
            }, '-=0.1');
        }

        window.closeCyberModal = closeModal;

        window.showCyberModal = function (options) {
            const {
                title = 'System Notice',
                message = '',
                type = 'notice', // 'notice', 'confirm', 'danger', 'success'
                confirmText = 'Acknowledge',
                cancelText = 'Cancel',
                showCancel = false,
                contentHtml = '',
                onConfirm = null,
                onCancel = null
            } = options;

            currentConfirmCallback = onConfirm;
            currentCancelCallback = onCancel;
            isModalOpen = true;

            // Set texts & styles
            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = message;
            if (customSlot) customSlot.innerHTML = contentHtml || '';
            if (confirmBtn) confirmBtn.textContent = confirmText;
            if (cancelBtn) {
                cancelBtn.textContent = cancelText;
                cancelBtn.style.display = showCancel ? 'inline-flex' : 'none';
            }

            // Type styling
            if (typeLabel) {
                if (type === 'danger') {
                    typeLabel.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--sanctuary-magenta);"></i> <span style="color: var(--sanctuary-magenta);">ALERT // DANGER</span>';
                    if (confirmBtn) {
                        confirmBtn.className = 'cyber-btn cyber-btn-danger';
                    }
                } else if (type === 'success') {
                    typeLabel.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--sanctuary-lime);"></i> <span style="color: var(--sanctuary-lime);">CONFIRMED // SUCCESS</span>';
                    if (confirmBtn) {
                        confirmBtn.className = 'cyber-btn cyber-btn-primary';
                    }
                } else {
                    typeLabel.innerHTML = '<i class="fa-solid fa-terminal" style="color: var(--sanctuary-amber);"></i> <span style="color: var(--sanctuary-amber);">TERMINAL // NOTICE</span>';
                    if (confirmBtn) {
                        confirmBtn.className = 'cyber-btn cyber-btn-primary';
                    }
                }
            }

            // Animate In with GSAP
            gsap.set(backdrop, { autoAlpha: 1 });

            if (prefersReducedMotion) {
                gsap.set(card, { autoAlpha: 1, scale: 1, y: 0 });
                return;
            }

            gsap.fromTo(card,
                { scale: 0.88, y: 25, autoAlpha: 0 },
                { scale: 1, y: 0, autoAlpha: 1, duration: 0.32, ease: 'back.out(1.7)', overwrite: 'auto' }
            );
        };

        // Button click listeners
        if (closeBtn) closeBtn.addEventListener('click', () => {
            closeModal();
            if (currentCancelCallback) currentCancelCallback();
        });

        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            closeModal();
            if (currentCancelCallback) currentCancelCallback();
        });

        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            const callback = currentConfirmCallback;
            closeModal();
            if (callback) callback();
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
                if (currentCancelCallback) currentCancelCallback();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
                if (currentCancelCallback) currentCancelCallback();
            }
        });
    }

    // Global helper replacements for alert and confirm
    window.cyberAlert = function (message, title = 'System Notification') {
        window.showCyberModal({
            title: title,
            message: message,
            type: 'notice',
            confirmText: 'Dismiss',
            showCancel: false
        });
    };

    window.cyberConfirm = function (message, title = 'Confirm Action', onConfirm, onCancel) {
        window.showCyberModal({
            title: title,
            message: message,
            type: 'danger',
            confirmText: 'Proceed',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    };

    window.cyberCopyLink = function (url, label = 'Share Link') {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                window.showCyberToast('Link copied to cyber clipboard!', 'success');
            }).catch(() => {
                window.showCyberToast('Failed to write to clipboard.', 'error');
            });
        } else {
            window.showCyberToast('Clipboard access unavailable.', 'error');
        }
    };

    // 3. Cyber Toast Notification Engine
    window.showCyberToast = function (message, type = 'info', duration = 3500) {
        let stack = document.getElementById('cyber-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'cyber-toast-stack';
            stack.className = 'cyber-toast-stack';
            document.body.appendChild(stack);
        }

        const toast = document.createElement('div');
        toast.className = `cyber-toast cyber-toast-${type}`;

        let iconClass = 'fa-info';
        if (type === 'success') iconClass = 'fa-check';
        if (type === 'error') iconClass = 'fa-triangle-exclamation';
        if (type === 'warning') iconClass = 'fa-bolt';

        toast.innerHTML = `
            <div class="cyber-toast-glow"></div>
            <div class="cyber-toast-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="cyber-toast-content">
                <div class="cyber-toast-tag">${type.toUpperCase()} // SYS</div>
                <div class="cyber-toast-msg">${message}</div>
            </div>
            <button type="button" class="cyber-toast-close">&times;</button>
            <div class="cyber-toast-bar"></div>
        `;

        stack.appendChild(toast);

        const closeBtn = toast.querySelector('.cyber-toast-close');
        const bar = toast.querySelector('.cyber-toast-bar');

        function dismissToast() {
            if (prefersReducedMotion) {
                toast.remove();
                return;
            }
            gsap.to(toast, {
                x: 60,
                autoAlpha: 0,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => toast.remove()
            });
        }

        closeBtn.addEventListener('click', dismissToast);

        // Animate Entrance
        if (!prefersReducedMotion) {
            gsap.fromTo(toast,
                { x: 70, autoAlpha: 0, scale: 0.95 },
                { x: 0, autoAlpha: 1, scale: 1, duration: 0.32, ease: 'back.out(1.6)' }
            );

            // Drain progress bar
            if (bar) {
                gsap.fromTo(bar,
                    { scaleX: 1, transformOrigin: 'left center' },
                    { scaleX: 0, duration: duration / 1000, ease: 'none' }
                );
            }
        }

        setTimeout(dismissToast, duration);
    };

    // 4. Discord-Style Floating Tooltip Engine
    function initDiscordTooltips() {
        let tooltip = document.getElementById('cyber-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'cyber-tooltip';
            tooltip.className = 'cyber-tooltip';
            document.body.appendChild(tooltip);
        }

        // Convert existing title attributes to data-tooltip to avoid default browser tooltips
        const tooltipTargets = document.querySelectorAll('[title], [data-tooltip]');
        tooltipTargets.forEach(el => {
            const text = el.getAttribute('title') || el.getAttribute('data-tooltip');
            if (text && text.trim()) {
                el.setAttribute('data-tooltip', text.trim());
                el.removeAttribute('title'); // Prevent native browser tooltip from double-showing
            }

            el.addEventListener('mouseenter', (e) => {
                const tipText = el.getAttribute('data-tooltip');
                if (!tipText) return;

                tooltip.textContent = tipText;

                const rect = el.getBoundingClientRect();
                const isRail = el.closest('.primary-rail');

                if (isRail) {
                    // Position to the right of the rail icon (Discord style!)
                    const top = rect.top + (rect.height / 2);
                    const left = rect.right + 12;
                    tooltip.className = 'cyber-tooltip tooltip-right';
                    tooltip.style.top = `${top}px`;
                    tooltip.style.left = `${left}px`;
                    tooltip.style.transform = 'translateY(-50%)';

                    if (!prefersReducedMotion) {
                        gsap.fromTo(tooltip,
                            { autoAlpha: 0, scale: 0.85, x: -8 },
                            { autoAlpha: 1, scale: 1, x: 0, duration: 0.18, ease: 'back.out(1.7)', overwrite: 'auto' }
                        );
                    } else {
                        gsap.set(tooltip, { autoAlpha: 1 });
                    }
                } else {
                    // Default top position
                    const top = rect.top - 8;
                    const left = rect.left + (rect.width / 2);
                    tooltip.className = 'cyber-tooltip tooltip-top';
                    tooltip.style.top = `${top}px`;
                    tooltip.style.left = `${left}px`;
                    tooltip.style.transform = 'translate(-50%, -100%)';

                    if (!prefersReducedMotion) {
                        gsap.fromTo(tooltip,
                            { autoAlpha: 0, scale: 0.85, y: 6 },
                            { autoAlpha: 1, scale: 1, y: 0, duration: 0.18, ease: 'back.out(1.7)', overwrite: 'auto' }
                        );
                    } else {
                        gsap.set(tooltip, { autoAlpha: 1 });
                    }
                }
            });

            el.addEventListener('mouseleave', () => {
                if (!prefersReducedMotion) {
                    gsap.to(tooltip, {
                        autoAlpha: 0,
                        scale: 0.9,
                        duration: 0.12,
                        ease: 'power1.in',
                        overwrite: 'auto'
                    });
                } else {
                    gsap.set(tooltip, { autoAlpha: 0 });
                }
            });
        });
    }

    // 5. Discord Rail Physics & Squircle Morph
    function initRailPhysics() {
        const railBtns = document.querySelectorAll('.rail-btn');
        railBtns.forEach(btn => {
            const pill = btn.querySelector('.rail-pill');
            if (pill) gsap.set(pill, { clearProps: 'transform,y,yPercent' });

            btn.addEventListener('mouseenter', () => {
                const isActive = btn.classList.contains('active');
                if (!prefersReducedMotion) {
                    // Squircle morph
                    gsap.to(btn, {
                        borderRadius: '16px',
                        scale: 1.06,
                        duration: 0.22,
                        ease: 'back.out(1.5)',
                        overwrite: 'auto'
                    });

                    // Left pill expansion
                    if (pill) {
                        gsap.to(pill, {
                            height: isActive ? 38 : 20,
                            autoAlpha: 1,
                            duration: 0.22,
                            ease: 'back.out(1.5)',
                            overwrite: 'auto'
                        });
                    }
                }
            });

            btn.addEventListener('mouseleave', () => {
                const isActive = btn.classList.contains('active');
                if (!prefersReducedMotion) {
                    gsap.to(btn, {
                        borderRadius: isActive ? '16px' : '50%',
                        scale: 1,
                        duration: 0.22,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });

                    if (pill) {
                        gsap.to(pill, {
                            height: isActive ? 38 : 0,
                            autoAlpha: isActive ? 1 : 0,
                            duration: 0.2,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    }
                }
            });
        });
    }

    // 6. Like Button Heartbeat Punch
    function initLikePunch() {
        const likeBtns = document.querySelectorAll('.post-action-btn.like-btn, a[href*="like"]');
        likeBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const icon = this.querySelector('i');
                if (!icon || prefersReducedMotion) return;

                gsap.timeline()
                    .to(icon, { scale: 1.12, duration: 0.08, ease: 'power2.out' })
                    .to(icon, { scale: 1, duration: 0.16, ease: 'power2.out' });
            });
        });
    }

    // 7. Post Feed Staggered Reveal
    function initFeedStagger() {
        if (prefersReducedMotion) return;

        const posts = document.querySelectorAll('.sanctuary-post-card');
        if (posts.length > 0) {
            gsap.from(posts, {
                y: 8,
                autoAlpha: 0,
                duration: 0.28,
                stagger: 0.055,
                ease: 'power2.out',
                clearProps: 'all'
            });
        }
    }

    // 8. Interactive Tactile Click Physics
    function initTactileClicks() {
        const interactiveTargets = document.querySelectorAll('.cyber-btn, .btn, .accordion-nav-item, .post-action-btn, #pin-accordion-btn');
        interactiveTargets.forEach(el => {
            el.addEventListener('mousedown', () => {
                if (!prefersReducedMotion) {
                    gsap.to(el, { scale: 0.985, duration: 0.08, overwrite: 'auto' });
                }
            });
            el.addEventListener('mouseup', () => {
                if (!prefersReducedMotion) {
                    gsap.to(el, { scale: 1, duration: 0.15, ease: 'power2.out', overwrite: 'auto' });
                }
            });
            el.addEventListener('mouseleave', () => {
                if (!prefersReducedMotion) {
                    gsap.to(el, { scale: 1, duration: 0.12, overwrite: 'auto' });
                }
            });
        });
    }

    // Document Ready Initialization
    document.addEventListener('DOMContentLoaded', () => {
        initCyberModal();
        initDiscordTooltips();
        initRailPhysics();
        initLikePunch();
        initFeedStagger();
        initTactileClicks();
    });

})();
