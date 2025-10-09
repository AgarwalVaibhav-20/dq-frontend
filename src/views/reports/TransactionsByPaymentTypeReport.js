import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CButton, CCol, CFormInput, CModal, CModalBody,
  CModalHeader, CModalTitle, CRow, CSpinner, CCard, CCardBody, CCardHeader,
  CFormSelect, CContainer, CTable, CBadge
} from '@coreui/react';
import { DataGrid } from '@mui/x-data-grid';
import { fetchTransactionsByPaymentType } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];
const currency = (n) => `₹${Number(n).toFixed(2)}`;

const TransactionsByPaymentTypeReport = () => {
  const dispatch = useDispatch();
  const { transactionsByPaymentType, loading } = useSelector((s) => s.reports);
  const { token: authToken, restaurantId: authRestaurantId } = useSelector((s) => s.auth);
  
  // Get token and restaurantId from localStorage as fallback
  const token = authToken || localStorage.getItem('authToken');
  const restaurantId = authRestaurantId || localStorage.getItem('restaurantId');

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const [startDate, setStartDate] = useState(formatDate(lastWeek));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  useEffect(() => {
    if (restaurantId) {
      console.log('TransactionsByPaymentTypeReport - Using restaurantId:', restaurantId);
      dispatch(fetchTransactionsByPaymentType({ startDate, endDate, restaurantId }));
    } else {
      console.warn('TransactionsByPaymentTypeReport - Missing restaurantId:', { restaurantId });
    }
  }, [dispatch, restaurantId]);

  const handleGenerate = () => {
    if (!startDate || !endDate) return alert("Both dates are required.");
    if (new Date(endDate) < new Date(startDate)) return alert("End date cannot be before start date.");
    if (!restaurantId) return alert("Restaurant ID not found. Please login again.");
    console.log('Generating report with restaurantId:', restaurantId);
    dispatch(fetchTransactionsByPaymentType({ startDate, endDate, restaurantId }));
  };

  const rows = useMemo(() => {
    let counter = 1;
    let filteredData = (transactionsByPaymentType || []).flatMap((entry) =>
      entry.paymentTypes.map((pt) => ({
        id: counter++,
        date: entry.date,
        paymentType: pt.paymentType,
        transactionCount: pt.transactionCount,
        transactions: pt.transactions,
      }))
    );

    // Apply payment type filter
    if (filterPaymentType !== 'all') {
      filteredData = filteredData.filter(row => row.paymentType === filterPaymentType);
    }

    return filteredData;
  }, [transactionsByPaymentType, filterPaymentType]);

  // Get unique payment types for filter dropdown
  const paymentTypes = useMemo(() => {
    const types = new Set();
    (transactionsByPaymentType || []).forEach(entry => {
      entry.paymentTypes.forEach(pt => types.add(pt.paymentType));
    });
    return Array.from(types).sort();
  }, [transactionsByPaymentType]);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const columns = [
    { field: 'id', headerName: 'S.No.', width: 80 },
    { field: 'date', headerName: 'Date', flex: 1 },
    { field: 'paymentType', headerName: 'Payment Type', flex: 1 },
    { field: 'transactionCount', headerName: 'Count', flex: 0.6 },
    {
      field: 'details',
      headerName: 'View Details',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <CButton
          color="info"
          size="sm"
          onClick={() => {
            setModalTitle(`${params.row.paymentType} on ${params.row.date}`);
            setModalTransactions(params.row.transactions.map((t, i) => ({ id: i + 1, ...t })));
            setModalVisible(true);
          }}
        >
          View
        </CButton>
      )
    },
  ];

  const modalColumns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'user_id', headerName: 'User ID', flex: 0.8 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.8 },
    { field: 'payment_type', headerName: 'Payment', flex: 1 },
    { field: 'sub_total', headerName: 'Sub-Total', flex: 1, valueGetter: (p) => currency(p.row.sub_total) },
    { field: 'discount', headerName: 'Discount', flex: 1, valueGetter: (p) => currency(p.row.discount) },
    { field: 'tax', headerName: 'Tax', flex: 1, valueGetter: (p) => currency(p.row.tax) },
    { field: 'total', headerName: 'Total', flex: 1, valueGetter: (p) => currency(p.row.total) },
    { field: 'created_at', headerName: 'Created At', flex: 1.4, valueGetter: (p) => new Date(p.row.created_at).toLocaleString() },
  ];

  // Mobile Cards Component
  const MobileCards = () => (
    <div className="row g-3">
      {rows.map((row) => (
        <div key={row.id} className="col-12">
          <CCard className="h-100 shadow-sm">
            <CCardHeader className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">{row.paymentType}</h6>
                <CBadge color="primary">{row.transactionCount} Transactions</CBadge>
              </div>
            </CCardHeader>
            <CCardBody>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Date</small>
                  <div className="fw-bold">{row.date}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Payment Type</small>
                  <div className="fw-bold">{row.paymentType}</div>
                </div>
              </div>
              <div className="mt-3">
                <CButton
                  color="info"
                  size="sm"
                  className="w-100"
                  onClick={() => {
                    setModalTitle(`${row.paymentType} on ${row.date}`);
                    setModalTransactions(row.transactions.map((t, i) => ({ id: i + 1, ...t })));
                    setModalVisible(true);
                  }}
                >
                  View Details
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </div>
      ))}
    </div>
  );

  return (
    <CContainer fluid className="p-3">
      <div className="mb-4">
        <h2 className="mb-0">Transactions by Payment Type</h2>
      </div>

      {/* Filters Section */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} sm={6} md={3}>
              <label className="form-label fw-bold">Start Date</label>
              <CFormInput
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>
            <CCol xs={12} sm={6} md={3}>
              <label className="form-label fw-bold">End Date</label>
              <CFormInput
                type="date"
                value={endDate}
                min={startDate}
                max={formatDate(today)}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>
            <CCol xs={12} sm={6} md={3}>
              <label className="form-label fw-bold">Payment Type Filter</label>
              <CFormSelect
                value={filterPaymentType}
                onChange={(e) => setFilterPaymentType(e.target.value)}
              >
                <option value="all">All Payment Types</option>
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={12} sm={6} md={3} className="d-flex align-items-end">
              <CButton color="primary" onClick={handleGenerate} className="w-100">
                Generate Report
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Results Section */}
      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" variant="grow" />
          <div className="mt-2">Loading transactions...</div>
        </div>
      ) : rows.length === 0 ? (
        <CCard>
          <CCardBody className="text-center py-5">
            <h5 className="text-muted">No transactions found</h5>
            <p className="text-muted">Try adjusting your date range or filters</p>
          </CCardBody>
        </CCard>
      ) : (
        <>
          {viewMode === 'mobile' ? (
            <MobileCards />
          ) : (
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              components={{ Toolbar: CustomToolbar }}
              sx={{
                backgroundColor: '#fff',
                '& .MuiDataGrid-columnHeaders': { fontWeight: 'bold', fontSize: '1.05rem' },
              }}
            />
          )}
        </>
      )}

      {/* Modal for transaction details */}
      <CModal size="xl" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Transactions - {modalTitle}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={{ height: 450 }}>
            <DataGrid
              rows={modalTransactions}
              columns={modalColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </div>
        </CModalBody>
      </CModal>
    </CContainer>
  );
};

export default TransactionsByPaymentTypeReport;
