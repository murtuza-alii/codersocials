/**
 * Community Sanctuary Platform - Custom Instagram-Style Carousel & Video Player
 * Enhanced with GSAP Core Motion for zero-jank slide physics and tactile indicators.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize all Carousels
    document.querySelectorAll('.carousel-container').forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dot');
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        const nextBtn = carousel.querySelector('.carousel-btn.next');

        if (!track || slides.length <= 1) return;

        let currentIndex = 0;
        const totalSlides = slides.length;

        function updateCarousel(index) {
            currentIndex = (index + totalSlides) % totalSlides;

            // Use GSAP for buttery smooth hardware-accelerated slide motion
            if (typeof gsap !== 'undefined') {
                gsap.to(track, {
                    xPercent: -currentIndex * 100,
                    duration: 0.35,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            } else {
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
            }

            // Pause all videos when sliding away
            slides.forEach((slide, idx) => {
                const video = slide.querySelector('video');
                if (video && idx !== currentIndex) {
                    video.pause();
                }
            });

            // Update dots with GSAP scale
            dots.forEach((dot, idx) => {
                const isActive = idx === currentIndex;
                dot.classList.toggle('active', isActive);
                if (typeof gsap !== 'undefined') {
                    gsap.to(dot, {
                        width: isActive ? 10 : 6,
                        scale: isActive ? 1.15 : 1,
                        duration: 0.2,
                        overwrite: 'auto'
                    });
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateCarousel(currentIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateCarousel(currentIndex + 1);
            });
        }

        // Swipe support on mobile
        let startX = 0;
        let endX = 0;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) {
                    updateCarousel(currentIndex + 1);
                } else {
                    updateCarousel(currentIndex - 1);
                }
            }
        }, { passive: true });
    });

    // 2. Custom Video Behavior (Instagram-Style)
    document.querySelectorAll('.carousel-video-box').forEach(box => {
        const video = box.querySelector('video');
        const muteBtn = box.querySelector('.video-mute-pill');
        const indicator = box.querySelector('.play-pause-indicator');
        if (!video) return;

        // Ensure video is initially muted for autoplay compliance
        video.muted = true;

        // Tap/click to play/pause
        box.addEventListener('click', (e) => {
            if (e.target.closest('.video-mute-pill') || e.target.closest('.carousel-btn')) {
                return;
            }

            if (video.paused) {
                video.play();
                showIndicator('fa-play');
            } else {
                video.pause();
                showIndicator('fa-pause');
            }
        });

        // Mute / Unmute pill
        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                if (video.muted) {
                    muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                } else {
                    muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                }
                if (window.showCyberToast) {
                    window.showCyberToast(video.muted ? 'Audio muted' : 'Audio active', 'info', 1500);
                }
            });
        }

        function showIndicator(iconClass) {
            if (!indicator) return;
            indicator.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(indicator,
                    { scale: 0.5, autoAlpha: 0 },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        duration: 0.2,
                        ease: 'back.out(2)',
                        onComplete: () => {
                            gsap.to(indicator, {
                                scale: 0.8,
                                autoAlpha: 0,
                                delay: 0.25,
                                duration: 0.22,
                                ease: 'power2.in'
                            });
                        }
                    }
                );
            } else {
                indicator.classList.add('show');
                setTimeout(() => indicator.classList.remove('show'), 500);
            }
        }

        // Intersection Observer: Auto pause when scrolled out of viewport
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting && !video.paused) {
                        video.pause();
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(video);
        }
    });
});
