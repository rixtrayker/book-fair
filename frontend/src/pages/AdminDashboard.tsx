import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orders, publishers, books, AdminViewItem, Publisher, Book, OrderWithDetails } from '../api';

interface GroupedUserData {
  user_name: string;
  user_email: string;
  books: AdminViewItem[];
}

interface AdminFilters {
  hall?: string;
  priority?: string;
}

function AdminDashboard() {
  const { t } = useTranslation();
  const [adminView, setAdminView] = useState<AdminViewItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderWithDetails[]>([]);
  const [allPublishers, setAllPublishers] = useState<Publisher[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<AdminFilters>({});
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);

  useEffect(() => {
    loadAdminView();
    loadOrders();
    loadPublishers();
    loadBooks();
  }, []);

  const loadAdminView = async () => {
    const { data: response } = await orders.getAdminView(filters as any);
    setAdminView(response.data);
  };

  const loadOrders = async () => {
    const { data: response } = await orders.getAll();
    setAllOrders(response.data as OrderWithDetails[]);
  };

  const loadPublishers = async () => {
    const { data: response } = await publishers.getAll();
    setAllPublishers(response.data);
  };

  const loadBooks = async () => {
    const { data: response } = await books.getAll();
    setAllBooks(response.data);
  };

  const handleUpdateTracking = async (listBookId: number, updates: Record<string, any>) => {
    await orders.updateTracking({ list_book_id: listBookId, ...updates });
    loadAdminView();
  };

  const handleCreateOrder = async (userId: number) => {
    const userBooks = selectedBooks.filter(id => {
      const book = adminView.find(b => b.list_book_id === id);
      return book && book.user_id === userId;
    });

    if (userBooks.length === 0) {
      alert('No books selected for this user');
      return;
    }

    await orders.create({ user_id: userId, list_book_ids: userBooks });
    setSelectedBooks([]);
    loadOrders();
    loadAdminView();
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    await orders.update(orderId, { shipping_status: status as any });
    loadOrders();
  };

  const toggleBookSelection = (listBookId: number) => {
    setSelectedBooks(prev =>
      prev.includes(listBookId)
        ? prev.filter(id => id !== listBookId)
        : [...prev, listBookId]
    );
  };

  const groupByUser = (): Record<string, GroupedUserData> => {
    const grouped: Record<string, GroupedUserData> = {};
    adminView.forEach(book => {
      if (!grouped[book.user_id]) {
        grouped[book.user_id] = {
          user_name: book.user_name,
          user_email: book.user_email,
          books: []
        };
      }
      grouped[book.user_id].books.push(book);
    });
    return grouped;
  };

  const uniqueHalls = [...new Set(allPublishers.map(p => p.hall_number).filter(Boolean))];

  return (
    <div>
      <nav className="nav">
        <ul className="nav-links">
          <li><Link to="/">{t('adminView')}</Link></li>
          <li><Link to="/orders">{t('orders')}</Link></li>
          <li><Link to="/publishers">{t('publishers')}</Link></li>
          <li><Link to="/books">{t('books')}</Link></li>
        </ul>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={
            <div className="card">
              <div className="card-header">
                <h2>{t('adminView')} - {t('filter')}</h2>
                <div className="table-controls">
                  <select
                    className="select-compact"
                    onChange={(e) => setFilters({ ...filters, hall: e.target.value })}
                  >
                    <option value="">{t('hall')}</option>
                    {uniqueHalls.map(h => (
                      <option key={h as string} value={h as string}>{h}</option>
                    ))}
                  </select>
                  <select
                    className="select-compact"
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  >
                    <option value="">{t('priority')}</option>
                    {[1,2,3,4,5].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={loadAdminView}>{t('filter')}</button>
                </div>
              </div>

              {Object.entries(groupByUser()).map(([userId, userData]) => (
                <div key={userId} className="card mb-1">
                  <div className="card-header">
                    <h3>{userData.user_name} ({userData.user_email})</h3>
                    <button
                      className="btn btn-success"
                      onClick={() => handleCreateOrder(+userId)}
                    >
                      {t('createOrder')}
                    </button>
                  </div>

                  <table className="table">
                    <thead>
                      <tr>
                        <th>✓</th>
                        <th>{t('title')}</th>
                        <th>{t('publisher')}</th>
                        <th>{t('booth')}</th>
                        <th>{t('originalPrice')}</th>
                        <th>{t('actualPrice')}</th>
                        <th>{t('discount')}</th>
                        <th>{t('status')}</th>
                        <th>{t('priority')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.books.map(book => (
                        <tr key={book.list_book_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedBooks.includes(book.list_book_id)}
                              onChange={() => toggleBookSelection(book.list_book_id)}
                            />
                          </td>
                          <td>{book.title}</td>
                          <td>{book.publisher_name}</td>
                          <td>{book.hall_number}/{book.booth_number}</td>
                          <td>{book.original_price}</td>
                          <td>
                            <input
                              type="number"
                              className="input-sm"
                              defaultValue={book.actual_price ?? undefined}
                              onBlur={(e) => handleUpdateTracking(book.list_book_id, {
                                actual_price: +e.target.value
                              })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input-sm"
                              defaultValue={book.discount_amount ?? undefined}
                              onBlur={(e) => handleUpdateTracking(book.list_book_id, {
                                discount_amount: +e.target.value
                              })}
                            />
                          </td>
                          <td>
                            <select
                              className={`status-badge status-${book.search_status || 'searching'}`}
                              value={book.search_status || 'searching'}
                              onChange={(e) => handleUpdateTracking(book.list_book_id, {
                                search_status: e.target.value
                              })}
                            >
                              <option value="searching">{t('searching')}</option>
                              <option value="found">{t('found')}</option>
                              <option value="purchased">{t('purchased')}</option>
                            </select>
                          </td>
                          <td>
                            <span className={`priority-badge priority-${book.priority}`}>
                              {book.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${book.status}`}>
                              {t(book.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          } />

          <Route path="/orders" element={
            <div className="card">
              <h2>{t('orders')}</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('user')}</th>
                    <th>{t('totalPrice')}</th>
                    <th>{t('shippingStatus')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.user_name || '-'}</td>
                      <td>{order.total_price}</td>
                      <td>
                        <select
                          className={`status-badge status-${order.shipping_status}`}
                          value={order.shipping_status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="shipped">{t('shipped')}</option>
                          <option value="delivered">{t('delivered')}</option>
                        </select>
                      </td>
                      <td>{order.collector_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          } />

          <Route path="/publishers" element={
            <div className="card">
              <h2>{t('publishers')}</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('hall')}</th>
                    <th>{t('booth')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allPublishers.map(pub => (
                    <tr key={pub.id}>
                      <td>{pub.name}</td>
                      <td>{pub.hall_number}</td>
                      <td>{pub.booth_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <th>{t('price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allBooks.map(book => (
                    <tr key={book.id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.publisher_name}</td>
                      <td>{book.original_price}</td>
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

export default AdminDashboard;
