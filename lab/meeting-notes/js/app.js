// Constants
const LOCAL_STORAGE_KEY = 'meetingNotes';
const DRAFT_STORAGE_KEY = 'noteDraftData';
const DARK_MODE_KEY = 'darkModeEnabled';

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const addNoteFab = document.getElementById('addNoteFab');
const noteModal = document.getElementById('noteModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitle');
const contentInputArea = document.getElementById('contentInputArea');
const noteContentHiddenInput = document.getElementById('noteContentHidden');
const trixEditorWrapper = document.getElementById('trixEditorWrapper');
const trixEditorElement = document.querySelector("trix-editor");
const actionItemsArea = document.getElementById('actionItemsArea');
const noteActionItemsTextArea = document.getElementById('noteActionItems');
const deadlineGroup = document.getElementById('deadlineGroup');
const noteDeadlineInput = document.getElementById('noteDeadline');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const searchInput = document.getElementById('searchInput');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const headerMenu = document.getElementById('headerMenu');
const exportXmlBtn = document.getElementById('exportXmlBtn');
const importXmlBtn = document.getElementById('importXmlBtn');
const importXmlInput = document.getElementById('importXmlInput');

// Global variables
let notes = [];
let selectedTags = new Set();
let dateFilter = 'all';
let statusFilter = 'all';
let currentlyEditingNote = null;

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
        const tagElements = document.getElementById('noteTags').getElementsByClassName('tag');
        const tags = Array.from(tagElements).map(tag => tag.textContent.trim().replace(/×$/, '').trim());
        
        const draftData = {
            title: noteTitleInput.value,
            content: trixEditorElement.value,
            itemsText: noteActionItemsTextArea.value,
            deadline: noteDeadlineInput.value,
            tags: tags
        };
        
        try {
            if (draftData.title.trim() || draftData.content.trim() || draftData.itemsText.trim() || draftData.tags.length > 0) {
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
                if (draftData.content) {
                    trixEditorElement.value = draftData.content;
                } else {
                    trixEditorElement.value = '';
                }
                
                noteActionItemsTextArea.value = draftData.itemsText || '';
                
                // Restore tags
                const tagsContainer = document.getElementById('noteTags');
                if (tagsContainer && draftData.tags) {
                    tagsContainer.innerHTML = '';
                    draftData.tags.forEach(tag => {
                        const tagElement = createTagElement(tag, true);
                        tagsContainer.appendChild(tagElement);
                    });
                }
                
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
            headerMenu.classList.toggle('show');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggleBtn.contains(e.target) && !headerMenu.contains(e.target)) {
                headerMenu.classList.remove('show');
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
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('modalTitle');
    const noteForm = document.getElementById('noteForm');
    const noteTags = document.getElementById('noteTags');
    const trixEditor = document.querySelector('trix-editor');

    if (!modal || !modalTitle || !noteForm || !noteTags || !trixEditor) {
        console.error('Required modal elements not found');
        return;
    }

    // Reset form and clear fields
    modalTitle.textContent = 'New Note';
    noteForm.reset();
    noteTags.innerHTML = '';
    trixEditor.editor.loadHTML('');
    currentlyEditingNote = null;

    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    noteTitleInput.focus();

    // Check for draft
    checkAndRestoreDraft();
}

function saveNote() {
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.querySelector('trix-editor').value;
    const deadline = document.getElementById('noteDeadline').value;
    const actionItems = document.getElementById('noteActionItems').value;
    const tagElements = document.getElementById('noteTags').getElementsByClassName('tag');
    const tags = Array.from(tagElements).map(tag => tag.textContent.trim());

    // Parse action items
    const items = actionItems.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => ({
            text: item,
            completed: false
        }));

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
    localStorage.removeItem('noteDraft');

    // Close modal
    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    // Refresh notes display
    renderNotes(document.getElementById('searchInput')?.value || '');

    // Show success message
    showMessage('Note saved successfully');
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
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
                document.getElementById('searchInput').focus();
                break;
            case 'e':
                e.preventDefault();
                document.getElementById('darkModeToggle').click();
                break;
        }
    } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    } else if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
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