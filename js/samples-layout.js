document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // filter card-views by data-input and data-output
    function filterCardViews(input, output) {
        const allCards = Array.from(mainContent.querySelectorAll('.card-view'));
        allCards.forEach(card => {
            const cardInput = card.getAttribute('data-input');
            const cardOutput = card.getAttribute('data-output');
            const showInput = (input === 'all' || cardInput === input);
            const showOutput = (output === 'all' || cardOutput === output);
            if (showInput && showOutput) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
        // show h2 when: input and output are both 'all'
        // show h3 when: input is 'all' or output is 'all' and there are visible card-views after h3
        mainContent.querySelectorAll('h2, h3').forEach(title => {
            if (title.classList.contains('audio-card-title')) return;
            if (title.tagName === 'H2') {
                if (input === 'all' && output === 'all') {
                    title.style.display = '';
                } else {
                    title.style.display = 'none';
                }
            } else if (title.tagName === 'H3') {
                if (input === 'all' || output === 'all') {
                    // only show h3 title if there are visible card-views after h3 title
                    let next = title.nextElementSibling;
                    let show = false;
                    while (next && (next.classList && next.classList.contains('card-view'))) {
                        if (next.style.display !== 'none') show = true;
                        next = next.nextElementSibling;
                    }
                    title.style.display = show ? '' : 'none';
                } else {
                    title.style.display = 'none';
                }
            }
        });
        cleanupAllAudioTags();
        updateAudioLazyLoadForVisible();
    }

    // cleanup all audio tags
    function cleanupAllAudioTags() {
        const allAudioItems = Array.from(mainContent.querySelectorAll('.audio-item'));
        allAudioItems.forEach(item => removeAudioTag(item));
    }

    // only update audio lazy load for visible audio card-views
    function updateAudioLazyLoadForVisible() {
        if (window.audioObserver) window.audioObserver.disconnect();
        const allAudioItems = Array.from(mainContent.querySelectorAll('.card-view'))
            .filter(card => card.style.display !== 'none')
            .flatMap(card => Array.from(card.querySelectorAll('.audio-item')));
        allAudioItems.forEach(item => {
            if (item.offsetParent !== null && item.closest('[style*="display: none"]') === null) {
                if (window.audioObserver) window.audioObserver.observe(item);
            }
        });
    }

    // 懒加载相关函数（原样保留）
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

    function getLabelByKey(options, key, isInput) {
        if (key === 'all') {
            return isInput ? 'All Protection' : 'All VC';
        }
        const found = options.find(opt => opt.key === key);
        return found ? found.label : key;
    }

    function updateSectionDivider() {
        let divider = document.getElementById('sectionDivider');
        const filterGroupsWrap = document.getElementById('filterGroupsWrap');
        if (!filterGroupsWrap) return;
        const inputLabel = getLabelByKey(INPUTS, curInput, true);
        const outputLabel = getLabelByKey(OUTPUTS, curOutput, false);
        const text = `${inputLabel} & ${outputLabel}`;
        if (!divider) {
            divider = document.createElement('div');
            divider.className = 'section-divider';
            divider.id = 'sectionDivider';
            const span = document.createElement('span');
            span.textContent = text;
            divider.appendChild(span);
            filterGroupsWrap.parentNode.insertBefore(divider, filterGroupsWrap.nextSibling);
        } else {
            const span = divider.querySelector('span');
            if (span) span.textContent = text;
        }
        // unsupported combination message
        let unsupported = document.getElementById('unsupportedCombo');
        const isSeedvc = curOutput === 'seedvc';
        const isVoiceguard = curInput === 'voiceguard';
        const isAttackvc = curInput === 'attackvc';
        let showUnsupported = false;
        if (isSeedvc && (isVoiceguard || isAttackvc)) {
            showUnsupported = true;
        }
        if (showUnsupported) {
            if (!unsupported) {
                unsupported = document.createElement('div');
                unsupported.id = 'unsupportedCombo';
                unsupported.style.color = '#666';
                unsupported.style.textAlign = 'center';
                unsupported.style.marginTop = '8px';
                unsupported.style.fontWeight = '600';
                unsupported.textContent = 'The current combination is not supported.';
                divider.parentNode.insertBefore(unsupported, divider.nextSibling);
            } else {
                unsupported.style.display = '';
            }
        } else if (unsupported) {
            unsupported.style.display = 'none';
        }
    }

    // set up radio controls, and divider
    function setupRadioControls() {
        const home = document.getElementById('home');
        const desc = home.querySelector('.description');
        let insertAfter = desc || home.querySelector('h1');
        if (!document.getElementById('filterGroupsWrap')) {
            const filterGroupsWrap = document.createElement('div');
            filterGroupsWrap.id = 'filterGroupsWrap';
            filterGroupsWrap.className = 'filter-groups-wrap';
            const inputFilterDiv = document.createElement('div');
            inputFilterDiv.id = 'inputGroupWrap';
            inputFilterDiv.className = 'filter-group-wrap';
            const inputTitle = document.createElement('span');
            inputTitle.className = 'filter-group-title';
            inputTitle.textContent = 'Protection Method:';
            const inputGroup = document.createElement('div');
            inputGroup.id = 'inputGroup';
            inputFilterDiv.appendChild(inputTitle);
            inputFilterDiv.appendChild(inputGroup);
            const outputFilterDiv = document.createElement('div');
            outputFilterDiv.id = 'outputGroupWrap';
            outputFilterDiv.className = 'filter-group-wrap';
            const outputTitle = document.createElement('span');
            outputTitle.className = 'filter-group-title';
            outputTitle.textContent = 'Voice Cloning Method:';
            const outputGroup = document.createElement('div');
            outputGroup.id = 'outputGroup';
            outputFilterDiv.appendChild(outputTitle);
            outputFilterDiv.appendChild(outputGroup);
            filterGroupsWrap.appendChild(inputFilterDiv);
            filterGroupsWrap.appendChild(outputFilterDiv);
            if (insertAfter && insertAfter.parentNode) {
                insertAfter.parentNode.insertBefore(filterGroupsWrap, insertAfter.nextSibling);
            } else {
                home.insertBefore(filterGroupsWrap, home.firstChild);
            }
            renderRadios(inputGroup, INPUTS, curInput, (val) => {
                curInput = val;
                filterCardViews(curInput, curOutput);
                updateSectionDivider();
            });
            renderRadios(outputGroup, OUTPUTS, curOutput, (val) => {
                curOutput = val;
                filterCardViews(curInput, curOutput);
                updateSectionDivider();
            });
        }
        updateSectionDivider();
    }

    setupRadioControls();
    filterCardViews(curInput, curOutput);
    setupAudioLazyLoad();

    // radio initialization and event handling
    const customRadios = document.querySelectorAll('.custom-radio-input');
    function updateRadioStyles(event) {
        const radioName = event.target.name;
        document.querySelectorAll(`input[name="${radioName}"]`).forEach(input => {
            input.closest('.custom-radio-label').classList.remove('is-checked');
        });
        if (event.target.checked) {
            event.target.closest('.custom-radio-label').classList.add('is-checked');
        }
    }
    customRadios.forEach(radio => {
        radio.addEventListener('click', updateRadioStyles);
        if (radio.checked) {
            radio.closest('.custom-radio-label').classList.add('is-checked');
        }
    });
});
