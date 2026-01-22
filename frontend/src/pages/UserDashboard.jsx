import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadLists();
    loadBooks();
    loadOrders();
  }, []);

  const loadLists = async () => {
    const { data } = await lists.getAll();
    setMyLists(data);
  };

  const loadBooks = async () => {
    const { data } = await books.getAll();
    setAllBooks(data);
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
      alert('Please select a list first');
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
                  {myLists.map(list => (
                    <div
                      key={list.id}
                      className="card"
                      style={{ cursor: 'pointer', border: selectedList === list.id ? '2px solid #3498db' : 'none' }}
                      onClick={() => loadListBooks(list.id)}
                    >
                      <h3>{list.name}</h3>
                      <p>{list.description}</p>
                      <span className={`status-badge ${list.is_public ? 'status-found' : 'status-pending'}`}>
                        {list.is_public ? 'Public' : 'Private'}
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
                      {listBooks.map(book => (
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
                              {[1,2,3,4,5].map(p => <option key={p} value={p}>{p}</option>)}
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
            <div className="card">
              <h2>{t('books')}</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('title')}</th>
                    <th>{t('author')}</th>
                    <th>{t('publisher')}</th>
                    <th>{t('booth')}</th>
                    <th>{t('price')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allBooks.map(book => (
                    <tr key={book.id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.publisher_name}</td>
                      <td>{book.hall_number}/{book.booth_number}</td>
                      <td>{book.original_price}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddBookToList(book.id)}
                          disabled={!selectedList}
                        >
                          {t('addBook')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {myOrders.map(order => (
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
    </div>
  );
}

export default UserDashboard;
