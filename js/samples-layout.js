document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content2');
    if (!mainContent) return;

    const tables = mainContent.querySelectorAll('table');
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    // Function to transform tables to cards
    function transformTables() {
        tables.forEach(table => {
            // Check if already processed to prevent re-wrapping
            if (table.closest('.table-view')) return;

            // Wrap table in a table-view div for CSS targeting
            const tableView = document.createElement('div');
            tableView.className = 'table-view';
            table.parentNode.insertBefore(tableView, table);
            tableView.appendChild(table);

            // --- Data Extraction (Column-based for samples.html) ---
            const headers = Array.from(table.querySelectorAll('tr:first-of-type th')).map(th => th.textContent.trim());
            const rows = Array.from(table.querySelectorAll('tr')).slice(1);
            if (headers.length < 2 || rows.length === 0) return;

            const columnsData = [];
            // Start from the second header, as the first is a row label
            for (let i = 1; i < headers.length; i++) {
                columnsData.push({ title: headers[i], items: [] });
            }
            
            rows.forEach(row => {
                const rowHeader = row.querySelector('td:first-child');
                if (!rowHeader) return;
                const rowHeaderText = rowHeader.textContent.trim();
                const cells = Array.from(row.querySelectorAll('td')).slice(1);
                
                cells.forEach((cell, index) => {
                    const audioPlayer = cell.querySelector('audio');
                    if (audioPlayer && columnsData[index]) {
                        // Use the raw outerHTML of the audio player
                        columnsData[index].items.push({
                            label: rowHeaderText,
                            playerHTML: audioPlayer.outerHTML
                        });
                    }
                });
            });

            // --- Card View Creation (run once) ---
            const cardView = document.createElement('div');
            cardView.className = 'card-view';
            
            columnsData.forEach(column => {
                const card = document.createElement('div');
                card.className = 'audio-card';
                let cardHTML = `<h3>${column.title}</h3>`;
                column.items.forEach(item => {
                    cardHTML += `<div class="audio-item"><p>${item.label}</p>${item.playerHTML}</div>`;
                });
                card.innerHTML = cardHTML;
                cardView.appendChild(card);
            });

            // Insert card view after the table view wrapper
            tableView.parentNode.insertBefore(cardView, tableView.nextSibling);
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

    // Listen for changes in viewport size
    mediaQuery.addEventListener('change', (e) => {
        toggleView(e.matches);
    });
});
