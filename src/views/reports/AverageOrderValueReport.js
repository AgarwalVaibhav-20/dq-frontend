// --------------------------------------------------------------
// AverageOrderValueReport.jsx
// --------------------------------------------------------------
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCol,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CContainer,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CustomToolbar from '../../utils/CustomToolbar';
import { fetchAverageOrderValueByDate } from '../../redux/slices/reportSlice';

const formatDate = (d) => d.toISOString().split('T')[0];
const currency = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const AverageOrderValueReport = () => {
  const dispatch = useDispatch();
  const { averageOrderValueByDate, avgOrderValueLoading } = useSelector((s) => s.reports);
  const { token, restaurantId } = useSelector((s) => s.auth);

  /* -------- date range (last month → today) ----------------- */
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 6);

  const [startDate, setStartDate] = useState(formatDate(lastMonth));
  const [endDate, setEndDate] = useState(formatDate(today));

  /* -------- modal state ------------------------------------- */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  /* -------- filter states ----------------------------------- */
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'

  /* -------- initial fetch + manual fetch -------------------- */
  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchAverageOrderValueByDate({ token, startDate, endDate, restaurantId }));
    }
  }, [dispatch, token, startDate, endDate,restaurantId]);         // fetch once on mount

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');
    dispatch(fetchAverageOrderValueByDate({ token, startDate, endDate, restaurantId }));
  };

  /* -------- filtered and sorted data ----------------------- */
  const filteredAndSortedData = useMemo(() => {
    let data = (averageOrderValueByDate || []).map((d, idx) => ({
      id: idx + 1,
      date: d.date,
      averageOrderValue: d.averageOrderValue,
      transactionCount: d.transactions.length,
      transactions: d.transactions,
    }));

    // Apply sorting
    data.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'amount':
          aVal = a.averageOrderValue;
          bVal = b.averageOrderValue;
          break;
        case 'transactions':
          aVal = a.transactionCount;
          bVal = b.transactionCount;
          break;
        default:
          aVal = a.date;
          bVal = b.date;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return data;
  }, [averageOrderValueByDate, sortBy, sortOrder]);

  /* -------- DataGrid rows & columns ------------------------- */
  const rows = filteredAndSortedData;

  const columns = [
    { field: 'id', headerName: 'S.No.', width: 90, headerClassName: 'hdr' },
    { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'hdr' },
    {
      field: 'averageOrderValue',
      headerName: 'Avg. Order Value',
      flex: 1.4,
      headerClassName: 'hdr',
      valueGetter: (p) => currency(p.row.averageOrderValue),
    },
    {
      field: 'transactionCount',
      headerName: 'Transactions',
      flex: 1,
      headerClassName: 'hdr',
    },
    {
      field: 'details',
      headerName: 'View Transactions',
      width: 160,
      sortable: false,
      renderCell: (p) => (
        <CButton
          size="sm"
          color="info"
          onClick={() => {
            setModalDate(p.row.date);
            setModalTransactions(
              p.row.transactions.map((t, i) => ({ id: i + 1, ...t }))
            );
            setModalVisible(true);
          }}
        >
          View Details
        </CButton>
      ),
    },
  ];

  /* -------- Modal grid (full transactions) ------------------ */
  const modalColumns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.7 },
    { field: 'user_id', headerName: 'User ID', flex: 0.7 },
    { field: 'payment_type', headerName: 'Payment', flex: 1 },
    { field: 'discount', headerName: 'Discount', flex: 1, valueGetter: (p) => currency(p.row.discount) },
    { field: 'sub_total', headerName: 'Sub-Total', flex: 1, valueGetter: (p) => currency(p.row.sub_total) },
    { field: 'tax', headerName: 'Tax', flex: 1, valueGetter: (p) => currency(p.row.tax) },
    { field: 'total', headerName: 'Total', flex: 1, valueGetter: (p) => currency(p.row.total) },
    { field: 'created_at', headerName: 'Created At', flex: 1.4, valueGetter: (p) => new Date(p.row.created_at).toLocaleString() },
  ];

  /* -------- clear filters function ------------------------- */
  const clearFilters = () => {
    setSortBy('date');
    setSortOrder('desc');
  };

  /* -------- detect screen size ----------------------------- */
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ----------------------------- UI ------------------------- */
  return (
    <CContainer fluid className="p-3">
      <h2 className="mb-4 text-center">Average Order Value Report</h2>

      {/* Date pickers and controls */}
      <CCard className="mb-4">
        <CCardHeader>
          <CCardTitle>Report Controls</CCardTitle>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3 mb-3">
            <CCol xs={12} sm={6} md={3}>
              <CFormLabel htmlFor="start">Start Date</CFormLabel>
              <CFormInput
                id="start"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>
            <CCol xs={12} sm={6} md={3}>
              <CFormLabel htmlFor="end">End Date</CFormLabel>
              <CFormInput
                id="end"
                type="date"
                value={endDate}
                min={startDate}
                max={formatDate(today)}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>
            <CCol xs={12} sm={6} md={3}>
              <CFormLabel htmlFor="sortBy">Sort By</CFormLabel>
              <CFormSelect
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="transactions">Transactions</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12} sm={6} md={3}>
              <CFormLabel htmlFor="sortOrder">Order</CFormLabel>
              <CFormSelect
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </CFormSelect>
            </CCol>
          </CRow>


          <CRow className="g-2">
            <CCol xs="auto">
              <CButton color="primary" onClick={handleGenerateReport}>
                Generate Report
              </CButton>
            </CCol>
            <CCol xs="auto">
              <CButton color="secondary" variant="outline" onClick={clearFilters}>
                Clear Filters
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Main content */}
      {avgOrderValueLoading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {viewMode === 'desktop' ? (
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              components={{ Toolbar: CustomToolbar }}
              sx={{
                backgroundColor: '#fff',
                '& .hdr': { fontWeight: 700, fontSize: '1.05rem' },
              }}
            />
          ) : (
            <div className="row g-3">
              {rows.map((row) => (
                <div key={row.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <CCard className="h-100 shadow-sm">
                    <CCardHeader className="bg-primary text-white">
                      <CCardTitle className="h6 mb-0">
                        {new Date(row.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </CCardTitle>
                    </CCardHeader>
                    <CCardBody className="d-flex flex-column">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Average Order Value:</span>
                          <span className="fw-bold text-success">
                            {currency(row.averageOrderValue)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Transactions:</span>
                          <span className="fw-bold text-primary">
                            {row.transactionCount}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <CButton
                          size="sm"
                          color="info"
                          className="w-100"
                          onClick={() => {
                            setModalDate(row.date);
                            setModalTransactions(
                              row.transactions.map((t, i) => ({ id: i + 1, ...t }))
                            );
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
              {rows.length === 0 && (
                <div className="col-12">
                  <CCard>
                    <CCardBody className="text-center py-5">
                      <h5 className="text-muted">No data found</h5>
                      <p className="text-muted">Try adjusting your filters or date range</p>
                    </CCardBody>
                  </CCard>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <CModal size="xl" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Transactions on {modalDate}</CModalTitle>
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

export default AverageOrderValueReport;
