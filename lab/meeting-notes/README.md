# Meeting Notes

A modern, feature-rich note-taking application for meetings and tasks, with a focus on organization and productivity.

## Features

### Note Management
- Create, edit, and delete notes with a rich text editor
- Pin important notes to the top
- Add deadlines to notes
- Automatic draft saving when creating/editing notes
- Welcome note with getting started tips

### Rich Text Editor
- Full formatting capabilities (bold, italic, lists, etc.)
- Support for nested lists
- Keyboard shortcuts for common formatting actions

### Action Items
- Add action items/todos to any note
- Mark items as complete/incomplete
- Track action item status across notes
- Automatic aggregation in "General Todo" view

### Tags
- Add multiple tags to notes
- Filter notes by tags
- Tag suggestions based on existing tags
- Visual tag management interface

### Search and Filtering
- Full-text search across all notes
- Filter by date (Today, Yesterday, Last Week, Last Month)
- Filter by action item status (All, Active, Completed)
- Filter by tags
- Clear all filters with one click

### Data Management
- Local storage for persistent data
- Export notes to XML
- Import notes from XML
- Clear all notes with one click (preserves welcome note)
- Draft auto-saving to prevent data loss

### User Interface
- Clean, modern design
- Dark mode support
- Responsive layout
- Card-based note display
- Intuitive modal interfaces

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: Create new note
- `Ctrl/Cmd + S`: Save current note
- `Ctrl/Cmd + F`: Focus search
- `Ctrl/Cmd + E`: Toggle dark mode
- `/`: Focus search
- `Esc`: Close modals
- `Ctrl/Cmd + ?`: View keyboard shortcuts

## Getting Started

1. Open the application in your browser
2. Review the welcome note for basic instructions
3. Click the '+' button or press `Ctrl/Cmd + N` to create your first note
4. Try out dark mode with the toggle in the menu
5. Explore keyboard shortcuts with `Ctrl/Cmd + ?`

## Data Storage

All notes are stored locally in your browser using localStorage. To prevent data loss:
- Use the XML export feature to backup your notes
- Drafts are automatically saved when editing
- Import functionality allows restoring from backups

## Tips
- Pin important notes to keep them at the top
- Use tags to organize related notes
- Check the "General Todo" for a summary of all action items
- Use the clear filters button to reset all search and filter options
- Export your notes regularly as backup

## Technical Details

- Built with vanilla JavaScript and HTML
- Uses Trix editor for rich text editing
- No external dependencies except for Trix editor
- Responsive design using CSS Grid and Flexbox
- Local storage for data persistence
- XML-based import/export functionality

## Browser Compatibility

The application works in all modern browsers that support:
- Local Storage
- ES6 JavaScript features
- CSS Grid and Flexbox

## License

This project is open source and available under the MIT License. 