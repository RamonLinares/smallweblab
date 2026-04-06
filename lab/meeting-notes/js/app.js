// Constants
const LOCAL_STORAGE_KEY = 'meetingNotes';
const DRAFT_STORAGE_KEY = 'noteDraftData';
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
const menuToggleBtn = document.getElementById('menuToggleBtn');
const headerMenu = document.getElementById('headerMenu');
const exportXmlBtn = document.getElementById('exportXmlBtn');
const importXmlBtn = document.getElementById('importXmlBtn');
const importXmlInput = document.getElementById('importXmlInput');
const mainHeader = document.querySelector('.main-header');

// Global variables
let notes = [];
let selectedTags = new Set();
let dateFilter = 'all';
let statusFilter = 'all';
let currentlyEditingNote = null;
const MOBILE_BREAKPOINT = 768;
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
    if (!searchToggleBtn || !searchPanel) return;

    const shouldOpen = isMobileViewport() && Boolean(isOpen);

    if (!shouldOpen && searchPanel.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    searchSurface?.classList.toggle('is-open', shouldOpen);
    searchToggleBtn.classList.toggle('active', shouldOpen);
    searchToggleBtn.setAttribute('aria-expanded', String(shouldOpen));

    if (shouldOpen || !isMobileViewport()) {
        searchPanel.removeAttribute('aria-hidden');
    } else {
        searchPanel.setAttribute('aria-hidden', 'true');
    }

    updateHeaderOffset();
}

function focusSearchInput() {
    if (!searchInput) return;

    headerMenu?.classList.remove('show');

    if (isMobileViewport()) {
        setSearchPanelOpen(true);
    }

    requestAnimationFrame(() => {
        searchInput.focus();
    });
}

function syncResponsiveHeaderState() {
    if (!searchToggleBtn || !searchPanel) {
        updateHeaderOffset();
        return;
    }

    if (!isMobileViewport()) {
        searchSurface?.classList.remove('is-open');
        searchToggleBtn.classList.remove('active');
        searchToggleBtn.setAttribute('aria-expanded', 'false');
        searchPanel.removeAttribute('aria-hidden');
    } else if (!searchSurface?.classList.contains('is-open')) {
        searchPanel.setAttribute('aria-hidden', 'true');
    }

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
    if (!noteModal) return;
    noteModal.style.display = 'flex';
    noteModal.classList.add('show');
    requestAnimationFrame(syncInfoTooltipPositions);
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
            return Array.isArray(parsedNotes) ? parsedNotes : [];
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

function checkAndRestoreDraft() {
    const draftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draftJson) {
        if (confirm("You have an unsaved draft. Restore it?")) {
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
        // Initialize Trix Editor
        const trixEditor = document.querySelector('trix-editor');
        if (trixEditor) {
            // Enable list nesting by default
            trixEditor.addEventListener('trix-initialize', () => {
                const toolbar = trixEditor.toolbarElement;
                const increaseButton = toolbar.querySelector('.trix-button--icon-increase-nesting-level');
                const decreaseButton = toolbar.querySelector('.trix-button--icon-decrease-nesting-level');
                
                if (increaseButton) {
                    increaseButton.disabled = false;
                }
                if (decreaseButton) {
                    decreaseButton.disabled = false;
                }
            });

            // Handle selection changes
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
                
                if (increaseButton) {
                    increaseButton.disabled = !isListItem;
                }
                if (decreaseButton) {
                    decreaseButton.disabled = !isListItem || nestingLevel === 0;
                }
            });
        }

        // Load notes from localStorage
        notes = loadNotesFromLocalStorage();
        console.log('Loaded notes:', notes);
        
        // Add a test note if no notes exist
        if (notes.length === 0) {
            const testNote = {
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
                pinned: true
            };
            notes.push(testNote);
            saveNotesToLocalStorage();
            console.log('Added test note:', testNote);
        }
        
        // Initialize UI
        renderNotes();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize dark mode
        initializeDarkMode();
        
        // Show initial status
        if (notes.length > 0) {
            showMessage(`Loaded ${notes.length} notes successfully`);
        }

        syncResponsiveHeaderState();
    } catch (error) {
        console.error('Error initializing application:', error);
        showMessage('Error loading notes. Please check console for details.', true);
    }

    // Add draft saving when modal is closed
    if (noteModal) {
        noteModal.addEventListener('click', (e) => {
            if (e.target === noteModal) {
                saveDraft();
            }
        });
    }

    // Add draft saving when close button is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            saveDraft();
        });
    }

    // Add draft saving when cancel button is clicked
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            saveDraft();
        });
    }

    // Add draft saving when escape key is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && noteModal.classList.contains('show')) {
            saveDraft();
        }
    });

    // Add draft saving when form inputs change
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
});

// Initialize dark mode
function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
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
                isMobileViewport() &&
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

            if (!isMobileViewport()) {
                focusSearchInput();
                return;
            }

            const isOpen = searchSurface?.classList.contains('is-open');
            setSearchPanelOpen(!isOpen);

            if (!isOpen) {
                focusSearchInput();
            }
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            headerMenu.classList.remove('show');
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
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });

    // Modal cancel button
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            const noteModal = document.getElementById('noteModal');
            if (noteModal) {
                noteModal.style.display = 'none';
                noteModal.classList.remove('show');
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            // Only close if it's not the note modal
            if (!e.target.id === 'noteModal') {
                e.target.style.display = 'none';
                e.target.classList.remove('show');
            }
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
                        
                        const importedNotes = Array.from(xmlDoc.getElementsByTagName('note')).map(noteEl => ({
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
                            pinned: noteEl.getAttribute('pinned') === 'true'
                        }));

                        if (importedNotes.length > 0) {
                            if (confirm(`Replace existing ${notes.length} notes with ${importedNotes.length} imported notes?`)) {
                                notes = importedNotes;
                                saveNotesToLocalStorage();
                                renderNotes();
                                updateTagFilterContainer();
                                showMessage(`Successfully imported ${importedNotes.length} notes`);
                            }
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

    // Keyboard shortcuts button
    const keyboardShortcutsBtn = document.getElementById('keyboardShortcutsBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');
    if (keyboardShortcutsBtn && shortcutsModal) {
        keyboardShortcutsBtn.addEventListener('click', () => {
            shortcutsModal.style.display = 'flex';
            headerMenu.classList.remove('show');
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
}

// Note Actions
function openNewNoteModal() {
    if (!noteModal || !modalTitle || !noteForm || !noteTagsContainer || !trixEditorElement) {
        console.error('Required modal elements not found');
        return;
    }

    populateNoteForm();

    openNoteModal();

    // Check for draft
    const draftRestored = checkAndRestoreDraft();
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

    const note = {
        id: noteId || Date.now().toString(),
        title: title || 'Untitled Note',
        content,
        deadline,
        items,
        tags,
        createdAt: noteId ? (notes.find(n => n.id === noteId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        pinned: noteId ? (notes.find(n => n.id === noteId)?.pinned || false) : false
    };

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
    if (!noteId) {
        clearDraft();
    }

    // Close modal
    if (noteModal) {
        noteModal.style.display = 'none';
        noteModal.classList.remove('show');
    }

    // Refresh notes display
    renderNotes(document.getElementById('searchInput')?.value || '');
    updateTagFilterContainer();

    // Show success message
    showMessage('Note saved successfully');
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
        closeInfoTooltips();

        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });

        headerMenu.classList.remove('show');
        setSearchPanelOpen(false);
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
                document.getElementById('darkModeToggle').click();
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
function clearAllNotes() {
    if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
        notes = [];
        
        // Add default welcome notes
        const welcomeNote = {
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
            pinned: true
        };
        
        notes.push(welcomeNote);
        saveNotesToLocalStorage();
        renderNotes();
        updateTagFilterContainer();
        showMessage('All notes have been cleared');
    }
} 
