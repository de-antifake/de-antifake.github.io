document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Transform a single table into card view
    function transformTable(table) {
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
                } else if (columnsData[index]) {
                    columnsData[index].items.push({
                        label: rowHeaderText,
                        src: '',
                        type: ''
                    });
                }
            });
        });
        const cardView = document.createElement('div');
        cardView.className = 'card-view';
        // copy data-* attributes to cardView
        Array.from(table.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                cardView.setAttribute(attr.name, attr.value);
            }
        });
        if (table.dataset.output === 'input') {
            cardView.setAttribute('data-group', 'input');
        } else {
            cardView.setAttribute('data-group', 'output');
        }
        columnsData.forEach((column) => {
            const card = document.createElement('div');
            card.className = 'audio-card';
            let cardHTML = `<h3 class="audio-card-title">LibriSpeech: ${column.title}</h3>`;
            if (table.dataset.output === 'input') {
                // input group rendering: group rendering with separators (no text)
                column.items.forEach((item, idx) => {
                    if (idx === 1 || idx === 2) {
                        cardHTML += '<div class="audio-group-title"></div>';
                    }
                    if (item.src) {
                        cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(item.src)}" data-type="${item.type}" data-loaded="false"><p>${item.label}</p><div class="audio-placeholder">Loading...</div></div>`;
                    } else {
                        cardHTML += `<div class="audio-item no-audio"><p>${item.label}</p><div class="audio-placeholder">No audio</div></div>`;
                    }
                });
            } else {
                // output group rendering: group rendering with titles
                if (column.items.length > 0) {
                    cardHTML += '<div class="audio-group-title">Original Clean</div>';
                    if (column.items[0].src) {
                        cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(column.items[0].src)}" data-type="${column.items[0].type}" data-loaded="false"><p>${column.items[0].label}</p><div class="audio-placeholder">Loading...</div></div>`;
                    } else {
                        cardHTML += `<div class="audio-item no-audio"><p>${column.items[0].label}</p><div class="audio-placeholder">No audio</div></div>`;
                    }
                }
                if (column.items.length > 1) {
                    cardHTML += '<div class="audio-group-title">Synthesized</div>';
                    for (let i = 1; i < column.items.length; i++) {
                        if (column.items[i].src) {
                            cardHTML += `<div class="audio-item" data-src="${encodeURIComponent(column.items[i].src)}" data-type="${column.items[i].type}" data-loaded="false"><p>${column.items[i].label}</p><div class="audio-placeholder">Loading...</div></div>`;
                        } else {
                            cardHTML += `<div class="audio-item no-audio"><p>${column.items[i].label}</p><div class="audio-placeholder">No audio</div></div>`;
                        }
                    }
                }
            }
            card.innerHTML = cardHTML;
            cardView.appendChild(card);
        });
        table.parentNode.insertBefore(cardView, table.nextSibling);
        table.remove();
    }

    // Find card-views and tables based on group and input/output
    function findGroupViews({ group, input, output }) {
        const selector = group === 'input'
            ? (input && input !== 'all' ? `.card-view[data-group="input"][data-input="${input}"]` : '.card-view[data-group="input"]')
            : (output && output !== 'all' ? `.card-view[data-group="output"][data-output="${output}"]` : '.card-view[data-group="output"]');
        const cardViews = Array.from(mainContent.querySelectorAll(selector));
        // Find all tables that have not been transformed
        let tableSelector = group === 'input'
            ? (input && input !== 'all' ? `table[data-output="input"][data-input="${input}"]` : 'table[data-output="input"]')
            : (output && output !== 'all' ? `table[data-output="${output}"]` : 'table:not([data-output="input"])');
        const tables = Array.from(mainContent.querySelectorAll(tableSelector));
        return { cardViews, tables };
    }

    // New: Separate input/output group display logic
    function showInputGroup(input) {
        // 1. Hide all input group card-views
        mainContent.querySelectorAll('.card-view[data-group="input"]').forEach(cv => { cv.style.display = 'none'; });
        // 2. Hide all input group tables (not yet transformed)
        mainContent.querySelectorAll('table[data-output="input"]').forEach(table => { table.style.display = 'none'; });
        // 3. Hide all related h3 titles
        // (This step is not strictly necessary with the new logic, but kept for clarity)
        const inputTitles = new Set();
        mainContent.querySelectorAll('table[data-output="input"], .card-view[data-group="input"]').forEach(ele => {
            const titles = tableTitleMap.get(ele) || [];
            titles.forEach(title => { if (title.tagName === 'H3') inputTitles.add(title); });
        });
        inputTitles.forEach(title => { title.style.display = 'none'; });
        // 4. Find target card-views and tables
        const { cardViews, tables } = findGroupViews({ group: 'input', input });
        // 5. Transform tables if not yet transformed
        tables.forEach(table => {
            table.style.display = '';
            transformTable(table);
        });
        // 6. Show target card-views
        const { cardViews: cardViews2 } = findGroupViews({ group: 'input', input });
        cardViews2.forEach(cv => { cv.style.display = ''; });
        // 7. Show h3 only if its following table or card-view is visible
        mainContent.querySelectorAll('h3').forEach(title => {
            if (title.classList.contains('audio-card-title')) return; 
            let next = title.nextElementSibling;
            let show = false;
            while (next && (next.tagName === 'TABLE' || (next.classList && next.classList.contains('card-view')))) {
                if (next.style.display !== 'none') show = true;
                next = next.nextElementSibling;
            }
            title.style.display = show ? '' : 'none';
        });
        updateAudioLazyLoadForVisible('input');
        cleanupAllAudioTags('input');
        updateAudioLazyLoadForVisible('input');
    }
    function showOutputGroup(output) {
        // 1. Hide all output group card-views
        mainContent.querySelectorAll('.card-view[data-group="output"]').forEach(cv => { cv.style.display = 'none'; });
        // 2. Hide all output group tables (not yet transformed)
        mainContent.querySelectorAll('table:not([data-output="input"])').forEach(table => { table.style.display = 'none'; });
        // 3. Hide all related h2/h3 titles (not strictly necessary with new logic)
        const outputTitles = new Set();
        mainContent.querySelectorAll('table:not([data-output="input"]), .card-view[data-group="output"]').forEach(ele => {
            const titles = tableTitleMap.get(ele) || [];
            titles.forEach(title => outputTitles.add(title));
        });
        outputTitles.forEach(title => { title.style.display = 'none'; });
        // 4. Find target card-views and tables
        const { cardViews, tables } = findGroupViews({ group: 'output', output });
        // 5. Transform tables if not yet transformed
        tables.forEach(table => {
            table.style.display = '';
            transformTable(table);
        });
        // 6. Show target card-views
        const { cardViews: cardViews2 } = findGroupViews({ group: 'output', output });
        cardViews2.forEach(cv => { cv.style.display = ''; });
        // 7. Show h2/h3 only if its following table or card-view is visible
        mainContent.querySelectorAll('h2, h3').forEach(title => {
            if (title.classList.contains('audio-card-title')) return; 
            let next = title.nextElementSibling;
            let show = false;
            while (next && (next.tagName === 'TABLE' || (next.classList && next.classList.contains('card-view')))) {
                if (next.style.display !== 'none') show = true;
                next = next.nextElementSibling;
            }
            // Show all h2 if output === 'all', otherwise keep previous logic
            if (title.tagName === 'H2' && output === 'all') {
                title.style.display = '';
            } else if (output !== 'all' && title.tagName === 'H2') {
                title.style.display = 'none';
            } else {
                title.style.display = show ? '' : 'none';
            }
        });
        updateAudioLazyLoadForVisible('output');
        cleanupAllAudioTags('output');
        updateAudioLazyLoadForVisible('output');
    }

    // Cleanup all audio tags on switch
    function cleanupAllAudioTags(group) {
        let selector = '.audio-item';
        if (group) selector = `.card-view[data-group="${group}"] .audio-item`;
        const allAudioItems = Array.from(mainContent.querySelectorAll(selector));
        allAudioItems.forEach(item => removeAudioTag(item));
    }

    // Lazy load only bind visible groups
    function updateAudioLazyLoadForVisible(group) {
        if (window.audioObserver) window.audioObserver.disconnect();
        let selector = '.audio-item';
        if (group) selector = `.card-view[data-group="${group}"] .audio-item`;
        const allAudioItems = Array.from(mainContent.querySelectorAll(selector));
        allAudioItems.forEach(item => {
            if (item.offsetParent !== null && item.closest('[style*="display: none"]') === null) {
                if (window.audioObserver) window.audioObserver.observe(item);
            }
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

    function renderRadios(group, options, defaultKey, onChangeCallback) {
        group.innerHTML = '';
        group.className = 'radio-options-container';

        options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'custom-radio-label';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = group.id + '_radio'; 
            radio.value = opt.key;
            radio.id = `${group.id}_${opt.key}`;
            radio.className = 'custom-radio-input';

            if (opt.key === defaultKey) {
                radio.checked = true;
                label.classList.add('is-checked');
            }

            label.appendChild(radio);
            const customCircle = document.createElement('span');
            customCircle.className = 'custom-radio-circle';
            label.appendChild(customCircle);
            label.appendChild(document.createTextNode(opt.label));

            group.appendChild(label);
        });

        group.addEventListener('change', (event) => {
            if (event.target.type === 'radio') {
                group.querySelectorAll('.custom-radio-label').forEach(label => {
                    label.classList.remove('is-checked');
                });

                const checkedLabel = event.target.closest('.custom-radio-label');
                if (checkedLabel) {
                    checkedLabel.classList.add('is-checked');
                }
                
                onChangeCallback(event.target.value);
            }
        });
    }
    const INPUTS = [
        { key: 'all', label: 'All' },
        { key: 'antifake', label: 'AntiFake' },
        { key: 'attackvc', label: 'AttackVC' },
        { key: 'voiceguard', label: 'VoiceGuard' }
    ];
    const OUTPUTS = [
        { key: 'all', label: 'All' },
        { key: 'tortoise', label: 'Tortoise' },
        { key: 'openvoice', label: 'OpenVoice' },
        { key: 'rtvc', label: 'SV2TTS' },
        { key: 'diffvc', label: 'DiffVC' },
        { key: 'coqui', label: 'YourTTS' },
        { key: 'seedvc', label: 'SeedVC' }
    ];
    let curInput = 'antifake';
    let curOutput = 'tortoise';

    function setupRadioControls() {
        const home = document.getElementById('home');
        const inputAnchor = home.querySelector('.before-input');
        const outputAnchor = home.querySelector('.before-output');

        if (!document.getElementById('inputGroupWrap')) {
            const inputFilterDiv = document.createElement('div');
            inputFilterDiv.id = 'inputGroupWrap';
            inputFilterDiv.className = 'filter-group-wrap'; // 使用CSS class
            
            const title = document.createElement('span');
            title.className = 'filter-group-title'; // 使用CSS class
            title.textContent = 'Protection Method:';
            
            const inputGroup = document.createElement('div');
            inputGroup.id = 'inputGroup';
            
            inputFilterDiv.appendChild(title);
            inputFilterDiv.appendChild(inputGroup);
            if (inputAnchor) inputAnchor.parentNode.insertBefore(inputFilterDiv, inputAnchor.nextSibling);

            renderRadios(inputGroup, INPUTS, curInput, (val) => {
                curInput = val;
                showInputGroup(curInput); 
            });
        }
        if (!document.getElementById('outputGroupWrap')) {
            const outputFilterDiv = document.createElement('div');
            outputFilterDiv.id = 'outputGroupWrap';
            outputFilterDiv.className = 'filter-group-wrap'; 

            const title = document.createElement('span');
            title.className = 'filter-group-title'; 
            title.textContent = 'Voice Cloning Method:';
            
            const outputGroup = document.createElement('div');
            outputGroup.id = 'outputGroup';
            
            outputFilterDiv.appendChild(title);
            outputFilterDiv.appendChild(outputGroup);
            if (outputAnchor) outputAnchor.parentNode.insertBefore(outputFilterDiv, outputAnchor.nextSibling);

            renderRadios(outputGroup, OUTPUTS, curOutput, (val) => {
                curOutput = val;
                showOutputGroup(curOutput); 
            });
        }
    }

    setupRadioControls();

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

    // 获取页面上所有的自定义单选框
    const customRadios = document.querySelectorAll('.custom-radio-input');
    // 获取所有单选框的标签，以便我们移除旧的选中状态
    const allLabels = document.querySelectorAll('.custom-radio-label');

    // 定义一个函数来更新状态
    function updateRadioStyles(event) {
        // 找到被点击的单选框所属的组名
        const radioName = event.target.name;
        
        // 移除同一组内所有标签的 .is-checked 类
        document.querySelectorAll(`input[name="${radioName}"]`).forEach(input => {
            input.closest('.custom-radio-label').classList.remove('is-checked');
        });

        // 为当前选中的单选框的父标签添加 .is-checked 类
        if (event.target.checked) {
            event.target.closest('.custom-radio-label').classList.add('is-checked');
        }
        }

    // 为每个单选框添加点击事件监听
    customRadios.forEach(radio => {
        radio.addEventListener('click', updateRadioStyles);

        // 初始化页面加载时的状态
        if (radio.checked) {
            radio.closest('.custom-radio-label').classList.add('is-checked');
        }
    });
});
