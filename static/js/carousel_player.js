/**
 * Community Sanctuary Platform - Custom Instagram-Style Carousel & Video Player
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
            track.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Pause all videos when sliding
            slides.forEach((slide, idx) => {
                const video = slide.querySelector('video');
                if (video && idx !== currentIndex) {
                    video.pause();
                }
            });

            // Update dots
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
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
                return; // Let mute pill or carousel button handle it
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
                const icon = muteBtn.querySelector('i') || muteBtn;
                if (video.muted) {
                    muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                } else {
                    muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                }
            });
        }

        function showIndicator(iconClass) {
            if (!indicator) return;
            indicator.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 500);
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
