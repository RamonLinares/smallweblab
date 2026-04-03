// Tag Management
function createTagElement(tagText, isEditable = true) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    // Remove any existing '×' character from the tag text
    tagText = tagText.trim().replace(/×$/, '').trim();
    
    if (isEditable) {
        tagElement.innerHTML = `${tagText}<span class="tag-remove">×</span>`;
        const removeBtn = tagElement.querySelector('.tag-remove');
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            tagElement.remove();
        };
    } else {
        tagElement.textContent = tagText;
    }
    
    return tagElement;
}

function initializeTagInput() {
    const tagInput = document.getElementById('tagInput');
    const noteTags = document.getElementById('noteTags');
    const addTagButton = document.getElementById('addTagButton');

    if (!tagInput || !noteTags) return;

    // Hide the add button since we'll add tags on comma or enter
    if (addTagButton) {
        addTagButton.style.display = 'none';
    }

    function addTag(tagText) {
        tagText = tagText.trim();
        if (!tagText) return;

        // Split by commas and handle each tag
        const tags = tagText.split(',').map(t => t.trim()).filter(t => t);
        
        tags.forEach(tag => {
            // Clean the tag text by removing any '×' character
            tag = tag.replace(/×$/, '').trim();
            
            // Check if tag already exists
            const existingTags = Array.from(noteTags.children)
                .map(tagEl => tagEl.textContent.replace(/×$/, '').trim());
            
            if (!existingTags.includes(tag)) {
                const tagElement = createTagElement(tag, true);
                noteTags.appendChild(tagElement);
            }
        });

        // Clear input after adding
        tagInput.value = '';
    }

    // Handle input events
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput.value);
        } else if (e.key === 'Backspace' && tagInput.value === '') {
            // Remove last tag when backspace is pressed on empty input
            const tags = noteTags.getElementsByClassName('tag');
            if (tags.length > 0) {
                tags[tags.length - 1].remove();
            }
        }
    });

    // Handle paste events
    tagInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        addTag(pastedText);
    });

    // Handle blur event to add any remaining text as tag
    tagInput.addEventListener('blur', () => {
        if (tagInput.value.trim()) {
            addTag(tagInput.value);
        }
    });
}

// Update tag filter container
function updateTagFilterContainer() {
    const container = document.getElementById('tagFilterContainer');
    if (!container) return;

    // Get all unique tags from notes
    const allTags = new Set();
    notes.forEach(note => {
        if (note.tags) {
            note.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Clear container
    container.innerHTML = '';

    // Add tag filters
    Array.from(allTags).sort().forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'filter-tag';
        if (selectedTags.has(tag)) {
            tagElement.classList.add('selected');
        }
        tagElement.textContent = tag;
        
        tagElement.addEventListener('click', () => {
            tagElement.classList.toggle('selected');
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
            } else {
                selectedTags.add(tag);
            }
            renderNotes(document.getElementById('searchInput')?.value || '');
        });
        
        container.appendChild(tagElement);
    });
}

// Initialize tags when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTagInput();
    updateTagFilterContainer();
}); 