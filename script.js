
let notes = [];
let editingId = null;
let currentFilter = 'all';

// Load notes from memory on page load
function loadNotes() {
    const saved = localStorage.getItem('smartNotes');
    if (saved) {
        notes = JSON.parse(saved);
        displayNotes();
        updateStats();
    }
}

// Save notes to memory
function saveToStorage() {
    localStorage.setItem('smartNotes', JSON.stringify(notes));
}

// Save or update note
function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;

    if (!title || !content) {
        alert('Please fill in both title and content!');
        return;
    }

    if (editingId !== null) {
        // Update existing note
        const note = notes.find(n => n.id === editingId);
        note.title = title;
        note.content = content;
        note.category = category;
        note.updatedAt = new Date().toISOString();
        editingId = null;
        document.getElementById('formTitle').textContent = 'Create New Note';
        document.getElementById('cancelBtn').style.display = 'none';
    } else {
        // Create new note
        const note = {
            id: Date.now(),
            title,
            content,
            category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(note);
    }

    saveToStorage();
    clearForm();
    displayNotes();
    updateStats();
}

// Edit note
function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategory').value = note.category;
        document.getElementById('formTitle').textContent = 'Edit Note';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        editingId = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

//Ai feature
async function aifeature(id) {
    const note = notes.find(n => n.id === id);
    if (!note) {
        alert('Note not found.');
        return;
    }

    try {
        // Optional: simple loading state
        // (You can later improve by disabling the button etc.)
        const response = await fetch('/api/ai-note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: note.content }),
        });

        if (!response.ok) {
            throw new Error('AI request failed');
        }

        const data = await response.json();

        const summary = data.summary || 'No summary.';
        const tags = Array.isArray(data.tags) ? data.tags.join(', ') : '';
        const mood = data.mood || 'unknown';

        alert(
            `Summary:\n${summary}\n\nTags: ${tags}\nMood: ${mood}`
        );

        // Later you can:
        // - Save summary/tags/mood into the note object
        // - Re-render the note card with an "AI Insights" section
    } catch (err) {
        console.error(err);
        alert('Failed to generate AI insights. Please try again.');
    }
}

// Cancel edit
function cancelEdit() {
    editingId = null;
    clearForm();
    document.getElementById('formTitle').textContent = 'Create New Note';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Delete note
function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        saveToStorage();
        displayNotes();
        updateStats();
    }
}

// Clear form
function clearForm() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteCategory').value = 'work';
}

// Display notes
function displayNotes() {
    const container = document.getElementById('notesContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredNotes = notes;

    // Filter by category
    if (currentFilter !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.category === currentFilter);
    }

    // Filter by search term
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n => 
            n.title.toLowerCase().includes(searchTerm) || 
            n.content.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredNotes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📭 No notes found.</p></div>';
        return;
    }

    container.innerHTML = filteredNotes.map(note => {
        const date = new Date(note.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        let displayTitle = note.title;
        let displayContent = note.content;

        // Highlight search terms
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            displayTitle = note.title.replace(regex, '<span class="highlight">$1</span>');
            displayContent = note.content.replace(regex, '<span class="highlight">$1</span>');
        }

        return `
            <div class="note-card">
                <div class="note-header">
                    <div>
                        <div class="note-title">${displayTitle}</div>
                        <span class="note-category category-${note.category}">${note.category}</span>
                    </div>
                </div>
                <div class="note-content">${displayContent}</div>
                <div class="note-meta">
                    <span>📅 ${formattedDate}</span>
                    <div class="note-actions">
                        <button class="icon-btn edit-btn" onclick="aifeature(${note.id})">🤖</button>
                        <button class="icon-btn edit-btn" onclick="editNote(${note.id})">✏️</button>
                        <button class="icon-btn delete-btn" onclick="deleteNote(${note.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const total = notes.length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekNotes = notes.filter(n => new Date(n.createdAt) >= weekAgo).length;
    const categories = new Set(notes.map(n => n.category)).size;

    document.getElementById('totalNotes').textContent = total;
    document.getElementById('weekNotes').textContent = weekNotes;
    document.getElementById('categoryCount').textContent = categories;
}

// Search notes
function searchNotes() {
    displayNotes();
}

// Filter by category
function filterByCategory(category) {
    currentFilter = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayNotes();
}

// Toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const themeBtn = document.querySelector('.theme-toggle');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        themeBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Load theme preference
function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-toggle').textContent = '☀️';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl/Cmd + N to create new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('noteTitle').focus();
    }
});

// Auto-save draft as user types
let draftTimeout;
document.getElementById('noteContent').addEventListener('input', () => {
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        if (title || content) {
            localStorage.setItem('noteDraft', JSON.stringify({ title, content }));
        }
    }, 1000);
});

// Load draft on page load
function loadDraft() {
    const draft = localStorage.getItem('noteDraft');
    if (draft && editingId === null) {
        const { title, content } = JSON.parse(draft);
        if (title || content) {
            const restore = confirm('Found a saved draft. Would you like to restore it?');
            if (restore) {
                document.getElementById('noteTitle').value = title;
                document.getElementById('noteContent').value = content;
            }
            localStorage.removeItem('noteDraft');
        }
    }
}

// Initialize app
loadTheme();
loadNotes();
loadDraft();