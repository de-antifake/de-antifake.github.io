document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content2');
    if (!mainContent) return;

    // New: Directly get all tables with group tags
    function getTablesByGroup(input, output) {
        let selector = 'table';
        if (input && input !== 'all') selector += `[data-input="${input}"]`;
        if (output && output !== 'all') selector += `[data-output="${output}"]`;
        return Array.from(mainContent.querySelectorAll(selector));
    }

    // Transform a single table into card view
    function transformTable(table) {
        if (table.closest('.table-view')) return;
        const tableView = document.createElement('div');
        tableView.className = 'table-view';
        table.parentNode.insertBefore(tableView, table);
        tableView.appendChild(table);
        const headers = Array.from(table.querySelectorAll('tr:first-of-type th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        if (headers.length < 2 || rows.length === 0) return;
        const columnsData = [];
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
                    const source = audioPlayer.querySelector('source');
                    columnsData[index].items.push({
                        label: rowHeaderText,
                        src: source ? source.getAttribute('src') : '',
                        type: source ? source.getAttribute('type') : '',
                    });
                }
            });
        });
        const cardView = document.createElement('div');
        cardView.className = 'card-view';
        columnsData.forEach((column) => {
            const card = document.createElement('div');
            card.className = 'audio-card';
            let cardHTML = `<h3>${column.title}</h3>`;
            column.items.forEach((item) => {
                if (item.src) {
                    cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(item.src)}" data-type="${item.type}" data-loaded="false"><p>${item.label}</p><div class="audio-placeholder">Loading...</div></div>`;
                } else {
                    // Optional: Show gray tip when no audio
                    cardHTML += `<div class="audio-item no-audio"><p>${item.label}</p><div class="audio-placeholder">No audio</div></div>`;
                }
            });
            card.innerHTML = cardHTML;
            cardView.appendChild(card);
        });
        tableView.parentNode.insertBefore(cardView, tableView.nextSibling);
        // Only keep observer binding, remove first screen insertAudioTag related code
        updateAudioLazyLoadForVisible();
    }

    // Lazy transform + show target group
    function showGroup(input, output) {
        // 1. Hide all tables and their views
        mainContent.querySelectorAll('table').forEach(table => {
            table.style.display = 'none';
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = 'none';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = 'none';
        });
        // 2. Show target group tables and their views (transform if not yet transformed)
        const tables = getTablesByGroup(input, output);
        tables.forEach(table => {
            table.style.display = '';
            if (!table.closest('.table-view')) transformTable(table);
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = '';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = '';
        });
        updateAudioLazyLoadForVisible();
    }

    // New: Separate input/output group display logic
    function showInputGroup(input) {
        // 1. Hide all input group tables and their views
        mainContent.querySelectorAll('table[data-output="input"]').forEach(table => {
            table.style.display = 'none';
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = 'none';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = 'none';
        });
        // 2. Hide all input group related h3 (only hide h3 related to input group tables)
        const inputTitles = new Set();
        mainContent.querySelectorAll('table[data-output="input"]').forEach(table => {
            const titles = tableTitleMap.get(table) || [];
            titles.forEach(title => { if (title.tagName === 'H3') inputTitles.add(title); });
        });
        inputTitles.forEach(title => { title.style.display = 'none'; });
        // 3. Show target input group tables and their views
        let selector = 'table[data-output="input"]';
        if (input && input !== 'all') selector += `[data-input="${input}"]`;
        const visibleTables = Array.from(mainContent.querySelectorAll(selector));
        visibleTables.forEach(table => {
            table.style.display = '';
            if (!table.closest('.table-view')) transformTable(table);
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = '';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = '';
        });
        // 4. Only show h3 with visible tables
        inputTitles.forEach(title => {
            const tables = titleTableMap.get(title) || [];
            if (tables.some(table => table.style.display !== 'none')) {
                title.style.display = '';
            }
        });
        // Ensure observer binding is refreshed after each group switch
        updateAudioLazyLoadForVisible();
        cleanupAllAudioTags(); // clean up all audio tags on switch
        updateAudioLazyLoadForVisible(); // rebind lazy loading
    }
    function showOutputGroup(output) {
        // 1. Hide all output group tables and their views
        mainContent.querySelectorAll('table:not([data-output="input"])').forEach(table => {
            table.style.display = 'none';
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = 'none';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = 'none';
        });
        // 2. Hide all output group related h2/h3 (only hide h2/h3 related to output group tables)
        const outputTitles = new Set();
        mainContent.querySelectorAll('table:not([data-output="input"])').forEach(table => {
            const titles = tableTitleMap.get(table) || [];
            titles.forEach(title => outputTitles.add(title));
        });
        outputTitles.forEach(title => { title.style.display = 'none'; });
        // 3. Show target output group tables and their views
        let selector = 'table';
        if (output && output !== 'all') selector += `[data-output="${output}"]`;
        else selector += ':not([data-output="input"])';
        const visibleTables = Array.from(mainContent.querySelectorAll(selector));
        visibleTables.forEach(table => {
            table.style.display = '';
            if (!table.closest('.table-view')) transformTable(table);
            const tv = table.closest('.table-view');
            if (tv) tv.style.display = '';
            const cv = tv && tv.nextElementSibling && tv.nextElementSibling.classList.contains('card-view') ? tv.nextElementSibling : null;
            if (cv) cv.style.display = '';
        });
        // 4. Only show h2/h3 with visible tables
        outputTitles.forEach(title => {
            const tables = titleTableMap.get(title) || [];
            if (tables.some(table => table.style.display !== 'none')) {
                // New: Only show h3 when output !== 'all', hide h2
                if (output !== 'all' && title.tagName === 'H2') {
                    title.style.display = 'none';
                } else {
                    title.style.display = '';
                }
            }
        });
        // Ensure observer binding is refreshed after each group switch
        updateAudioLazyLoadForVisible();
        cleanupAllAudioTags(); // remove all audio tags on switch
        updateAudioLazyLoadForVisible(); // rebind lazy loading
    }

    // Cleanup all audio tags on switch
    function cleanupAllAudioTags() {
        const allAudioItems = mainContent.querySelectorAll('.audio-item');
        allAudioItems.forEach(item => removeAudioTag(item));
    }

    // Lazy load only bind visible groups
    function updateAudioLazyLoadForVisible() {
        if (window.audioObserver) window.audioObserver.disconnect();
        const allAudioItems = mainContent.querySelectorAll('.audio-item');
        allAudioItems.forEach(item => {
            if (item.offsetParent !== null && item.closest('[style*="display: none"]') === null) {
                if (window.audioObserver) window.audioObserver.observe(item);
            }
            // 不再调用 removeAudioTag
        });
    }

    // Lazy load related functions (reuse original)
    let audioObserver = null;
    function setupAudioLazyLoad() {
        const audioItems = mainContent.querySelectorAll('.audio-item');
        let preloadCount = 0;
        audioItems.forEach(item => {
            if (preloadCount < 8 && item.dataset.loaded === 'false') {
                insertAudioTag(item);
                preloadCount++;
            }
        });
        if (!('IntersectionObserver' in window)) {
            audioItems.forEach(item => {
                if (item.dataset.loaded === 'false') {
                    insertAudioTag(item);
                }
            });
            return;
        }
        if (audioObserver) audioObserver.disconnect();
        audioObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                const item = entry.target;
                if (entry.isIntersecting) {
                    if (item.dataset.loaded === 'false') {
                        insertAudioTag(item);
                    }
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.01 });
        window.audioObserver = audioObserver;
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
        const placeholder = item.querySelector('.audio-placeholder');
        if (placeholder) placeholder.remove();
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
        if (audio && !audio.paused) return;
        if (audio) audio.remove();
        if (!item.querySelector('.audio-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'audio-placeholder';
            placeholder.textContent = 'Loading...';
            item.appendChild(placeholder);
        }
        item.dataset.loaded = 'false';
    }
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
    window.addEventListener('resize', () => {
        updateAudioLazyLoadForVisible();
    });

    // Render radio controls
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
            const customCircle = document.createElement('span');
            customCircle.className = 'custom-radio-circle';
            label.appendChild(customCircle);
            label.appendChild(document.createTextNode(opt.label));
            group.appendChild(label);
        });
    }

    // Control insertion and event binding
    const home = document.getElementById('home');
    const h1s = Array.from(home.children).filter(el => el.tagName === 'H1');
    const inputH1 = h1s[1];
    const outputH1 = h1s[2];
    let inputFilterDiv = document.getElementById('inputGroupWrap');
    if (!inputFilterDiv) {
        inputFilterDiv = document.createElement('div');
        inputFilterDiv.id = 'inputGroupWrap';
        inputFilterDiv.style.margin = '1.2em 0 1.5em 0';
        inputFilterDiv.innerHTML = `<div style="display:flex;gap:0.5em;flex-wrap:wrap;align-items:center;"><span style="font-weight:600;min-width:120px;">Voice Cloning Input:</span><div id="inputGroup" style="display:flex;gap:0.5em;flex-wrap:wrap;"></div></div>`;
        if (inputH1) inputH1.parentNode.insertBefore(inputFilterDiv, inputH1.nextSibling);
    }
    let outputFilterDiv = document.getElementById('outputGroupWrap');
    if (!outputFilterDiv) {
        outputFilterDiv = document.createElement('div');
        outputFilterDiv.id = 'outputGroupWrap';
        outputFilterDiv.style.margin = '1.2em 0 1.5em 0';
        outputFilterDiv.innerHTML = `<div style="display:flex;gap:0.5em;flex-wrap:wrap;align-items:center;"><span style="font-weight:600;min-width:120px;">Voice Cloning Output:</span><div id="outputGroup" style="display:flex;gap:0.5em;flex-wrap:wrap;"></div></div>`;
        if (outputH1) outputH1.parentNode.insertBefore(outputFilterDiv, outputH1.nextSibling);
    }
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
    let curInput = 'antifake', curOutput = 'seedvc';
    renderRadios(document.getElementById('inputGroup'), INPUTS, curInput, (val) => {
        curInput = val;
        showInputGroup(curInput);
    });
    renderRadios(document.getElementById('outputGroup'), OUTPUTS, curOutput, (val) => {
        curOutput = val;
        showOutputGroup(curOutput);
    });

    // --- Title and table mapping ---
    // table => [h2, h3], title => [table, ...]
    const tableTitleMap = new Map(); // table => [h2, h3]
    const titleTableMap = new Map(); // h2/h3 => [table, ...]
    (function buildTableTitleMap() {
        const tables = mainContent.querySelectorAll('table');
        tables.forEach(table => {
            let prev = table.previousElementSibling;
            let h3 = null, h2 = null;
            while (prev) {
                if (!h3 && prev.tagName === 'H3') h3 = prev;
                if (!h2 && prev.tagName === 'H2') h2 = prev;
                if (h2 && h3) break;
                prev = prev.previousElementSibling;
            }
            const titles = [];
            if (h2) titles.push(h2);
            if (h3) titles.push(h3);
            tableTitleMap.set(table, titles);
            titles.forEach(title => {
                if (!titleTableMap.has(title)) titleTableMap.set(title, []);
                titleTableMap.get(title).push(table);
            });
        });
    })();

    // Record all h2/h3 for one-click hiding
    const allTitles = Array.from(mainContent.querySelectorAll('h2, h3'));

    // Only show default group on first screen
    showInputGroup(curInput);
    showOutputGroup(curOutput);
    setupAudioLazyLoad();
});
