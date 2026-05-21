// Note Rendering Functions
function renderNotes(searchTerm = '') {
    const notesGrid = document.getElementById('notesGrid');
    if (!notesGrid) {
        console.error('Notes grid element not found');
        return;
    }

    // Clear the grid
    notesGrid.innerHTML = '';
    
    // Create the virtual "General Todo" note that aggregates all action items
    const allActionItems = notes.reduce((items, note) => {
        if (note.items && note.items.length > 0) {
            items.push(...note.items.map(item => ({
                ...item,
                sourceNote: note.title
            })));
        }
        return items;
    }, []);

    // Only show virtual note if we're not filtering by status or if we're showing all
    const shouldShowVirtualNote = statusFilter === 'all' || !statusFilter;
    
    if (allActionItems.length > 0 && shouldShowVirtualNote) {
        const virtualNote = {
            id: 'general-todo',
            title: 'General Todo',
            content: 'Aggregated action items from all notes',
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

    // Filter and sort the actual notes
    let filteredNotes = notes.filter(note => {
        // Skip the virtual note if it exists
        if (note.id === 'general-todo') return false;

        const matchesSearch = !searchTerm || 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.items.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesDateFilter = dateFilter === 'all' || filterNoteByDate(note, dateFilter);

        // Status filter logic
        let matchesStatusFilter = true;
        if (statusFilter !== 'all') {
            // Only consider notes that have action items
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
                }
            }
        }
        
        const matchesTags = selectedTags.size === 0 || 
            (note.tags && Array.from(selectedTags).every(tag => note.tags.includes(tag)));

        return matchesSearch && matchesDateFilter && matchesStatusFilter && matchesTags;
    });

    // Sort notes: pinned first, then by creation date
    filteredNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Render filtered notes
    filteredNotes.forEach(note => {
        const card = createNoteCard(note);
        if (card) {
            notesGrid.appendChild(card);
        }
    });

    // Show message if no notes found
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
    if (note.isVirtual) card.classList.add('virtual-note');
    card.dataset.noteId = note.id;

    // Title
    const title = document.createElement('h3');
    title.className = 'note-title';
    title.textContent = note.title;
    card.appendChild(title);

    // Content (not shown for virtual note)
    if (!note.isVirtual && note.content) {
        const content = document.createElement('div');
        content.className = 'note-content';
        content.innerHTML = note.content;
        card.appendChild(content);
    }

    // Action items
    if (note.items && note.items.length > 0) {
        const itemsList = document.createElement('ul');
        itemsList.className = 'action-items';
        note.items.forEach((item, itemIndex) => {
            const li = document.createElement('li');
            if (item.completed) li.classList.add('completed');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.completed;
            checkbox.onchange = (e) => {
                const isCompleted = e.target.checked;
                
                if (note.isVirtual) {
                    // Find the original note and update its item
                    const originalNote = notes.find(n => n.title === item.sourceNote);
                    if (originalNote) {
                        const originalItem = originalNote.items.find(i => i.text === item.text);
                        if (originalItem) {
                            // Update the completed status in the original note's data
                            originalItem.completed = isCompleted;
                            
                            // Update the original note's checkbox and styling
                            const originalNoteCard = document.querySelector(`.note-card[data-note-id="${originalNote.id}"]`);
                            if (originalNoteCard) {
                                const originalCheckboxes = originalNoteCard.querySelectorAll('input[type="checkbox"]');
                                originalCheckboxes.forEach(cb => {
                                    const itemText = cb.parentElement.querySelector('.item-text').textContent;
                                    if (itemText === item.text) {
                                        cb.checked = isCompleted;
                                        cb.closest('li').classList.toggle('completed', isCompleted);
                                    }
                                });
                            }
                            
                            // Update the virtual item's styling
                            li.classList.toggle('completed', isCompleted);
                            
                            // Save changes to localStorage
                            saveNotesToLocalStorage();
                            
                            // Update the item in the virtual note's data
                            item.completed = isCompleted;
                        }
                    }
                } else {
                    // Update the original note's item
                    item.completed = isCompleted;
                    
                    // Update the virtual note's checkbox and styling
                    const virtualNoteCard = document.querySelector('.virtual-note');
                    if (virtualNoteCard) {
                        const virtualItems = virtualNoteCard.querySelectorAll('.action-items li');
                        virtualItems.forEach(virtualLi => {
                            const virtualItemText = virtualLi.querySelector('.item-text').textContent.split(' (')[0];
                            const virtualSourceText = virtualLi.querySelector('.item-source')?.textContent || '';
                            if (virtualItemText === item.text && virtualSourceText.includes(note.title)) {
                                const virtualCheckbox = virtualLi.querySelector('input[type="checkbox"]');
                                virtualCheckbox.checked = isCompleted;
                                virtualLi.classList.toggle('completed', isCompleted);
                            }
                        });
                    }
                    
                    // Update the original item's styling
                    li.classList.toggle('completed', isCompleted);
                    
                    // Save changes to localStorage
                    saveNotesToLocalStorage();
                }
            };
            
            // Add a data attribute to help identify the item
            checkbox.dataset.itemText = item.text;
            
            const text = document.createElement('span');
            text.className = 'item-text';
            text.textContent = item.text;
            
            // For virtual note, add source note reference
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

    // Only add tags, date, and action buttons for non-virtual notes
    if (!note.isVirtual) {
        // Tags
        if (note.tags && note.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'note-tags';
            note.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.onclick = () => {
                    selectedTags.add(tag);
                    renderNotes(document.getElementById('searchInput')?.value || '');
                    updateTagFilterContainer();
                };
                tagsContainer.appendChild(tagElement);
            });
            card.appendChild(tagsContainer);
        }

        // Creation date
        const creationDate = document.createElement('div');
        creationDate.className = 'note-date';
        const date = new Date(note.createdAt);
        creationDate.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg> Created: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        card.appendChild(creationDate);

        // Actions at the bottom
        const actions = document.createElement('div');
        actions.className = 'note-actions';

        // Pin button
        const pinBtn = document.createElement('button');
        pinBtn.className = 'pin-btn';
        if (note.pinned) pinBtn.classList.add('pinned');
        pinBtn.title = note.pinned ? 'Unpin note' : 'Pin note';
        pinBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="${note.pinned ? 
                'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z' : 
                'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z'}"/>
        </svg>`;
        pinBtn.onclick = () => togglePinNote(note.id);
        actions.appendChild(pinBtn);

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.title = 'Edit note';
        editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>';
        editBtn.onclick = () => openEditNoteModal(note);
        actions.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete note';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';
        deleteBtn.onclick = () => deleteNote(note.id);
        actions.appendChild(deleteBtn);

        card.appendChild(actions);
    }

    return card;
}

function togglePinNote(noteId) {
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex !== -1) {
        notes[noteIndex].pinned = !notes[noteIndex].pinned;
        saveNotesToLocalStorage(); // Use the app.js function instead of direct localStorage access
        renderNotes(document.getElementById('searchInput')?.value || '');
    }
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

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== noteId);
        saveNotesToLocalStorage(); // Use the app.js function instead of direct localStorage access
        renderNotes(document.getElementById('searchInput')?.value || '');
        updateTagFilterContainer();
    }
}

function openEditNoteModal(note) {
    const modal = document.getElementById('noteModal');
    const modalTitle = document.getElementById('modalTitle');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('contentInputArea');
    const actionItemsInput = document.getElementById('noteActionItems');
    const deadlineInput = document.getElementById('noteDeadline');
    const tagsContainer = document.getElementById('noteTags');

    if (modal && modalTitle && titleInput && contentInput && actionItemsInput && deadlineInput && tagsContainer) {
        modalTitle.textContent = 'Edit Note';
        titleInput.value = note.title;
        contentInput.value = note.content || '';
        actionItemsInput.value = note.items.map(item => item.text).join('\n');
        deadlineInput.value = note.deadline || '';
        
        // Clear and repopulate tags
        tagsContainer.innerHTML = '';
        note.tags.forEach(tag => {
            const tagElement = createTagElement(tag, true);
            tagsContainer.appendChild(tagElement);
        });

        currentlyEditingNote = note;
        modal.classList.add('show');
    }
}

function createInteractiveList(itemsArray, noteIndex, itemArrayKey) {
    const list = document.createElement('ul');
    list.classList.add('interactive-list');
    
    itemsArray.forEach((item, itemIndex) => {
        const li = document.createElement('li');
        li.classList.add('interactive-list-item');
        if (item.done) {
            li.classList.add('done');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.classList.add('list-item-checkbox');
        checkbox.dataset.itemIndex = itemIndex;
        checkbox.dataset.noteIndex = noteIndex;
        checkbox.dataset.arrayKey = itemArrayKey;
        checkbox.addEventListener('change', handleCheckboxChange);

        const textSpan = document.createElement('span');
        textSpan.classList.add('list-item-text');
        textSpan.textContent = item.text;

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        list.appendChild(li);
    });
    
    return list;
}

function createPinButton(note, originalIndex) {
    const pinBtn = document.createElement('button');
    pinBtn.classList.add('pin-btn');
    const isGeneralTodo = note.title === "General Todo";
    pinBtn.title = isGeneralTodo ? "Cannot unpin General Todo" : (note.pinned ? "Unpin Note" : "Pin Note");
    pinBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin" viewBox="0 0 16 16"><path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224.5-.5.5s-.5-.224-.5-.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.92 5.92 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354zm1.58 1.408-.002-.001.002.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447l-.078.048a.5.5 0 0 1-.544.037L5 7.5l-.002-.001A.5.5 0 0 1 5 7V2a.5.5 0 0 1 .024-.158.5.5 0 0 1 .1-.1.5.5 0 0 1 .196-.12l.004-.002h-.001zm4.34 0 .001-.001-.001.001zm.001-.001-.001.001a.5.5 0 0 1-.196.12l-.004.002a.5.5 0 0 1-.1.1.5.5 0 0 1-.024.158v5a.5.5 0 0 1-.5.5l-.002.001a.5.5 0 0 1-.544-.037l-.078-.048A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .146-.354l.004-.004Z"></path></svg>`;
    
    if(note.pinned) pinBtn.classList.add('active');
    if(isGeneralTodo) {
        pinBtn.classList.add('general-todo-pin');
        pinBtn.style.opacity = '0.5';
        pinBtn.style.cursor = 'not-allowed';
    }
    
    pinBtn.onclick = (e) => {
        e.stopPropagation();
        if (!isGeneralTodo) {
            togglePinNote(originalIndex);
        }
    };
    
    return pinBtn;
}

function createEditButton(originalIndex) {
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.title = "Edit Note";
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openModalForEdit(originalIndex);
    };
    return editBtn;
}

function createDeleteButton(originalIndex) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.title = "Delete Note";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteNote(originalIndex);
    };
    return deleteBtn;
}

// Add CSS for the creation date
const style = document.createElement('style');
style.textContent = `
    .note-date {
        font-size: 0.85rem;
        color: #666;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dark-mode .note-date {
        color: #aaa;
    }
    .note-date svg {
        color: #007bff;
    }
`;
document.head.appendChild(style); 