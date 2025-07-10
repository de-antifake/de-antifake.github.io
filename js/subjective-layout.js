document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const mediaQuery = window.matchMedia('(max-width: 1199.98px)');

    // Function to toggle view based on screen size
    function toggleView(isMobile) {
        if (isMobile) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    // Lazy preloading with Intersection Observer
    function lazyPreloadAudio() {
        const audioElements = mainContent.querySelectorAll('audio[preload="none"]');

        const audioObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const audio = entry.target;
                    if (audio.preload === 'none') {
                        audio.preload = 'metadata';
                    }
                    // Stop observing the element once it has been preloaded
                    observer.unobserve(audio);
                }
            });
        }, {
            // Start loading when the element is 200px away from the viewport
            rootMargin: '200px' 
        });

        audioElements.forEach(audio => {
            audioObserver.observe(audio);
        });
    }

    // Initial setup
    toggleView(mediaQuery.matches);
    lazyPreloadAudio(); // Use lazy preloading

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
        toggleView(e.matches);
    });
});
