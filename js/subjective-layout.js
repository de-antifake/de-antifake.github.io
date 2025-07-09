document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const tables = mainContent.querySelectorAll('table');
    const mediaQuery = window.matchMedia('(max-width: 1199.98px)');

    // label mapping for simplified display
    const labelMap = {
        'Original Clean Audio': 'Clean Input',
        'Clean Synthesized': 'Clean Synth.',
        'Protected Synthesized': 'Protected Synth.',
        'Purified Synthesized (AudioPure)': 'Purified (AudioPure)',
        'Purified Synthesized (Ours)': 'Purified (Ours)'
    };

    // Function to transform tables to cards
    function transformTables() {
        tables.forEach(table => {
            // --- Data Extraction (Row-based for subjective.html) ---
            const headers = Array.from(table.querySelectorAll('tr:first-of-type th')).map(th => th.textContent.trim());
            const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header row
            if (headers.length === 0 || rows.length === 0) return;

            const cardsData = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 0) return;

                const cardTitle = cells[0].textContent.trim();
                const items = [];
                // Start from the second cell
                for (let i = 1; i < cells.length; i++) {
                    const audioPlayer = cells[i].querySelector('audio');
                    const label = headers[i]; // Get corresponding header
                    if (audioPlayer && label) {
                        items.push({
                            label: labelMap[label] || label,
                            playerHTML: audioPlayer.outerHTML
                        });
                    }
                }
                if (items.length > 0) {
                    cardsData.push({ title: cardTitle, items: items });
                }
            });

            // --- Card View Creation ---
            const cardView = document.createElement('div');
            cardView.className = 'card-view';

            cardsData.forEach(cardData => {
                const card = document.createElement('div');
                card.className = 'audio-card';
                let cardHTML = `<h3>LibriSpeech: ${cardData.title}</h3>`;
                // group rendering
                if (cardData.items.length > 0) {
                    cardHTML += '<div class="audio-group-title">Original Clean</div>';
                    cardHTML += `<div class="audio-item"><p>${cardData.items[0].label}</p>${cardData.items[0].playerHTML}</div>`;
                }
                if (cardData.items.length > 1) {
                    cardHTML += '<div class="audio-group-title">Synthesized</div>';
                    for (let i = 1; i < cardData.items.length; i++) {
                        cardHTML += `<div class="audio-item"><p>${cardData.items[i].label}</p>${cardData.items[i].playerHTML}</div>`;
                    }
                }
                card.innerHTML = cardHTML;
                cardView.appendChild(card);
            });

            table.parentNode.insertBefore(cardView, table.nextSibling);
            table.remove();
        });
    }

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
    transformTables();
    toggleView(mediaQuery.matches);
    lazyPreloadAudio(); // Use lazy preloading

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
        toggleView(e.matches);
    });
});
