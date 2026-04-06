function getCurrentSearchTerm() {
    return document.getElementById('searchInput')?.value || '';
}

function getDeadlineSortValue(note, emptyValue) {
    if (!note.deadline) return emptyValue;

    const deadlineValue = new Date(note.deadline).getTime();
    return Number.isNaN(deadlineValue) ? emptyValue : deadlineValue;
}

function compareNotesForDisplay(a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    switch (appSettings?.sortMode) {
        case 'created-asc':
            return new Date(a.createdAt) - new Date(b.createdAt);
        case 'deadline-asc':
            return getDeadlineSortValue(a, Number.POSITIVE_INFINITY) - getDeadlineSortValue(b, Number.POSITIVE_INFINITY);
        case 'deadline-desc':
            return getDeadlineSortValue(b, Number.NEGATIVE_INFINITY) - getDeadlineSortValue(a, Number.NEGATIVE_INFINITY);
        case 'created-desc':
        default:
            return new Date(b.createdAt) - new Date(a.createdAt);
    }
}

function buildGeneralTodoItems() {
    return notes.reduce((items, note) => {
        if (note.archived || !Array.isArray(note.items) || note.items.length === 0) {
            return items;
        }

        note.items.forEach((item, itemIndex) => {
            if (!appSettings?.showCompletedGeneralTodo && item.completed) {
                return;
            }

            items.push({
                ...item,
                sourceNote: note.title,
                sourceNoteId: note.id,
                sourceItemIndex: itemIndex
            });
        });

        return items;
    }, []);
}

function updateActionItemCompletion(note, itemIndex, isCompleted, item = null) {
    if (note.isVirtual) {
        const originalNote = notes.find(candidate => candidate.id === item?.sourceNoteId);
        if (!originalNote?.items?.[item?.sourceItemIndex]) return;
        originalNote.items[item.sourceItemIndex].completed = isCompleted;
    } else {
        const noteIndex = notes.findIndex(candidate => candidate.id === note.id);
        if (noteIndex === -1 || !notes[noteIndex].items?.[itemIndex]) return;
        notes[noteIndex].items[itemIndex].completed = isCompleted;
    }

    saveNotesToLocalStorage();
    renderNotes(getCurrentSearchTerm());
}

// Note Rendering Functions
function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notesGrid');
    if (!notesGrid) {
        console.error('Notes grid element not found');
        return;
    }

    notesGrid.innerHTML = '';

    const allActionItems = buildGeneralTodoItems();
    const shouldShowVirtualNote = Boolean(appSettings?.showGeneralTodo) && (statusFilter === 'all' || !statusFilter);

    if (allActionItems.length > 0 && shouldShowVirtualNote) {
        const virtualNote = {
            id: 'general-todo',
            title: 'General Todo',
            content: 'Aggregated action items from all active notes',
            items: allActionItems,
            createdAt: new Date().toISOString(),
            pinned: true,
            isVirtual: true
        };

        const virtualCard = createNoteCard(virtualNote);
        if (virtualCard) {
            notesGrid.appendChild(virtualCard);
        }
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    let filteredNotes = notes.filter(note => {
        if (note.id === 'general-todo') return false;
        if (!appSettings?.showArchived && note.archived) return false;

        const matchesSearch = !normalizedSearchTerm ||
            note.title.toLowerCase().includes(normalizedSearchTerm) ||
            note.content.toLowerCase().includes(normalizedSearchTerm) ||
            note.deadline.toLowerCase().includes(normalizedSearchTerm) ||
            note.items.some(item => item.text.toLowerCase().includes(normalizedSearchTerm)) ||
            note.tags.some(tag => tag.toLowerCase().includes(normalizedSearchTerm));

        const matchesDateFilter = dateFilter === 'all' || filterNoteByDate(note, dateFilter);

        let matchesStatusFilter = true;
        if (statusFilter !== 'all') {
            if (!note.items || note.items.length === 0) {
                matchesStatusFilter = false;
            } else {
                const hasUncompletedItems = note.items.some(item => !item.completed);
                const allItemsCompleted = note.items.every(item => item.completed);

                switch (statusFilter) {
                    case 'active':
                        matchesStatusFilter = hasUncompletedItems;
                        break;
                    case 'completed':
                        matchesStatusFilter = allItemsCompleted;
                        break;
                    default:
                        matchesStatusFilter = true;
                }
            }
        }

        const matchesTags = selectedTags.size === 0 ||
            Array.from(selectedTags).every(tag => note.tags.includes(tag));

        return matchesSearch && matchesDateFilter && matchesStatusFilter && matchesTags;
    });

    filteredNotes.sort(compareNotesForDisplay);

    filteredNotes.forEach(note => {
        const card = createNoteCard(note);
        if (card) {
            notesGrid.appendChild(card);
        }
    });

    if (filteredNotes.length === 0 && !document.querySelector('.note-card')) {
        const noNotesMessage = document.createElement('div');
        noNotesMessage.className = 'no-notes-message';
        noNotesMessage.textContent = searchTerm ?
            'No notes found matching your search.' :
            statusFilter !== 'all' ?
                `No notes found with ${statusFilter} action items.` :
                'No notes yet. Click the + button to create one!';
        notesGrid.appendChild(noNotesMessage);
    }
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    if (note.pinned) card.classList.add('pinned');
    if (note.archived) card.classList.add('archived');
    if (note.isVirtual) card.classList.add('virtual-note');
    card.dataset.noteId = note.id;

    if (!note.isVirtual) {
        card.classList.add('note-card-editable');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Edit note: ${note.title}`);

        const openEditorFromCard = (event) => {
            if (event.target.closest('button, input, a, .tag, .filter-tag')) return;
            openEditNoteModal(note);
        };

        card.addEventListener('click', openEditorFromCard);
        card.addEventListener('keydown', (event) => {
            if (event.target !== card) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openEditNoteModal(note);
        });
    }

    const header = document.createElement('div');
    header.className = 'note-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'note-card-title-row';

    const title = document.createElement('h3');
    title.className = 'note-title';
    title.textContent = note.title;
    titleRow.appendChild(title);

    if (note.archived) {
        const archivedBadge = document.createElement('span');
        archivedBadge.className = 'note-state-pill';
        archivedBadge.textContent = 'Archived';
        titleRow.appendChild(archivedBadge);
    }

    header.appendChild(titleRow);
    card.appendChild(header);

    if (!note.isVirtual && note.content) {
        const content = document.createElement('div');
        content.className = 'note-content';
        content.innerHTML = note.content;
        card.appendChild(content);
    }

    if (!note.isVirtual && note.deadline) {
        const deadline = document.createElement('div');
        deadline.className = 'note-deadline';
        deadline.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 15H5V10h14Zm0-11H5V6h14Z"></path>
        </svg> Deadline: ${new Date(note.deadline).toLocaleDateString()}`;
        card.appendChild(deadline);
    }

    if (note.items && note.items.length > 0) {
        const itemsList = document.createElement('ul');
        itemsList.className = 'action-items';

        note.items.forEach((item, itemIndex) => {
            const li = document.createElement('li');
            if (item.completed) li.classList.add('completed');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.completed;
            checkbox.addEventListener('click', event => event.stopPropagation());
            checkbox.addEventListener('change', event => {
                updateActionItemCompletion(note, itemIndex, event.target.checked, item);
            });

            const text = document.createElement('span');
            text.className = 'item-text';
            text.textContent = item.text;

            if (note.isVirtual && item.sourceNote) {
                const source = document.createElement('span');
                source.className = 'item-source';
                source.textContent = ` (${item.sourceNote})`;
                text.appendChild(source);
            }

            li.appendChild(checkbox);
            li.appendChild(text);
            itemsList.appendChild(li);
        });

        card.appendChild(itemsList);
    }

    if (!note.isVirtual) {
        if (note.tags && note.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'note-tags';

            note.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.onclick = event => {
                    event.stopPropagation();
                    selectedTags.add(tag);
                    renderNotes(getCurrentSearchTerm());
                    updateTagFilterContainer();
                };
                tagsContainer.appendChild(tagElement);
            });

            card.appendChild(tagsContainer);
        }

        const footer = document.createElement('div');
        footer.className = 'note-footer';

        const creationDate = document.createElement('div');
        creationDate.className = 'note-date';
        const createdDate = new Date(note.createdAt);
        const formattedDate = createdDate.toLocaleDateString();
        const formattedTime = createdDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        creationDate.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"></path>
        </svg> ${formattedDate} ${formattedTime}`;
        footer.appendChild(creationDate);

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const pinBtn = document.createElement('button');
        pinBtn.className = 'pin-btn';
        if (note.pinned) pinBtn.classList.add('pinned');
        pinBtn.title = note.pinned ? 'Unpin note' : 'Pin note';
        pinBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="${note.pinned ?
                'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z' :
                'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z'}"></path>
        </svg>`;
        pinBtn.onclick = event => {
            event.stopPropagation();
            togglePinNote(note.id);
        };
        actions.appendChild(pinBtn);

        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'archive-btn';
        if (note.archived) archiveBtn.classList.add('active');
        archiveBtn.title = note.archived ? 'Restore note' : 'Archive note';
        archiveBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M20.54 5.23 19.15 3.55A2 2 0 0 0 17.62 3H6.38a2 2 0 0 0-1.53.55L3.46 5.23A2 2 0 0 0 3 6.5V8a2 2 0 0 0 2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27ZM6.24 5h11.52l.81 1H5.43ZM17 18H7v-8h10Zm-6-5h2v2h-2Z"></path>
        </svg>`;
        archiveBtn.onclick = event => {
            event.stopPropagation();
            toggleArchiveNote(note.id);
        };
        actions.appendChild(archiveBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete note';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path></svg>';
        deleteBtn.onclick = event => {
            event.stopPropagation();
            deleteNote(note.id);
        };
        actions.appendChild(deleteBtn);

        footer.appendChild(actions);
        card.appendChild(footer);
    }

    return card;
}

function togglePinNote(noteId) {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return;

    notes[noteIndex].pinned = !notes[noteIndex].pinned;
    saveNotesToLocalStorage();
    renderNotes(getCurrentSearchTerm());
}

function toggleArchiveNote(noteId) {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return;

    notes[noteIndex].archived = !notes[noteIndex].archived;
    saveNotesToLocalStorage();
    updateTagFilterContainer();
    renderNotes(getCurrentSearchTerm());
    showMessage(notes[noteIndex].archived ? 'Note archived' : 'Note restored');
}

function filterNoteByDate(note, filter) {
    const noteDate = new Date(note.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    noteDate.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'today':
            return noteDate.getTime() === today.getTime();
        case 'yesterday':
            return noteDate.getTime() === yesterday.getTime();
        case 'last-week':
            return noteDate >= lastWeek;
        case 'last-month':
            return noteDate >= lastMonth;
        default:
            return true;
    }
}

async function deleteNote(noteId) {
    const note = notes.find(entry => entry.id === noteId);
    if (!note) return;

    const shouldDelete = await showConfirmDialog({
        title: 'Delete note?',
        message: `Delete "${note.title}"? This cannot be undone.`,
        confirmLabel: 'Delete note',
        cancelLabel: 'Cancel',
        tone: 'danger'
    });

    if (!shouldDelete) return;

    notes = notes.filter(entry => entry.id !== noteId);
    saveNotesToLocalStorage();
    updateTagFilterContainer();
    renderNotes(getCurrentSearchTerm());
    showMessage('Note deleted');
}

function openEditNoteModal(note) {
    if (typeof openExistingNoteModal === 'function') {
        openExistingNoteModal(note);
    }
}
