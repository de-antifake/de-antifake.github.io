document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content2');
    if (!mainContent) return;

    const tables = mainContent.querySelectorAll('table');
    const mediaQuery = window.matchMedia('(max-width: 1199.98px)');

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
                        // Save audio attributes instead of the audio tag itself
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
                    // Use audio-item as placeholder, store src/type in data attributes
                    cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(item.src)}" data-type="${item.type}" data-loaded="false"><p>${item.label}</p><div class="audio-placeholder">Loading...</div></div>`;
                });
                card.innerHTML = cardHTML;
                cardView.appendChild(card);
            });

            // Insert card view after the table view wrapper
            tableView.parentNode.insertBefore(cardView, tableView.nextSibling);
        });
    }

    // Dynamically load and unload audio tags
    let audioObserver = null;
    function setupAudioLazyLoad() {
        const audioItems = mainContent.querySelectorAll('.audio-item');
        // Preload the first 8 audios for better mobile experience
        let preloadCount = 0;
        audioItems.forEach(item => {
            if (preloadCount < 8 && item.dataset.loaded === 'false') {
                insertAudioTag(item);
                preloadCount++;
            }
        });
        if (!('IntersectionObserver' in window)) {
            // If IntersectionObserver is not supported, insert all audios directly
            audioItems.forEach(item => {
                if (item.dataset.loaded === 'false') {
                    insertAudioTag(item);
                }
            });
            return;
        }
        // Disconnect previous observer
        if (audioObserver) audioObserver.disconnect();
        audioObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                const item = entry.target;
                if (entry.isIntersecting) {
                    if (item.dataset.loaded === 'false') {
                        insertAudioTag(item);
                    }
                } else {
                    // Remove audio to free resources when out of viewport
                    removeAudioTag(item);
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.01 });
        audioItems.forEach(item => {
            audioObserver.observe(item);
        });
    }

    function insertAudioTag(item) {
        if (!item) return;
        if (item.dataset.loaded === 'true') return;
        const src = decodeURIComponent(item.dataset.src || '');
        const type = item.dataset.type || '';
        if (!src) return;
        // Remove placeholder
        const placeholder = item.querySelector('.audio-placeholder');
        if (placeholder) placeholder.remove();
        // Create audio tag
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

    function removeAudioTag(item) {
        if (!item) return;
        if (item.dataset.loaded !== 'true') return;
        const audio = item.querySelector('audio');
        // Only unload if not playing
        if (audio && !audio.paused) return;
        if (audio) audio.remove();
        // Restore placeholder
        if (!item.querySelector('.audio-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'audio-placeholder';
            placeholder.textContent = 'Loading...';
            item.appendChild(placeholder);
        }
        item.dataset.loaded = 'false';
    }

    // Rebind observer when page is restored
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setupAudioLazyLoad();
        }
    });
    window.addEventListener('pageshow', (e) => {
        if (e.persisted || !document.hidden) {
            setupAudioLazyLoad();
        }
    });

    // --- Filtering functionality for input/output分离按钮组 ---
    function setupSeparatedDemoFilters() {
        const INPUTS = [
            { key: 'all', label: 'All' },
            { key: 'antifake', label: 'AntiFake' },
            { key: 'attackvc', label: 'AttackVC' },
            { key: 'voiceguard', label: 'VoiceGuard' }
        ];
        const OUTPUTS = [
            { key: 'all', label: 'All' },
            { key: 'seedvc', label: 'SeedVC' },
            { key: 'tortoise', label: 'Tortoise' },
            { key: 'openvoice', label: 'OpenVoice' },
            { key: 'rtvc', label: 'SV2TTS' },
            { key: 'diffvc', label: 'DiffVC' },
            { key: 'coqui', label: 'YourTTS' }
        ];
        const home = document.getElementById('home');
        if (!home) return;
        // --- 分组映射 ---
        const groupMap = {};
        let curOutput = null, curInput = null, curH2 = null, curH3 = null;
        Array.from(home.children).forEach((el) => {
            if (el.tagName === 'H2') {
                curH2 = el; curOutput = null;
                const txt = el.textContent.toLowerCase();
                if (txt.includes('seedvc')) curOutput = 'seedvc';
                else if (txt.includes('tortoise')) curOutput = 'tortoise';
                else if (txt.includes('openvoice')) curOutput = 'openvoice';
                else if (txt.includes('sv2tts')) curOutput = 'rtvc';
                else if (txt.includes('diffvc')) curOutput = 'diffvc';
                else if (txt.includes('yourtts')) curOutput = 'coqui';
                else curOutput = null;
            }
            if (el.tagName === 'H3') {
                curH3 = el; curInput = null;
                const txt = el.textContent.toLowerCase();
                if (txt.includes('antifake')) curInput = 'antifake';
                else if (txt.includes('attackvc')) curInput = 'attackvc';
                else if (txt.includes('voiceguard')) curInput = 'voiceguard';
                else curInput = null;
            }
            if (el.tagName === 'TABLE') {
                let outKey = curOutput || 'input';
                let inKey = curInput || 'all';
                if (!groupMap[outKey]) groupMap[outKey] = {};
                if (!groupMap[outKey][inKey]) groupMap[outKey][inKey] = [];
                groupMap[outKey][inKey].push({ h2: curH2, h3: curH3, table: el });
            }
        });
        // transformTables after groupMap is ready
        function patchTableViews() {
            Object.values(groupMap).forEach(outGrp => {
                Object.values(outGrp).forEach(arr => {
                    arr.forEach(g => {
                        if (g.table) {
                            g.tableView = g.table.closest('.table-view');
                            g.cardView = g.tableView && g.tableView.nextElementSibling && g.tableView.nextElementSibling.classList.contains('card-view') ? g.tableView.nextElementSibling : null;
                        }
                    });
                });
            });
        }
        // --- insert filter groups ---
        const h1s = Array.from(home.children).filter(el => el.tagName === 'H1');
        const inputH1 = h1s[1];
        const outputH1 = h1s[2];
        // input checkbox
        let inputFilterDiv = document.getElementById('inputGroupWrap');
        if (!inputFilterDiv) {
            inputFilterDiv = document.createElement('div');
            inputFilterDiv.id = 'inputGroupWrap';
            inputFilterDiv.style.margin = '1.2em 0 1.5em 0';
            inputFilterDiv.innerHTML = `<div style="display:flex;gap:0.5em;flex-wrap:wrap;align-items:center;"><span style="font-weight:600;min-width:120px;">Voice Cloning Input:</span><div id="inputGroup" style="display:flex;gap:0.5em;flex-wrap:wrap;"></div></div>`;
            if (inputH1) inputH1.parentNode.insertBefore(inputFilterDiv, inputH1.nextSibling);
        }
        // output checkbox
        let outputFilterDiv = document.getElementById('outputGroupWrap');
        if (!outputFilterDiv) {
            outputFilterDiv = document.createElement('div');
            outputFilterDiv.id = 'outputGroupWrap';
            outputFilterDiv.style.margin = '1.2em 0 1.5em 0';
            outputFilterDiv.innerHTML = `<div style="display:flex;gap:0.5em;flex-wrap:wrap;align-items:center;"><span style="font-weight:600;min-width:120px;">Voice Cloning Output:</span><div id="outputGroup" style="display:flex;gap:0.5em;flex-wrap:wrap;"></div></div>`;
            if (outputH1) outputH1.parentNode.insertBefore(outputFilterDiv, outputH1.nextSibling);
        }
        // render radio buttons
        function renderRadios(group, arr, defaultKey, onChange) {
            group.innerHTML = '';
            arr.forEach(opt => {
                const id = group.id + '_' + opt.key;
                const label = document.createElement('label');
                label.className = 'custom-radio-label';
                label.style.display = 'inline-flex';
                label.style.alignItems = 'center';
                label.style.gap = '0.3em';
                label.style.fontWeight = '500';
                label.style.color = '#157878';
                label.style.fontSize = '1em';
                label.style.marginRight = '0.7em';
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = group.id + '_radio';
                radio.value = opt.key;
                radio.id = id;
                radio.checked = (opt.key === defaultKey);
                radio.className = 'custom-radio-input';
                radio.addEventListener('change', () => {
                    if (radio.checked) onChange(radio.value);
                });
                label.appendChild(radio);
                // custom circle style
                const customCircle = document.createElement('span');
                customCircle.className = 'custom-radio-circle';
                label.appendChild(customCircle);
                label.appendChild(document.createTextNode(opt.label));
                group.appendChild(label);
            });
        }
        // input radio filter
        function filterInputGroups(inputKey) {
            if (!inputKey) inputKey = 'antifake';
            if (groupMap['input']) {
                Object.values(groupMap['input']).flat().forEach(g => {
                    if (g.h2) g.h2.style.display = 'none';
                    if (g.h3) g.h3.style.display = 'none';
                    if (g.tableView) g.tableView.style.display = 'none';
                    if (g.cardView) g.cardView.style.display = 'none';
                });
                if (inputKey === 'all') {
                    Object.values(groupMap['input']).flat().forEach(g => {
                        if (g.h2) g.h2.style.display = '';
                        if (g.h3) g.h3.style.display = '';
                        if (g.tableView) g.tableView.style.display = '';
                        if (g.cardView) g.cardView.style.display = '';
                    });
                } else {
                    if (groupMap['input'][inputKey]) {
                        groupMap['input'][inputKey].forEach(g => {
                            if (g.h2) g.h2.style.display = '';
                            if (g.h3) g.h3.style.display = '';
                            if (g.tableView) g.tableView.style.display = '';
                            if (g.cardView) g.cardView.style.display = '';
                        });
                    }
                }
            }
        }
        // output radio filter
        function filterOutputGroups(outputKey) {
            if (!outputKey) outputKey = 'seedvc';
            Object.keys(groupMap).forEach(outK => {
                if (outK === 'input') return;
                Object.values(groupMap[outK]).flat().forEach(g => {
                    if (g.h2) g.h2.style.display = 'none';
                    if (g.h3) g.h3.style.display = 'none';
                    if (g.tableView) g.tableView.style.display = 'none';
                    if (g.cardView) g.cardView.style.display = 'none';
                });
            });
            if (outputKey === 'all') {
                Object.keys(groupMap).forEach(outK => {
                    if (outK === 'input') return;
                    Object.values(groupMap[outK]).flat().forEach(g => {
                        if (g.h2) g.h2.style.display = '';
                        if (g.h3) g.h3.style.display = '';
                        if (g.tableView) g.tableView.style.display = '';
                        if (g.cardView) g.cardView.style.display = '';
                    });
                });
            } else {
                if (groupMap[outputKey]) {
                    Object.values(groupMap[outputKey]).flat().forEach(g => {
                        if (g.h2) g.h2.style.display = 'none'; // when output≠all, hide h2
                        if (g.h3) g.h3.style.display = '';
                        if (g.tableView) g.tableView.style.display = '';
                        if (g.cardView) g.cardView.style.display = '';
                    });
                }
            }
        }
        // render radio buttons
        renderRadios(document.getElementById('inputGroup'), INPUTS, 'antifake', filterInputGroups);
        renderRadios(document.getElementById('outputGroup'), OUTPUTS, 'seedvc', filterOutputGroups);
        // transformTables after renderRadios to ensure tableView/cardView references are set
        window.__patchTableViews = patchTableViews;
        window.__filterInputGroups = filterInputGroups;
        window.__filterOutputGroups = filterOutputGroups;
    }

    // Initial run
    setupSeparatedDemoFilters();
    transformTables();
    if (window.__patchTableViews && window.__filterInputGroups && window.__filterOutputGroups) {
        window.__patchTableViews();
        window.__filterInputGroups(['antifake']);
        window.__filterOutputGroups(['seedvc']);
    }
    setupAudioLazyLoad();
});
