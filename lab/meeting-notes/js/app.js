// Constants
const LOCAL_STORAGE_KEY = 'meetingNotes';
const DRAFT_STORAGE_KEY = 'noteDraftData';
const SETTINGS_STORAGE_KEY = 'meetingNotesSettings';
const DARK_MODE_KEY = 'darkModeEnabled';

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const addNoteFab = document.getElementById('addNoteFab');
const noteModal = document.getElementById('noteModal');
const closeModalBtn = document.getElementById('noteModalCloseBtn');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitle');
const contentInputArea = document.getElementById('contentInputArea');
const noteContentHiddenInput = document.getElementById('noteContentHidden');
const trixEditorWrapper = document.getElementById('trixEditorWrapper');
const trixEditorElement = document.querySelector('trix-editor');
const noteTabButtons = document.querySelectorAll('.note-tab-btn');
const noteTabPanels = document.querySelectorAll('.note-tab-panel');
const actionItemsList = document.getElementById('actionItemsList');
const deadlineGroup = document.getElementById('deadlineGroup');
const noteDeadlineInput = document.getElementById('noteDeadline');
const clearDeadlineBtn = document.getElementById('clearDeadlineBtn');
const noteTagsContainer = document.getElementById('noteTags');
const infoTooltipButtons = document.querySelectorAll('.info-tooltip-btn');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const searchInput = document.getElementById('searchInput');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const searchPanel = document.getElementById('searchPanel');
const searchSurface = document.getElementById('searchSurface');
const tagFilterSection = document.getElementById('tagFilterSection');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const headerMenu = document.getElementById('headerMenu');
const settingsBtn = document.getElementById('settingsBtn');
const exportXmlBtn = document.getElementById('exportXmlBtn');
const importXmlBtn = document.getElementById('importXmlBtn');
const importXmlInput = document.getElementById('importXmlInput');
const settingsModal = document.getElementById('settingsModal');
const settingsDoneBtn = document.getElementById('settingsDoneBtn');
const openHelpModalBtn = document.getElementById('openHelpModalBtn');
const helpModal = document.getElementById('helpModal');
const confirmDialog = document.getElementById('confirmDialog');
const confirmDialogTitle = document.getElementById('confirmDialogTitle');
const confirmDialogMessage = document.getElementById('confirmDialogMessage');
const confirmDialogCancelBtn = document.getElementById('confirmDialogCancelBtn');
const confirmDialogConfirmBtn = document.getElementById('confirmDialogConfirmBtn');
const settingsThemeInputs = document.querySelectorAll('input[name="themeSetting"]');
const settingShowTagFilters = document.getElementById('settingShowTagFilters');
const settingShowCompletedGeneralTodo = document.getElementById('settingShowCompletedGeneralTodo');
const settingShowGeneralTodo = document.getElementById('settingShowGeneralTodo');
const settingShowArchived = document.getElementById('settingShowArchived');
const settingSortMode = document.getElementById('settingSortMode');
const mainHeader = document.querySelector('.main-header');

// Global variables
let notes = [];
let selectedTags = new Set();
let dateFilter = 'all';
let statusFilter = 'all';
let currentlyEditingNote = null;
let appSettings = null;
let confirmDialogResolver = null;
const MOBILE_BREAKPOINT = 768;
const DEFAULT_APP_SETTINGS = {
    theme: 'system',
    showTagFilters: true,
    showCompletedGeneralTodo: true,
    showGeneralTodo: true,
    showArchived: false,
    sortMode: 'created-desc'
};
const ACTION_ITEM_BUTTON_ICONS = {
    add: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5v14M5 12h14"></path>
        </svg>
    `,
    edit: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
    `,
    delete: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
        </svg>
    `
};

// Utility Functions
function clearMessages() {
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');
    if (statusDiv) statusDiv.textContent = '';
    if (errorDiv) errorDiv.textContent = '';
}

function showMessage(message, isError = false) {
    if (!message) return;
    
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');
    const targetDiv = isError ? errorDiv : statusDiv;
    
    if (!targetDiv) {
        console.log(isError ? 'Error: ' : 'Status: ', message);
        return;
    }
    
    clearMessages();
    targetDiv.textContent = message;
    
    // Auto-hide after delay
    setTimeout(() => {
        if (targetDiv.textContent === message) {
            targetDiv.textContent = '';
        }
    }, isError ? 5000 : 3000);
}

function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateHeaderOffset() {
    if (!mainHeader) return;
    const headerHeight = Math.ceil(mainHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-offset', `${headerHeight}px`);
}

function setSearchPanelOpen(isOpen) {
    if (!searchToggleBtn || !searchPanel || !searchSurface) return;

    const shouldOpen = Boolean(isOpen);

    if (!shouldOpen && searchPanel.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    searchSurface.classList.toggle('is-open', shouldOpen);
    searchSurface.setAttribute('aria-hidden', String(!shouldOpen));
    searchToggleBtn.classList.toggle('active', shouldOpen);
    searchToggleBtn.setAttribute('aria-expanded', String(shouldOpen));
    searchPanel.setAttribute('aria-hidden', String(!shouldOpen));

    updateHeaderOffset();
}

function focusSearchInput() {
    if (!searchInput) return;

    headerMenu?.classList.remove('show');
    setSearchPanelOpen(true);

    requestAnimationFrame(() => {
        searchInput.focus();
    });
}

function syncResponsiveHeaderState() {
    if (!searchToggleBtn || !searchPanel || !searchSurface) {
        updateHeaderOffset();
        return;
    }

    const isOpen = searchSurface.classList.contains('is-open');
    searchToggleBtn.classList.toggle('active', isOpen);
    searchToggleBtn.setAttribute('aria-expanded', String(isOpen));
    searchSurface.setAttribute('aria-hidden', String(!isOpen));
    searchPanel.setAttribute('aria-hidden', String(!isOpen));

    updateHeaderOffset();
}

function parseLegacyActionItems(itemsText = '') {
    return itemsText
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean)
        .map(text => ({ text, completed: false }));
}

function getActiveEditorTab() {
    return document.querySelector('.note-tab-btn.active')?.dataset.tabTarget || 'content';
}

function closeInfoTooltips(except = null) {
    document.querySelectorAll('.info-tooltip').forEach(tooltip => {
        if (tooltip === except) return;
        tooltip.classList.remove('is-open');
        tooltip.querySelector('.info-tooltip-btn')?.setAttribute('aria-expanded', 'false');
    });
}

function positionInfoTooltip(tooltip) {
    const popover = tooltip?.querySelector('.info-tooltip-popover');
    if (!popover) return;

    tooltip.style.setProperty('--tooltip-shift', '0px');

    const tooltipRect = popover.getBoundingClientRect();
    if (!tooltipRect.width) return;

    const viewportPadding = 16;
    const maxRight = window.innerWidth - viewportPadding;
    let shift = 0;

    if (tooltipRect.left < viewportPadding) {
        shift += viewportPadding - tooltipRect.left;
    }

    if (tooltipRect.right > maxRight) {
        shift -= tooltipRect.right - maxRight;
    }

    tooltip.style.setProperty('--tooltip-shift', `${shift}px`);
}

function syncInfoTooltipPositions() {
    document.querySelectorAll('.info-tooltip').forEach(positionInfoTooltip);
}

function setEditorTab(tabName = 'content') {
    noteTabButtons.forEach(button => {
        const isActive = button.dataset.tabTarget === tabName;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1;
    });

    noteTabPanels.forEach(panel => {
        const isActive = panel.dataset.tabPanel === tabName;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
    });

    requestAnimationFrame(syncInfoTooltipPositions);
}

function getActionItemText(row) {
    return row?.querySelector('.action-item-row-input')?.value.trim() || '';
}

function findNextEmptyActionItemRow(afterRow = null) {
    if (!actionItemsList) return null;

    const rows = Array.from(actionItemsList.querySelectorAll('.action-item-row'));
    if (!rows.length) return null;

    const startIndex = afterRow ? rows.indexOf(afterRow) + 1 : 0;
    const remainingRows = rows.slice(Math.max(startIndex, 0));
    const nextRow = remainingRows.find(row => !getActionItemText(row));

    return nextRow || rows.find(row => row !== afterRow && !getActionItemText(row)) || null;
}

function ensureActionItemPlaceholderRow() {
    if (!actionItemsList) return null;

    const existingEmptyRow = findNextEmptyActionItemRow();
    if (existingEmptyRow) return existingEmptyRow;

    return createActionItemRow();
}

function getActionItemButtonState(row) {
    const hasText = Boolean(getActionItemText(row));

    if (!hasText) return 'add';
    if (row.dataset.existing === 'true' && row.dataset.isFocused === 'true') return 'edit';

    return 'delete';
}

function updateActionItemRowButton(row) {
    const actionButton = row?.querySelector('.action-item-action-btn');
    if (!actionButton) return;

    const nextState = getActionItemButtonState(row);
    row.dataset.actionState = nextState;

    actionButton.classList.toggle('is-add', nextState === 'add');
    actionButton.classList.toggle('is-edit', nextState === 'edit');
    actionButton.classList.toggle('is-delete', nextState === 'delete');
    actionButton.innerHTML = ACTION_ITEM_BUTTON_ICONS[nextState];

    const labels = {
        add: 'Add action item',
        edit: 'Edit action item',
        delete: 'Remove action item'
    };

    actionButton.setAttribute('aria-label', labels[nextState]);
    actionButton.setAttribute('title', labels[nextState]);
}

function createActionItemRow(item = {}, { focus = false, insertAfter = null, existing = false } = {}) {
    if (!actionItemsList) return null;

    const row = document.createElement('div');
    row.className = 'action-item-row';
    row.dataset.existing = String(existing && Boolean((item.text || '').trim()));
    row.dataset.isFocused = 'false';
    row.dataset.actionState = 'add';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'action-item-row-checkbox';
    checkbox.checked = Boolean(item.completed);
    checkbox.setAttribute('aria-label', 'Mark action item complete');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'action-item-row-input';
    input.placeholder = 'Add a follow-up action';
    input.value = item.text || '';
    input.addEventListener('focus', () => {
        row.dataset.isFocused = 'true';
        updateActionItemRowButton(row);
    });
    input.addEventListener('blur', () => {
        row.dataset.isFocused = 'false';
        updateActionItemRowButton(row);
    });
    input.addEventListener('input', () => {
        updateActionItemRowButton(row);
        ensureActionItemPlaceholderRow();
    });

    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();

        if (!getActionItemText(row)) {
            input.focus();
            return;
        }

        const nextEmptyRow = ensureActionItemPlaceholderRow();
        const targetRow = nextEmptyRow && nextEmptyRow !== row
            ? nextEmptyRow
            : createActionItemRow({}, { insertAfter: row });

        targetRow?.querySelector('.action-item-row-input')?.focus();
        saveDraft();
    });

    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'action-item-action-btn';
    actionButton.addEventListener('pointerdown', (event) => {
        if (row.dataset.actionState === 'edit') {
            event.preventDefault();
        }
    });
    actionButton.addEventListener('click', () => {
        const currentState = row.dataset.actionState;

        if (currentState === 'delete') {
            row.remove();
            ensureActionItemPlaceholderRow();
            saveDraft();
            return;
        }

        input.focus();

        if (currentState === 'edit') {
            input.select();
        }
    });

    row.appendChild(checkbox);
    row.appendChild(input);
    row.appendChild(actionButton);

    if (insertAfter?.parentElement === actionItemsList) {
        insertAfter.insertAdjacentElement('afterend', row);
    } else {
        actionItemsList.appendChild(row);
    }

    if (focus) {
        requestAnimationFrame(() => input.focus());
    }

    updateActionItemRowButton(row);

    return row;
}

function setActionItemsInEditor(items = []) {
    if (!actionItemsList) return;

    actionItemsList.innerHTML = '';
    const nextItems = Array.isArray(items) ? items.filter(item => item && (item.text || '').trim()) : [];

    nextItems.forEach(item => createActionItemRow(item, { existing: true }));
    ensureActionItemPlaceholderRow();
}

function getActionItemsFromEditor() {
    if (!actionItemsList) return [];

    return Array.from(actionItemsList.querySelectorAll('.action-item-row'))
        .map(row => {
            const text = row.querySelector('.action-item-row-input')?.value.trim() || '';
            const completed = Boolean(row.querySelector('.action-item-row-checkbox')?.checked);

            return { text, completed };
        })
        .filter(item => item.text.length > 0);
}

function setEditorContent(html = '') {
    if (!trixEditorElement?.editor) return;
    trixEditorElement.editor.loadHTML(html || '');
}

function renderNoteTags(tags = []) {
    if (!noteTagsContainer) return;

    noteTagsContainer.innerHTML = '';
    tags.forEach(tag => {
        const tagElement = createTagElement(tag, true);
        noteTagsContainer.appendChild(tagElement);
    });
}

function populateNoteForm(note = null) {
    if (!noteForm || !modalTitle || !noteTitleInput) return;

    noteForm.reset();
    noteIdInput.value = note?.id || '';
    modalTitle.textContent = note ? 'Edit Note' : 'New Note';
    noteTitleInput.value = note?.title || '';
    noteDeadlineInput.value = note?.deadline || '';
    setEditorContent(note?.content || '');
    setActionItemsInEditor(note?.items || []);
    renderNoteTags(note?.tags || []);
    currentlyEditingNote = note;
    setEditorTab('content');
}

function openNoteModal() {
    openModal(noteModal);
}

function openModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    modal.classList.add('show');
    requestAnimationFrame(syncInfoTooltipPositions);
}

function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    modal.classList.remove('show');
}

function closeNoteEditor({ preserveDraft = true } = {}) {
    if (preserveDraft) {
        saveDraft();
    }

    closeModal(noteModal);
}

function closeManagedModal(modal, { preserveDraft = true } = {}) {
    if (!modal) return;

    if (modal === confirmDialog) {
        resolveConfirmDialog(false);
        return;
    }

    if (modal === noteModal) {
        closeNoteEditor({ preserveDraft });
        return;
    }

    closeModal(modal);
}

function createWelcomeNote() {
    return {
        id: Date.now().toString(),
        title: 'Welcome to Meeting Notes!',
        content: 'This is a sample note to help you get started. Click the + button to create your own notes.',
        items: [
            { text: 'Create your first note', completed: false },
            { text: 'Try out the dark mode', completed: false },
            { text: 'Explore keyboard shortcuts (Ctrl/Cmd + ?)', completed: false }
        ],
        tags: ['welcome', 'getting-started'],
        createdAt: new Date().toISOString(),
        pinned: true,
        archived: false
    };
}

function normalizeNote(note = {}) {
    const normalizedItems = Array.isArray(note.items)
        ? note.items
            .map(item => {
                if (typeof item === 'string') {
                    return { text: item.trim(), completed: false };
                }

                if (!item || typeof item !== 'object') return null;

                return {
                    text: String(item.text || '').trim(),
                    completed: Boolean(item.completed ?? item.done)
                };
            })
            .filter(item => item?.text)
        : [];

    const normalizedTags = Array.isArray(note.tags)
        ? note.tags.map(tag => String(tag).trim().replace(/×$/, '').trim()).filter(Boolean)
        : [];

    return {
        id: String(note.id || Date.now()),
        title: String(note.title || '').trim(),
        content: typeof note.content === 'string' ? note.content : '',
        items: normalizedItems,
        deadline: typeof note.deadline === 'string' ? note.deadline : '',
        tags: normalizedTags,
        createdAt: note.createdAt || new Date().toISOString(),
        pinned: Boolean(note.pinned),
        archived: Boolean(note.archived)
    };
}

function getLegacyThemeSetting() {
    const legacyDarkMode = localStorage.getItem('darkMode');
    if (legacyDarkMode === 'true') return 'dark';
    if (legacyDarkMode === 'false') return 'light';
    return DEFAULT_APP_SETTINGS.theme;
}

function loadAppSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            return { ...DEFAULT_APP_SETTINGS, ...parsed };
        } catch (error) {
            console.error('Error parsing app settings:', error);
        }
    }

    return {
        ...DEFAULT_APP_SETTINGS,
        theme: getLegacyThemeSetting()
    };
}

function saveAppSettings() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
    } catch (error) {
        console.error('Error saving app settings:', error);
    }
}

function applyThemeSetting() {
    if (!appSettings) return;

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const shouldUseDarkMode = appSettings.theme === 'dark' || (appSettings.theme === 'system' && prefersDark);
    document.body.classList.toggle('dark-mode', shouldUseDarkMode);
    document.documentElement.style.colorScheme = shouldUseDarkMode ? 'dark' : 'light';
}

function syncSettingsControls() {
    settingsThemeInputs.forEach(input => {
        input.checked = input.value === appSettings?.theme;
    });

    if (settingShowTagFilters) settingShowTagFilters.checked = Boolean(appSettings?.showTagFilters);
    if (settingShowCompletedGeneralTodo) settingShowCompletedGeneralTodo.checked = Boolean(appSettings?.showCompletedGeneralTodo);
    if (settingShowGeneralTodo) settingShowGeneralTodo.checked = Boolean(appSettings?.showGeneralTodo);
    if (settingShowArchived) settingShowArchived.checked = Boolean(appSettings?.showArchived);
    if (settingSortMode) settingSortMode.value = appSettings?.sortMode || DEFAULT_APP_SETTINGS.sortMode;
}

function applyAppSettings({ persist = true } = {}) {
    if (!appSettings) return;

    if (!appSettings.showTagFilters && selectedTags.size > 0) {
        selectedTags.clear();
    }

    applyThemeSetting();
    if (persist) saveAppSettings();
    syncSettingsControls();
    updateTagFilterContainer();
    renderNotes(searchInput?.value || '');
}

function updateSetting(settingName, value) {
    if (!appSettings) return;
    appSettings = {
        ...appSettings,
        [settingName]: value
    };
    applyAppSettings();
}

function toggleThemePreferenceShortcut() {
    if (!appSettings) return;
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    updateSetting('theme', nextTheme);
}

function resolveConfirmDialog(result) {
    if (confirmDialogResolver) {
        confirmDialogResolver(result);
        confirmDialogResolver = null;
    }

    confirmDialogConfirmBtn?.classList.remove('danger');
    closeModal(confirmDialog);
}

function showConfirmDialog({
    title = 'Confirm action',
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default'
} = {}) {
    if (!confirmDialog || !confirmDialogTitle || !confirmDialogMessage || !confirmDialogConfirmBtn || !confirmDialogCancelBtn) {
        return Promise.resolve(false);
    }

    if (confirmDialogResolver) {
        confirmDialogResolver(false);
        confirmDialogResolver = null;
    }

    confirmDialogTitle.textContent = title;
    confirmDialogMessage.textContent = message;
    confirmDialogConfirmBtn.textContent = confirmLabel;
    confirmDialogCancelBtn.textContent = cancelLabel;
    confirmDialogConfirmBtn.classList.toggle('danger', tone === 'danger');

    openModal(confirmDialog);

    return new Promise(resolve => {
        confirmDialogResolver = resolve;
    });
}

const escapeXML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&'"]/g, char => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return char;
        }
    });
};

const unescapeXML = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
};

// Local Storage Functions
function saveNotesToLocalStorage() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
        console.error('Error saving notes to localStorage:', error);
    }
}

function loadNotesFromLocalStorage() {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedNotes) {
        try {
            const parsedNotes = JSON.parse(savedNotes);
            return Array.isArray(parsedNotes) ? parsedNotes.map(normalizeNote) : [];
        } catch (error) {
            console.error('Error parsing notes from localStorage:', error);
            return [];
        }
    }
    return [];
}

// Draft Handling
function saveDraft() {
    if (currentlyEditingNote === null && noteModal.style.display === 'flex') {
        const tagElements = noteTagsContainer.getElementsByClassName('tag');
        const tags = Array.from(tagElements).map(tag => tag.textContent.trim().replace(/×$/, '').trim());
        const actionItems = getActionItemsFromEditor();
        
        const draftData = {
            title: noteTitleInput.value,
            content: trixEditorElement.value,
            actionItems,
            deadline: noteDeadlineInput.value,
            tags,
            activeTab: getActiveEditorTab()
        };
        
        try {
            if (draftData.title.trim() || draftData.content.trim() || draftData.actionItems.length > 0 || draftData.tags.length > 0) {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
            } else {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    }
}

function clearDraft() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
}

async function checkAndRestoreDraft() {
    const draftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draftJson) {
        const shouldRestore = await showConfirmDialog({
            title: 'Restore draft?',
            message: 'You have an unsaved note draft. Restore it into the editor?',
            confirmLabel: 'Restore draft',
            cancelLabel: 'Discard draft'
        });

        if (shouldRestore) {
            try {
                const draftData = JSON.parse(draftJson);
                noteTitleInput.value = draftData.title || '';
                noteDeadlineInput.value = draftData.deadline || '';
                
                // Restore Trix editor content
                setEditorContent(draftData.content || '');
                
                const restoredItems = Array.isArray(draftData.actionItems)
                    ? draftData.actionItems
                    : parseLegacyActionItems(draftData.itemsText || '');
                setActionItemsInEditor(restoredItems);
                
                // Restore tags
                renderNoteTags(draftData.tags || []);
                setEditorTab(draftData.activeTab || 'content');
                
                return true;
            } catch (error) {
                console.error("Error parsing draft:", error);
                clearDraft();
            }
        } else {
            clearDraft();
        }
    }
    return false;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    try {
        const trixEditor = document.querySelector('trix-editor');
        if (trixEditor) {
            trixEditor.addEventListener('trix-initialize', () => {
                const toolbar = trixEditor.toolbarElement;
                const increaseButton = toolbar.querySelector('.trix-button--icon-increase-nesting-level');
                const decreaseButton = toolbar.querySelector('.trix-button--icon-decrease-nesting-level');

                if (increaseButton) increaseButton.disabled = false;
                if (decreaseButton) decreaseButton.disabled = false;
            });

            trixEditor.addEventListener('trix-selection-change', () => {
                const toolbar = trixEditor.toolbarElement;
                const increaseButton = toolbar.querySelector('.trix-button--icon-increase-nesting-level');
                const decreaseButton = toolbar.querySelector('.trix-button--icon-decrease-nesting-level');

                const editor = trixEditor.editor;
                const selectedRange = editor.getSelectedRange();
                const [startPosition] = selectedRange;
                const block = editor.getDocument().getBlockAtPosition(startPosition);

                const isListItem = block && (block.attributes.values.bulletList || block.attributes.values.numberList);
                const nestingLevel = block ? (block.attributes.values.nestingLevel || 0) : 0;

                if (increaseButton) increaseButton.disabled = !isListItem;
                if (decreaseButton) decreaseButton.disabled = !isListItem || nestingLevel === 0;
            });
        }

        appSettings = loadAppSettings();
        notes = loadNotesFromLocalStorage();

        if (notes.length === 0) {
            notes.push(createWelcomeNote());
            saveNotesToLocalStorage();
        }

        setupEventListeners();
        applyAppSettings({ persist: false });

        if (notes.length > 0) {
            showMessage(`Loaded ${notes.length} notes successfully`);
        }

        syncResponsiveHeaderState();
    } catch (error) {
        console.error('Error initializing application:', error);
        showMessage('Error loading notes. Please check console for details.', true);
    }
});

// Initialize dark mode
function initializeDarkMode() {
    appSettings = appSettings || loadAppSettings();
    applyThemeSetting();
}

// Set up event listeners
function setupEventListeners() {
    infoTooltipButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();

            const tooltip = button.closest('.info-tooltip');
            if (!tooltip) return;

            const shouldOpen = !tooltip.classList.contains('is-open');
            closeInfoTooltips(shouldOpen ? tooltip : null);
            tooltip.classList.toggle('is-open', shouldOpen);
            button.setAttribute('aria-expanded', String(shouldOpen));
            if (shouldOpen) {
                requestAnimationFrame(() => positionInfoTooltip(tooltip));
            }
        });
    });

    noteTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            setEditorTab(button.dataset.tabTarget);
            saveDraft();
        });
    });

    if (clearDeadlineBtn) {
        clearDeadlineBtn.addEventListener('click', () => {
            noteDeadlineInput.value = '';
            saveDraft();
        });
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderNotes(searchInput.value);
        });
    }

    // Date filter
    const dateFilterSelect = document.getElementById('dateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', (e) => {
            dateFilter = e.target.value;
            renderNotes(searchInput?.value || '');
        });
    }

    // Status filter
    const statusFilterSelect = document.getElementById('statusFilter');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            renderNotes(searchInput?.value || '');
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Reset search
            if (searchInput) searchInput.value = '';
            
            // Reset date filter
            if (dateFilterSelect) dateFilterSelect.value = 'all';
            dateFilter = 'all';
            
            // Reset status filter
            if (statusFilterSelect) statusFilterSelect.value = 'all';
            statusFilter = 'all';
            
            // Reset tag filters
            selectedTags.clear();
            updateTagFilterContainer();
            
            // Re-render notes
            renderNotes();
            
            showMessage('All filters cleared');
        });
    }

    // Menu toggle
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const headerMenu = document.getElementById('headerMenu');
    if (menuToggleBtn && headerMenu) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSearchPanelOpen(false);
            headerMenu.classList.toggle('show');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            closeInfoTooltips();

            if (!menuToggleBtn.contains(e.target) && !headerMenu.contains(e.target)) {
                headerMenu.classList.remove('show');
            }

             if (
                searchSurface?.classList.contains('is-open') &&
                !searchSurface.contains(e.target) &&
                !searchToggleBtn?.contains(e.target)
            ) {
                setSearchPanelOpen(false);
            }
        });
    }

    if (searchToggleBtn) {
        searchToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            headerMenu.classList.remove('show');

            const isOpen = searchSurface?.classList.contains('is-open');
            setSearchPanelOpen(!isOpen);

            if (!isOpen) {
                focusSearchInput();
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            headerMenu.classList.remove('show');
            syncSettingsControls();
            openModal(settingsModal);
        });
    }

    settingsThemeInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (!input.checked) return;
            updateSetting('theme', input.value);
        });
    });

    if (settingShowTagFilters) {
        settingShowTagFilters.addEventListener('change', () => {
            updateSetting('showTagFilters', settingShowTagFilters.checked);
        });
    }

    if (settingShowCompletedGeneralTodo) {
        settingShowCompletedGeneralTodo.addEventListener('change', () => {
            updateSetting('showCompletedGeneralTodo', settingShowCompletedGeneralTodo.checked);
        });
    }

    if (settingShowGeneralTodo) {
        settingShowGeneralTodo.addEventListener('change', () => {
            updateSetting('showGeneralTodo', settingShowGeneralTodo.checked);
        });
    }

    if (settingShowArchived) {
        settingShowArchived.addEventListener('change', () => {
            updateSetting('showArchived', settingShowArchived.checked);
        });
    }

    if (settingSortMode) {
        settingSortMode.addEventListener('change', () => {
            updateSetting('sortMode', settingSortMode.value);
        });
    }

    if (settingsDoneBtn) {
        settingsDoneBtn.addEventListener('click', () => {
            closeModal(settingsModal);
        });
    }

    if (openHelpModalBtn) {
        openHelpModalBtn.addEventListener('click', () => {
            closeModal(settingsModal);
            openModal(helpModal);
        });
    }

    if (confirmDialogCancelBtn) {
        confirmDialogCancelBtn.addEventListener('click', () => {
            resolveConfirmDialog(false);
        });
    }

    if (confirmDialogConfirmBtn) {
        confirmDialogConfirmBtn.addEventListener('click', () => {
            resolveConfirmDialog(true);
        });
    }

    // Add note button
    const addNoteFab = document.getElementById('addNoteFab');
    if (addNoteFab) {
        addNoteFab.addEventListener('click', () => {
            openNewNoteModal();
        });
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                closeManagedModal(modal);
            }
        });
    });

    // Modal cancel button
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            closeNoteEditor();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
            closeManagedModal(e.target);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    window.addEventListener('resize', () => {
        syncResponsiveHeaderState();
        syncInfoTooltipPositions();
    });
    window.addEventListener('load', () => {
        syncResponsiveHeaderState();
        syncInfoTooltipPositions();
    });

    // Import XML button
    const importXmlBtn = document.getElementById('importXmlBtn');
    if (importXmlBtn) {
        importXmlBtn.addEventListener('click', () => {
            headerMenu.classList.remove('show');
            importXmlInput.click();
        });
    }

    // Import XML input change handler
    const importXmlInput = document.getElementById('importXmlInput');
    if (importXmlInput) {
        importXmlInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const xmlText = e.target.result;
                const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                        
                        const importedNotes = Array.from(xmlDoc.getElementsByTagName('note')).map(noteEl => normalizeNote({
                            id: noteEl.getAttribute('id') || Date.now().toString(),
                            title: unescapeXML(noteEl.getElementsByTagName('title')[0]?.textContent || ''),
                            content: unescapeXML(noteEl.getElementsByTagName('content')[0]?.textContent || ''),
                            items: Array.from(noteEl.getElementsByTagName('item')).map(item => ({
                                text: unescapeXML(item.textContent),
                                completed: item.getAttribute('completed') === 'true'
                            })),
                            deadline: noteEl.getElementsByTagName('deadline')[0]?.textContent || '',
                            tags: Array.from(noteEl.getElementsByTagName('tag')).map(tag => unescapeXML(tag.textContent)),
                            createdAt: noteEl.getElementsByTagName('createdAt')[0]?.textContent || new Date().toISOString(),
                            pinned: noteEl.getAttribute('pinned') === 'true',
                            archived: noteEl.getAttribute('archived') === 'true'
                        }));

                        if (importedNotes.length > 0) {
                            showConfirmDialog({
                                title: 'Replace notes?',
                                message: `Replace the current ${notes.length} notes with ${importedNotes.length} imported notes?`,
                                confirmLabel: 'Replace notes',
                                cancelLabel: 'Keep current notes',
                                tone: 'danger'
                            }).then(shouldReplace => {
                                if (!shouldReplace) return;
                                notes = importedNotes;
                                saveNotesToLocalStorage();
                                applyAppSettings({ persist: false });
                                showMessage(`Successfully imported ${importedNotes.length} notes`);
                            });
                        } else {
                            showMessage('No valid notes found in the XML file', true);
                        }
                    } catch (error) {
                        console.error('Error importing XML:', error);
                        showMessage('Error importing XML file. Please check the file format.', true);
                    }
                };
                reader.onerror = () => {
                    showMessage('Error reading the XML file', true);
                };
                reader.readAsText(file);
            }
            // Clear the input so the same file can be selected again
            e.target.value = '';
        });
    }

    // Note form submission
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveNote();
        });
    }

    // Modal save button (as backup)
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveNote();
        });
    }

    // Export XML button
    if (exportXmlBtn) {
        exportXmlBtn.addEventListener('click', () => {
            headerMenu.classList.remove('show');
            exportNotesToXML();
        });
    }

    // Clear all notes button
    const clearAllNotesBtn = document.getElementById('clearAllNotesBtn');
    if (clearAllNotesBtn) {
        clearAllNotesBtn.addEventListener('click', () => {
            headerMenu.classList.remove('show');
            clearAllNotes();
        });
    }

    if (noteForm) {
        noteForm.addEventListener('input', () => {
            saveDraft();
        });
    }

    if (trixEditorElement) {
        trixEditorElement.addEventListener('trix-change', () => {
            saveDraft();
        });
    }

    if (window.matchMedia) {
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        colorSchemeQuery.addEventListener?.('change', () => {
            if (appSettings?.theme === 'system') {
                applyThemeSetting();
            }
        });
    }
}

// Note Actions
async function openNewNoteModal() {
    if (!noteModal || !modalTitle || !noteForm || !noteTagsContainer || !trixEditorElement) {
        console.error('Required modal elements not found');
        return;
    }

    populateNoteForm();

    openNoteModal();

    // Check for draft
    const draftRestored = await checkAndRestoreDraft();
    if (!draftRestored) {
        noteTitleInput.focus();
    }
}

function openExistingNoteModal(note) {
    populateNoteForm(note);
    openNoteModal();
    noteTitleInput.focus();
}

function saveNote() {
    if (noteForm && !noteForm.reportValidity()) {
        return;
    }

    const noteId = noteIdInput.value;
    const title = noteTitleInput.value.trim();
    const content = trixEditorElement.value;
    const deadline = noteDeadlineInput.value;
    const items = getActionItemsFromEditor();
    const tagElements = noteTagsContainer.getElementsByClassName('tag');
    const tags = Array.from(tagElements).map(tag => tag.textContent.trim().replace(/×$/, '').trim());

    const existingNote = noteId ? notes.find(n => n.id === noteId) : null;
    const note = normalizeNote({
        id: noteId || Date.now().toString(),
        title: title || 'Untitled Note',
        content,
        deadline,
        items,
        tags,
        createdAt: existingNote?.createdAt || new Date().toISOString(),
        pinned: existingNote?.pinned || false,
        archived: existingNote?.archived || false
    });

    if (noteId) {
        // Update existing note
        const index = notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            notes[index] = note;
        }
    } else {
        // Add new note
        notes.unshift(note);
    }

    // Save to localStorage
    saveNotesToLocalStorage();

    // Clear draft
    clearDraft();

    // Close modal
    closeNoteEditor({ preserveDraft: false });

    // Refresh notes display
    applyAppSettings({ persist: false });

    // Show success message
    showMessage('Note saved successfully');
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
        closeInfoTooltips();
        const activeModal = Array.from(document.querySelectorAll('.modal.show')).pop();
        if (activeModal) {
            closeManagedModal(activeModal);
            return;
        }

        if (headerMenu.classList.contains('show')) {
            headerMenu.classList.remove('show');
            return;
        }

        if (searchSurface?.classList.contains('is-open')) {
            setSearchPanelOpen(false);
        }
        return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                openNewNoteModal();
                break;
            case 's':
                e.preventDefault();
                if (document.getElementById('noteModal').classList.contains('show')) {
                    saveNote();
                }
                break;
            case 'f':
                e.preventDefault();
                focusSearchInput();
                break;
            case 'e':
                e.preventDefault();
                toggleThemePreferenceShortcut();
                break;
        }
    } else if (e.key === '/') {
        e.preventDefault();
        focusSearchInput();
    }
}

// Export notes to XML
function exportNotesToXML() {
    const xmlDoc = document.implementation.createDocument(null, "notes", null);
    const rootElement = xmlDoc.documentElement;

    notes.forEach(note => {
        const noteElement = xmlDoc.createElement("note");
        noteElement.setAttribute("id", note.id);
        noteElement.setAttribute("pinned", note.pinned.toString());
        noteElement.setAttribute("archived", Boolean(note.archived).toString());

        // Add title
        const titleElement = xmlDoc.createElement("title");
        titleElement.textContent = escapeXML(note.title);
        noteElement.appendChild(titleElement);

        // Add content
        const contentElement = xmlDoc.createElement("content");
        contentElement.textContent = escapeXML(note.content);
        noteElement.appendChild(contentElement);

        // Add items
        if (note.items && note.items.length > 0) {
            const itemsElement = xmlDoc.createElement("items");
            note.items.forEach(item => {
                const itemElement = xmlDoc.createElement("item");
                itemElement.textContent = escapeXML(item.text);
                itemElement.setAttribute("completed", item.completed.toString());
                itemsElement.appendChild(itemElement);
            });
            noteElement.appendChild(itemsElement);
        }

        // Add deadline
        if (note.deadline) {
            const deadlineElement = xmlDoc.createElement("deadline");
            deadlineElement.textContent = note.deadline;
            noteElement.appendChild(deadlineElement);
        }

        // Add tags
        if (note.tags && note.tags.length > 0) {
            const tagsElement = xmlDoc.createElement("tags");
            note.tags.forEach(tag => {
                const tagElement = xmlDoc.createElement("tag");
                // Clean the tag text by removing the '×' character and trimming
                const cleanTagText = tag.replace(/×$/, '').trim();
                tagElement.textContent = escapeXML(cleanTagText);
                tagsElement.appendChild(tagElement);
            });
            noteElement.appendChild(tagsElement);
        }

        // Add creation date
        const createdAtElement = xmlDoc.createElement("createdAt");
        createdAtElement.textContent = note.createdAt;
        noteElement.appendChild(createdAtElement);

        rootElement.appendChild(noteElement);
    });

    // Convert to string and add XML declaration
    const serializer = new XMLSerializer();
    const xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(xmlDoc);
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `meeting-notes-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    // Close the menu
    headerMenu.classList.remove('show');
    showMessage('Notes exported successfully');
}

// Clear all notes
async function clearAllNotes() {
    const shouldClear = await showConfirmDialog({
        title: 'Clear all notes?',
        message: 'Delete every note and reset the workspace to the default welcome note? This cannot be undone.',
        confirmLabel: 'Clear all notes',
        cancelLabel: 'Cancel',
        tone: 'danger'
    });

    if (!shouldClear) return;

    notes = [createWelcomeNote()];
    saveNotesToLocalStorage();
    applyAppSettings({ persist: false });
    showMessage('All notes have been cleared');
}
