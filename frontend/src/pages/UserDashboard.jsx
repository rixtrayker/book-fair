import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lists, books, orders } from '../api';

function UserDashboard() {
  const { t } = useTranslation();
  const [myLists, setMyLists] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listBooks, setListBooks] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '', is_public: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPublisher, setSelectedPublisher] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [previewBook, setPreviewBook] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    loadLists();
    loadBooks();
    loadOrders();
  }, []);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategory, selectedPublisher, minPrice, maxPrice]);

  const loadLists = async () => {
    const { data } = await lists.getAll();
    setMyLists(data);
  };

  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      const { data } = await books.getAll();
      setAllBooks(data);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadOrders = async () => {
    const { data } = await orders.getMyOrders();
    setMyOrders(data);
  };

  const loadListBooks = async (listId) => {
    const { data } = await lists.getBooks(listId);
    setListBooks(data);
    setSelectedList(listId);
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    await lists.create(newList);
    setNewList({ name: '', description: '', is_public: false });
    setShowCreateList(false);
    loadLists();
  };

  const handleAddBookToList = async (bookId) => {
    if (!selectedList) {
      alert(t('selectListFirst'));
      return;
    }
    await lists.addBook(selectedList, { book_id: bookId, status: 'want', priority: 3 });
    loadListBooks(selectedList);
  };

  const handleUpdateBookStatus = async (listBookId, status, priority) => {
    await lists.updateBook(listBookId, { status, priority });
    loadListBooks(selectedList);
  };

  const getPriorityColor = (priority) => {
    return `priority-${priority}`;
  };

  const normalizeText = (value) => (value || '').toString().toLowerCase().trim();

  const calculateDistance = (source, target) => {
    if (!source || !target) return Number.MAX_SAFE_INTEGER;
    const sourceLength = source.length;
    const targetLength = target.length;
    const matrix = Array.from({ length: sourceLength + 1 }, () => Array(targetLength + 1).fill(0));

    for (let rowIndex = 0; rowIndex <= sourceLength; rowIndex += 1) {
      matrix[rowIndex][0] = rowIndex;
    }
    for (let colIndex = 0; colIndex <= targetLength; colIndex += 1) {
      matrix[0][colIndex] = colIndex;
    }

    for (let rowIndex = 1; rowIndex <= sourceLength; rowIndex += 1) {
      for (let colIndex = 1; colIndex <= targetLength; colIndex += 1) {
        const cost = source[rowIndex - 1] === target[colIndex - 1] ? 0 : 1;
        matrix[rowIndex][colIndex] = Math.min(
          matrix[rowIndex - 1][colIndex] + 1,
          matrix[rowIndex][colIndex - 1] + 1,
          matrix[rowIndex - 1][colIndex - 1] + cost
        );
      }
    }

    return matrix[sourceLength][targetLength];
  };

  const categories = useMemo(() => {
    const values = allBooks.map((book) => book.category).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [allBooks]);

  const publishers = useMemo(() => {
    const values = allBooks.map((book) => book.publisher_name).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    return allBooks.filter((book) => {
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      const matchesPublisher = selectedPublisher === 'all' || book.publisher_name === selectedPublisher;
      const priceValue = Number(book.original_price || 0);
      const matchesMinPrice = minPrice ? priceValue >= Number(minPrice) : true;
      const matchesMaxPrice = maxPrice ? priceValue <= Number(maxPrice) : true;

      if (!matchesCategory || !matchesPublisher || !matchesMinPrice || !matchesMaxPrice) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableFields = [book.title, book.author, book.isbn];
      const matchesExact = searchableFields.some((field) => normalizeText(field).includes(normalizedQuery));
      if (matchesExact) {
        return true;
      }

      if (normalizedQuery.length < 3) {
        return false;
      }

      const titleDistance = calculateDistance(normalizedQuery, normalizeText(book.title));
      return titleDistance <= 2;
    });
  }, [allBooks, searchQuery, selectedCategory, selectedPublisher, minPrice, maxPrice]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return [];
    }
    const ranked = allBooks
      .map((book) => {
        const title = normalizeText(book.title);
        const author = normalizeText(book.author);
        const isbn = normalizeText(book.isbn);
        const directMatch = title.includes(normalizedQuery) || author.includes(normalizedQuery) || isbn.includes(normalizedQuery);
        const distance = calculateDistance(normalizedQuery, title);
        return {
          book,
          score: directMatch ? 0 : distance,
        };
      })
      .filter((entry) => entry.score <= 2 || normalizeText(entry.book.title).includes(normalizedQuery));

    return ranked
      .sort((first, second) => first.score - second.score)
      .slice(0, 5)
      .map((entry) => entry.book);
  }, [allBooks, searchQuery]);

  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMoreBooks = visibleCount < filteredBooks.length;

  return (
    <div>
      <nav className="nav">
        <ul className="nav-links">
          <li><Link to="/">{t('myLists')}</Link></li>
          <li><Link to="/books">{t('books')}</Link></li>
          <li><Link to="/orders">{t('orders')}</Link></li>
        </ul>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={
            <div>
              <div className="card">
                <div className="card-header">
                  <h2>{t('myLists')}</h2>
                  <button className="btn btn-primary" onClick={() => setShowCreateList(!showCreateList)}>
                    {t('createList')}
                  </button>
                </div>

                {showCreateList && (
                  <form onSubmit={handleCreateList} className="mb-1">
                    <div className="form-group">
                      <input
                        placeholder={t('listName')}
                        value={newList.name}
                        onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        placeholder={t('description')}
                        value={newList.description}
                        onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newList.is_public}
                          onChange={(e) => setNewList({ ...newList, is_public: e.target.checked })}
                        />
                        {' '}{t('makePublic')}
                      </label>
                    </div>
                    <button type="submit" className="btn btn-success">{t('create')}</button>
                  </form>
                )}

                <div className="grid grid-2">
                  {myLists.map((list) => (
                    <div
                      key={list.id}
                      className={`card card-selectable ${selectedList === list.id ? 'card-selected' : ''}`}
                      onClick={() => loadListBooks(list.id)}
                    >
                      <h3>{list.name}</h3>
                      <p>{list.description}</p>
                      <span className={`status-badge ${list.is_public ? 'status-found' : 'status-pending'}`}>
                        {list.is_public ? t('public') : t('private')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedList && (
                <div className="card mt-1">
                  <h3>{t('books')}</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('title')}</th>
                        <th>{t('author')}</th>
                        <th>{t('publisher')}</th>
                        <th>{t('booth')}</th>
                        <th>{t('price')}</th>
                        <th>{t('status')}</th>
                        <th>{t('priority')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listBooks.map((book) => (
                        <tr key={book.id}>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.publisher_name}</td>
                          <td>{book.hall_number}/{book.booth_number}</td>
                          <td>{book.original_price}</td>
                          <td>
                            <select
                              className={`status-badge status-${book.status}`}
                              value={book.status}
                              onChange={(e) => handleUpdateBookStatus(book.id, e.target.value, book.priority)}
                            >
                              <option value="want">{t('want')}</option>
                              <option value="maybe">{t('maybe')}</option>
                              <option value="thinking">{t('thinking')}</option>
                              <option value="cancel">{t('cancel')}</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className={`priority-badge ${getPriorityColor(book.priority)}`}
                              value={book.priority}
                              onChange={(e) => handleUpdateBookStatus(book.id, book.status, +e.target.value)}
                            >
                              {[1, 2, 3, 4, 5].map((priorityValue) => (
                                <option key={priorityValue} value={priorityValue}>{priorityValue}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {book.search_status && (
                              <span className={`status-badge status-${book.search_status}`}>
                                {t(book.search_status)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          } />

          <Route path="/books" element={
            <div>
              <div className="page-header">
                <h2>{t('books')}</h2>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedPublisher('all');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  {t('clearFilters')}
                </button>
              </div>

              <div className="filter-panel">
                <div className="filter-row">
                  <input
                    className="search-input"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">{t('all')}</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPublisher}
                    onChange={(e) => setSelectedPublisher(e.target.value)}
                  >
                    <option value="all">{t('all')}</option>
                    {publishers.map((publisher) => (
                      <option key={publisher} value={publisher}>{publisher}</option>
                    ))}
                  </select>
                  <input
                    className="input-sm"
                    placeholder={t('minPrice')}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    type="number"
                  />
                  <input
                    className="input-sm"
                    placeholder={t('maxPrice')}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="filter-row">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`chip ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        className="suggestion-item"
                        onClick={() => {
                          setSearchQuery(book.title);
                          setPreviewBook(book);
                        }}
                      >
                        <span>{book.title}</span>
                        <span className="mono">{book.isbn}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingBooks ? (
                <div className="book-grid">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="book-card">
                      <div className="book-cover skeleton" />
                      <div className="book-meta">
                        <div className="skeleton" style={{ height: '14px' }} />
                        <div className="skeleton" style={{ height: '12px', width: '70%' }} />
                        <div className="skeleton" style={{ height: '12px', width: '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="book-grid">
                  {visibleBooks.map((book) => (
                    <div key={book.id} className="book-card">
                      <div className="book-cover">
                        <div>
                          <div className="book-title">{book.title}</div>
                          <div className="book-author">{book.author}</div>
                        </div>
                      </div>
                      <div className="book-meta">
                        <div className="book-title">{book.title}</div>
                        <div className="book-author">{book.author}</div>
                        <div className="mono">{book.isbn}</div>
                        <div>{book.publisher_name}</div>
                        <div>{t('price')}: {book.original_price}</div>
                        <div className="book-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAddBookToList(book.id)}
                            disabled={!selectedList}
                          >
                            {t('addBook')}
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => setPreviewBook(book)}
                          >
                            {t('lookInside')}
                          </button>
                        </div>
                      </div>
                      <div className="book-overlay">
                        <div>{t('quickView')}</div>
                        <button className="btn btn-secondary" onClick={() => setPreviewBook(book)}>
                          {t('lookInside')}
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddBookToList(book.id)}
                          disabled={!selectedList}
                        >
                          {t('addBook')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingBooks && filteredBooks.length === 0 && (
                <div className="card text-center">{t('noResults')}</div>
              )}

              {!loadingBooks && hasMoreBooks && (
                <div className="text-center mt-1">
                  <button className="btn btn-outline" onClick={() => setVisibleCount(visibleCount + 12)}>
                    {t('loadMore')}
                  </button>
                </div>
              )}
            </div>
          } />

          <Route path="/orders" element={
            <div className="card">
              <h2>{t('orders')}</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('totalPrice')}</th>
                    <th>{t('shippingStatus')}</th>
                    <th>{t('admin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.total_price}</td>
                      <td>
                        <span className={`status-badge status-${order.shipping_status}`}>
                          {t(order.shipping_status)}
                        </span>
                      </td>
                      <td>{order.admin_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          } />
        </Routes>
      </div>

      {previewBook && (
        <div className="modal-backdrop" onClick={() => setPreviewBook(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewBook.title}</h3>
              <button className="btn btn-outline" onClick={() => setPreviewBook(null)}>
                {t('close')}
              </button>
            </div>
            <div className="modal-body">
              <div>{previewBook.author}</div>
              <div className="mono">{previewBook.isbn}</div>
              <div>{previewBook.publisher_name}</div>
              <div>{t('category')}: {previewBook.category || '-'}</div>
              <div>{t('booth')}: {previewBook.hall_number}/{previewBook.booth_number}</div>
              <div>{t('price')}: {previewBook.original_price}</div>
              <div className="card">
                <h4>{t('preview')}</h4>
                <p>{t('previewPlaceholder')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
