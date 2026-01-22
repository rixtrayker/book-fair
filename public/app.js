const API_BASE = '/api';

// State management
let currentView = 'publishers';
let publishers = [];
let books = [];
let halls = [];
let columns = [];

// Debounce function for search
let searchTimeout = null;

// DOM elements
const loading = document.getElementById('loading');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadPublishers();
    loadBooks();
    loadFilterOptions();
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            switchView(view);
        });
    });

    // Publisher buttons
    document.getElementById('add-publisher-btn').addEventListener('click', () => openPublisherModal());
    document.getElementById('publisher-form').addEventListener('submit', (e) => {
        e.preventDefault();
        savePublisher();
    });
    document.getElementById('cancel-publisher-btn').addEventListener('click', closePublisherModal);

    // Book buttons
    document.getElementById('add-book-btn').addEventListener('click', () => openBookModal());
    document.getElementById('book-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBook();
    });
    document.getElementById('cancel-book-btn').addEventListener('click', closeBookModal);

    // Close modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.dataset.modal;
            if (modal === 'publisher') closePublisherModal();
            if (modal === 'book') closeBookModal();
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closePublisherModal();
            closeBookModal();
        }
    });

    // Filters - Publishers
    document.getElementById('publisher-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadPublishers();
        }, 300);
    });

    document.getElementById('hall-filter').addEventListener('change', () => {
        loadColumnOptions();
        loadPublishers();
    });

    document.getElementById('column-filter').addEventListener('change', () => {
        loadPublishers();
    });

    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        document.getElementById('publisher-search').value = '';
        document.getElementById('hall-filter').value = '';
        document.getElementById('column-filter').value = '';
        loadColumnOptions();
        loadPublishers();
    });

    // Filters - Books
    document.getElementById('book-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadBooks();
        }, 300);
    });

    document.getElementById('purchased-filter').addEventListener('change', () => {
        loadBooks();
    });

    document.getElementById('clear-book-filters-btn').addEventListener('click', () => {
        document.getElementById('book-search').value = '';
        document.getElementById('purchased-filter').value = '';
        loadBooks();
    });
}

// View Management
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}-view`);
    });

    // Load data for the view
    if (view === 'visits') {
        loadVisits();
    }
}

// API Calls
async function apiCall(endpoint, options = {}) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }

        return data;
    } catch (error) {
        showError(error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

// Publishers Management
async function loadPublishers() {
    try {
        const search = document.getElementById('publisher-search').value;
        const hall = document.getElementById('hall-filter').value;
        const column = document.getElementById('column-filter').value;

        let endpoint = '/publishers?';
        if (search) endpoint += `search=${encodeURIComponent(search)}&`;
        if (hall) endpoint += `hall_number=${encodeURIComponent(hall)}&`;
        if (column) endpoint += `column_number=${encodeURIComponent(column)}&`;

        const data = await apiCall(endpoint);
        publishers = data.publishers;
        renderPublishers();
    } catch (error) {
        console.error('Failed to load publishers:', error);
    }
}

function renderPublishers() {
    const tbody = document.getElementById('publishers-table').querySelector('tbody');

    if (publishers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No publishers found</p></td></tr>';
        return;
    }

    tbody.innerHTML = publishers.map(pub => `
        <tr>
            <td><strong>${escapeHtml(pub.name)}</strong></td>
            <td>${escapeHtml(pub.hall_number)}</td>
            <td>${escapeHtml(pub.column_number)}</td>
            <td>${escapeHtml(pub.contact_info || '-')}</td>
            <td>${escapeHtml(pub.notes || '-')}</td>
            <td>
                <span class="status-badge ${pub.visited ? 'status-visited' : 'status-not-visited'}">
                    ${pub.visited ? 'Visited' : 'Not Visited'}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-warning" onclick="openPublisherModal(${pub.id})">Edit</button>
                    <button class="btn ${pub.visited ? 'btn-secondary' : 'btn-success'}"
                            onclick="toggleVisit(${pub.id}, ${!pub.visited})">
                        ${pub.visited ? 'Unmark' : 'Mark Visited'}
                    </button>
                    <button class="btn btn-danger" onclick="deletePublisher(${pub.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openPublisherModal(publisherId = null) {
    const modalTitle = document.getElementById('publisher-modal-title');
    const form = document.getElementById('publisher-form');
    form.reset();

    if (publisherId) {
        const pub = publishers.find(p => p.id === publisherId);
        if (pub) {
            modalTitle.textContent = 'Edit Publisher';
            document.getElementById('publisher-id').value = pub.id;
            document.getElementById('publisher-name').value = pub.name;
            document.getElementById('publisher-hall').value = pub.hall_number;
            document.getElementById('publisher-column').value = pub.column_number;
            document.getElementById('publisher-contact').value = pub.contact_info || '';
            document.getElementById('publisher-notes').value = pub.notes || '';
        }
    } else {
        modalTitle.textContent = 'Add Publisher';
        document.getElementById('publisher-id').value = '';
    }

    document.getElementById('publisher-modal').classList.add('active');
}

function closePublisherModal() {
    document.getElementById('publisher-modal').classList.remove('active');
}

async function savePublisher() {
    const id = document.getElementById('publisher-id').value;
    const name = document.getElementById('publisher-name').value;
    const hall_number = document.getElementById('publisher-hall').value;
    const column_number = document.getElementById('publisher-column').value;
    const contact_info = document.getElementById('publisher-contact').value;
    const notes = document.getElementById('publisher-notes').value;

    const publisherData = { name, hall_number, column_number, contact_info, notes };

    try {
        if (id) {
            await apiCall(`/publishers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(publisherData)
            });
            showSuccess('Publisher updated successfully');
        } else {
            await apiCall('/publishers', {
                method: 'POST',
                body: JSON.stringify(publisherData)
            });
            showSuccess('Publisher added successfully');
        }

        closePublisherModal();
        await loadPublishers();
        await loadFilterOptions();
    } catch (error) {
        console.error('Failed to save publisher:', error);
    }
}

async function toggleVisit(publisherId, visited) {
    try {
        await apiCall(`/publishers/${publisherId}/visit`, {
            method: 'PATCH',
            body: JSON.stringify({ visited })
        });
        showSuccess(visited ? 'Publisher marked as visited' : 'Visit status removed');
        await loadPublishers();
        if (currentView === 'visits') {
            await loadVisits();
        }
    } catch (error) {
        console.error('Failed to update visit status:', error);
    }
}

async function deletePublisher(publisherId) {
    if (!confirm('Are you sure you want to delete this publisher?')) {
        return;
    }

    try {
        await apiCall(`/publishers/${publisherId}`, {
            method: 'DELETE'
        });
        showSuccess('Publisher deleted successfully');
        await loadPublishers();
        await loadFilterOptions();
    } catch (error) {
        console.error('Failed to delete publisher:', error);
    }
}

// Filter Options
async function loadFilterOptions() {
    try {
        const hallsData = await apiCall('/publishers/filters/halls');
        halls = hallsData.halls;

        const hallFilter = document.getElementById('hall-filter');
        hallFilter.innerHTML = '<option value="">All Halls</option>' +
            halls.map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`).join('');

        await loadColumnOptions();
    } catch (error) {
        console.error('Failed to load filter options:', error);
    }
}

async function loadColumnOptions() {
    try {
        const hall = document.getElementById('hall-filter').value;
        let endpoint = '/publishers/filters/columns';
        if (hall) endpoint += `?hall_number=${encodeURIComponent(hall)}`;

        const columnsData = await apiCall(endpoint);
        columns = columnsData.columns;

        const columnFilter = document.getElementById('column-filter');
        columnFilter.innerHTML = '<option value="">All Columns</option>' +
            columns.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    } catch (error) {
        console.error('Failed to load column options:', error);
    }
}

// Books Management
async function loadBooks() {
    try {
        const search = document.getElementById('book-search').value;
        const purchased = document.getElementById('purchased-filter').value;

        let endpoint = '/books?';
        if (search) endpoint += `search=${encodeURIComponent(search)}&`;
        if (purchased) endpoint += `purchased=${purchased}&`;

        const data = await apiCall(endpoint);
        books = data.books;
        renderBooks();
    } catch (error) {
        console.error('Failed to load books:', error);
    }
}

function renderBooks() {
    const tbody = document.getElementById('books-table').querySelector('tbody');

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No books found</p></td></tr>';
        return;
    }

    tbody.innerHTML = books.map(book => `
        <tr>
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td>${book.publisher_name ? escapeHtml(book.publisher_name) + ' (Hall ' + escapeHtml(book.hall_number) + ', Col ' + escapeHtml(book.column_number) + ')' : '-'}</td>
            <td>${book.price ? '$' + book.price.toFixed(2) : '-'}</td>
            <td>${escapeHtml(book.notes || '-')}</td>
            <td>
                <span class="status-badge ${book.purchased ? 'status-purchased' : 'status-wishlist'}">
                    ${book.purchased ? 'Purchased' : 'Wishlist'}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-warning" onclick="openBookModal(${book.id})">Edit</button>
                    <button class="btn ${book.purchased ? 'btn-secondary' : 'btn-success'}"
                            onclick="togglePurchase(${book.id}, ${!book.purchased})">
                        ${book.purchased ? 'Unpurchase' : 'Mark Purchased'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteBook(${book.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function openBookModal(bookId = null) {
    // Load publishers for dropdown
    await loadPublishersForDropdown();

    const modalTitle = document.getElementById('book-modal-title');
    const form = document.getElementById('book-form');
    form.reset();

    if (bookId) {
        const book = books.find(b => b.id === bookId);
        if (book) {
            modalTitle.textContent = 'Edit Book';
            document.getElementById('book-id').value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-isbn').value = book.isbn || '';
            document.getElementById('book-publisher').value = book.publisher_id || '';
            document.getElementById('book-price').value = book.price || '';
            document.getElementById('book-notes').value = book.notes || '';
        }
    } else {
        modalTitle.textContent = 'Add Book';
        document.getElementById('book-id').value = '';
    }

    document.getElementById('book-modal').classList.add('active');
}

async function loadPublishersForDropdown() {
    try {
        const data = await apiCall('/publishers');
        const select = document.getElementById('book-publisher');
        select.innerHTML = '<option value="">None</option>' +
            data.publishers.map(p =>
                `<option value="${p.id}">${escapeHtml(p.name)} (Hall ${escapeHtml(p.hall_number)}, Col ${escapeHtml(p.column_number)})</option>`
            ).join('');
    } catch (error) {
        console.error('Failed to load publishers for dropdown:', error);
    }
}

function closeBookModal() {
    document.getElementById('book-modal').classList.remove('active');
}

async function saveBook() {
    const id = document.getElementById('book-id').value;
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;
    const publisher_id = document.getElementById('book-publisher').value || null;
    const price = document.getElementById('book-price').value || null;
    const notes = document.getElementById('book-notes').value;

    const bookData = { title, author, isbn, publisher_id, price, notes };

    try {
        if (id) {
            await apiCall(`/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(bookData)
            });
            showSuccess('Book updated successfully');
        } else {
            await apiCall('/books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });
            showSuccess('Book added successfully');
        }

        closeBookModal();
        await loadBooks();
    } catch (error) {
        console.error('Failed to save book:', error);
    }
}

async function togglePurchase(bookId, purchased) {
    try {
        await apiCall(`/books/${bookId}/purchase`, {
            method: 'PATCH',
            body: JSON.stringify({ purchased })
        });
        showSuccess(purchased ? 'Book marked as purchased' : 'Purchase status removed');
        await loadBooks();
    } catch (error) {
        console.error('Failed to update purchase status:', error);
    }
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        await apiCall(`/books/${bookId}`, {
            method: 'DELETE'
        });
        showSuccess('Book deleted successfully');
        await loadBooks();
    } catch (error) {
        console.error('Failed to delete book:', error);
    }
}

// Visits View
async function loadVisits() {
    try {
        const data = await apiCall('/publishers?visited=true');
        const visitedPublishers = data.publishers;
        renderVisits(visitedPublishers);
    } catch (error) {
        console.error('Failed to load visits:', error);
    }
}

function renderVisits(visitedPublishers) {
    const tbody = document.getElementById('visits-table').querySelector('tbody');

    if (visitedPublishers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No visits recorded yet</p></td></tr>';
        return;
    }

    tbody.innerHTML = visitedPublishers.map(pub => {
        const visitDate = pub.visit_date ? new Date(pub.visit_date).toLocaleString() : '-';
        return `
            <tr>
                <td><strong>${escapeHtml(pub.name)}</strong></td>
                <td>${escapeHtml(pub.hall_number)}</td>
                <td>${escapeHtml(pub.column_number)}</td>
                <td>${visitDate}</td>
                <td>${escapeHtml(pub.notes || '-')}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-warning" onclick="openPublisherModal(${pub.id})">Edit</button>
                        <button class="btn btn-secondary" onclick="toggleVisit(${pub.id}, false)">Unmark Visit</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Utility Functions
function showLoading() {
    loading.classList.add('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert('Error: ' + message);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
