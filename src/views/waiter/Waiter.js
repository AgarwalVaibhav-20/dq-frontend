import React, { useState, useEffect, useRef } from 'react';
import {
  CButton, CModal, CModalBody, CModalHeader, CModalFooter,
  CFormInput, CRow, CCol, CCard, CCardImage, CCardBody, CSpinner,
  CFormSelect, CNav, CNavItem, CNavLink, CTabContent, CTabPane
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// import your waiter/order slices/actions here

export default function Waiter() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector(state => state.order); // example slice
  const token = useSelector(state => state.auth.token);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [orderData, setOrderData] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState({});
  const dropdownRef = useRef();

  useEffect(() => {
    if (token) {
      // dispatch(fetchOrders({ token }))
    }
  }, [dispatch, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) => setDropdownOpen(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddOrder = () => {
    if (!orderData.customerName) return toast.error('Customer name required.');
    setSaving(true);
    // dispatch(createOrder({ data: orderData, token }))
    //   .unwrap()
    //   .then(() => { toast.success('Order added!'); setModalVisible(false); })
    //   .finally(() => setSaving(false));
  };

  const handleEditOrder = (order) => {
    setOrderData(order);
    setEditModalVisible(true);
    setActiveTab('basic');
  };

  const handleUpdateOrder = () => {
    if (!orderData.customerName) return toast.error('Customer name required.');
    setSaving(true);
    // dispatch(updateOrder({ id: orderData._id, data: orderData, token }))
    //   .unwrap()
    //   .then(() => { toast.success('Order updated!'); setEditModalVisible(false); })
    //   .finally(() => setSaving(false));
  };

  const handleDeleteOrder = (id) => {
    if (!window.confirm('Are you sure?')) return;
    // dispatch(deleteOrder({ id, token }))
    //   .unwrap()
    //   .then(() => { toast.success('Order deleted!'); });
  };

  const filteredOrders = orders
    ?.filter(order => filter === 'All' || order.status === filter)
    .filter(order => order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><CSpinner /></div>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-semibold">Orders</h1>
        <CButton color="primary" onClick={() => setModalVisible(true)}>Add Order</CButton>
      </div>

      <div className="d-flex mb-4">
        <CFormInput placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="me-3" />
        <CFormSelect value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </CFormSelect>
      </div>

      <CRow>
        {filteredOrders?.length > 0 ? filteredOrders.map(order => (
          <CCol key={order._id} xs="12" sm="6" md="4" lg="3" className="mb-4">
            <CCard className="shadow-sm border rounded">
              {order.image && <CCardImage src={order.image} alt={order.customerName} style={{ height: '150px', objectFit: 'cover' }} />}
              <CCardBody className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-0">{order.customerName}</h5>
                  <small className="text-muted">{order.status}</small>
                </div>
                <div className="position-relative" ref={dropdownRef}>
                  <CButton color="light" className="p-0 border-0" style={{ fontSize: '20px' }} onClick={() => toggleDropdown(order._id)}>&#8942;</CButton>
                  {dropdownOpen[order._id] && (
                    <div className="dropdown-menu show position-absolute" style={{ right: 0, zIndex: 1000 }}>
                      <button className="dropdown-item" onClick={() => handleEditOrder(order)}>Edit</button>
                      <button className="dropdown-item text-danger" onClick={() => handleDeleteOrder(order._id)}>Delete</button>
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        )) : (
          <CCol>
            <div className="text-center py-5 text-muted"><h5>No orders available</h5></div>
          </CCol>
        )}
      </CRow>

      {/* Add/Edit Modal */}
      <CModal visible={modalVisible || editModalVisible} onClose={() => { setModalVisible(false); setEditModalVisible(false); }}>
        <CModalHeader>
          <h5>{modalVisible ? 'Add New Order' : 'Edit Order'}</h5>
        </CModalHeader>
        <CModalBody>
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>Basic Info</CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent className="mt-3">
            <CTabPane visible={activeTab === 'basic'}>
              <CFormInput
                type="text"
                placeholder="Customer Name"
                value={orderData.customerName || ''}
                onChange={e => setOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                className="mb-3"
              />
              <CFormSelect value={orderData.status || 'Pending'} onChange={e => setOrderData(prev => ({ ...prev, status: e.target.value }))} className="mb-3">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </CFormSelect>
            </CTabPane>

            <CTabPane visible={activeTab === 'details'}>
              <CFormInput
                type="text"
                placeholder="Order Details / Notes"
                value={orderData.details || ''}
                onChange={e => setOrderData(prev => ({ ...prev, details: e.target.value }))}
              />
            </CTabPane>
          </CTabContent>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setModalVisible(false); setEditModalVisible(false); }}>Close</CButton>
          <CButton color="primary" onClick={modalVisible ? handleAddOrder : handleUpdateOrder}>
            {saving ? 'Saving...' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
