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
                        // 不直接保存audio标签，而是保存audio的属性
                        const source = audioPlayer.querySelector('source');
                        columnsData[index].items.push({
                            label: rowHeaderText,
                            src: source ? source.getAttribute('src') : '',
                            type: source ? source.getAttribute('type') : '',
                        });
                    }
                });
            });

            // --- Card View Creation (run once) ---
            const cardView = document.createElement('div');
            cardView.className = 'card-view';
            
            columnsData.forEach((column, colIdx) => {
                const card = document.createElement('div');
                card.className = 'audio-card';
                let cardHTML = `<h3>${column.title}</h3>`;
                column.items.forEach((item, idx) => {
                    // 用audio-item占位，data属性保存src/type
                    cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(item.src)}" data-type="${item.type}" data-loaded="false"><p>${item.label}</p><div class="audio-placeholder">Loading...</div></div>`;
                });
                card.innerHTML = cardHTML;
                cardView.appendChild(card);
            });

            // Insert card view after the table view wrapper
            tableView.parentNode.insertBefore(cardView, tableView.nextSibling);
        });
    }

    // 动态加载audio标签
    function setupAudioLazyLoad() {
        const audioItems = mainContent.querySelectorAll('.audio-item');
        // 首屏优先加载前8个（移动端体验优化）
        let preloadCount = 0;
        audioItems.forEach(item => {
            if (preloadCount < 8 && item.dataset.loaded === 'false') {
                insertAudioTag(item);
                preloadCount++;
            }
        });
        if (!('IntersectionObserver' in window)) {
            // 不支持IntersectionObserver则全部直接插入audio
            audioItems.forEach(item => {
                if (item.dataset.loaded === 'false') {
                    insertAudioTag(item);
                }
            });
            return;
        }
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = entry.target;
                    if (item.dataset.loaded === 'false') {
                        insertAudioTag(item);
                    }
                    obs.unobserve(item); // 加载后不再监听
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.01 });
        audioItems.forEach(item => {
            if (item.dataset.loaded === 'false') {
                observer.observe(item);
            }
        });
    }

    function insertAudioTag(item) {
        if (!item) return;
        if (item.dataset.loaded === 'true') return;
        const src = decodeURIComponent(item.dataset.src || '');
        const type = item.dataset.type || '';
        if (!src) return;
        // 移除占位符
        const placeholder = item.querySelector('.audio-placeholder');
        if (placeholder) placeholder.remove();
        // 创建audio标签
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        const source = document.createElement('source');
        source.src = src;
        if (type) source.type = type;
        audio.appendChild(source);
        item.appendChild(audio);
        item.dataset.loaded = 'true';
    }

    // Initial run
    transformTables();
    // 懒加载必须在卡片生成后立即调用
    setupAudioLazyLoad();
});
