// DiscountUsageReport.js
// --------------------------------------------------------------
import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import {
  CSpinner,
  CButton,
  CFormInput,
  CRow,
  CCol,
  CModal,
  CModalHeader,
  CModalBody,
  CModalTitle,
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CustomToolbar from '../../utils/CustomToolbar';
import { fetchDiscountUsageByDate } from '../../redux/slices/reportSlice';

const formatDate = (d) => d.toISOString().split('T')[0];

const DiscountUsageReport = () => {
  const dispatch = useDispatch();
  const { discountUsageByDate, loading } = useSelector((s) => s.reports);
  const token  = localStorage.getItem('authToken')

  /* ---------------------- date pickers ---------------------- */
  const today = new Date();
  const lastMonth = new Date(today);
  //lastMonth.setMonth(today.getMonth() - 6);
    const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(formatDate(oneYearAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  /* ---------------------- modal state ----------------------- */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  /* ---------------------- filter states --------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isMobileView, setIsMobileView] = useState(false);


  const { restaurantId } = useSelector((s) => s.auth);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
  if (token && restaurantId) {
    dispatch(fetchDiscountUsageByDate({ token, startDate, endDate, restaurantId }));
  }
}, [dispatch, token, restaurantId,startDate, endDate]);
  /* ------------------ fetch on button click ----------------- */
  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(
      fetchDiscountUsageByDate({ token, startDate, endDate, restaurantId })
    );
  };

  /* ------------------ helpers & columns --------------------- */
  const currency = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let filtered = (discountUsageByDate || []).map((d, idx) => ({
      id: idx + 1,
      date: d.date,
      totalDiscount: d.totalDiscount,
      transactionCount: d.transactions.length,
      transactions: d.transactions,
    }));

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.totalDiscount.toString().includes(searchTerm) ||
        row.transactionCount.toString().includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [discountUsageByDate, searchTerm, sortBy, sortOrder]);

  // rows: one per date
  const rows = useMemo(
    () => filteredAndSortedRows,
    [filteredAndSortedRows]
  );

  const columns = [
    { field: 'id', headerName: 'S.No.', width: 90, headerClassName: 'hdr' },
    { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'hdr' },
    {
      field: 'totalDiscount',
      headerName: 'Total Discount',
      flex: 1.2,
      headerClassName: 'hdr',
      valueGetter: (p) => currency(p.row.totalDiscount),
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

  /* ------- modal columns (full transaction list) ------------ */
  const modalColumns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.7 },
    { field: 'user_id', headerName: 'User ID', flex: 0.7 },
    { field: 'payment_type', headerName: 'Payment', flex: 1 },
    {
      field: 'discount',
      headerName: 'Discount',
      flex: 1,
      valueGetter: (p) => currency(p.row.discount),
    },
    {
      field: 'sub_total',
      headerName: 'Sub-Total',
      flex: 1,
      valueGetter: (p) => currency(p.row.sub_total),
    },
    {
      field: 'tax',
      headerName: 'Tax',
      flex: 1,
      valueGetter: (p) => currency(p.row.tax),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      valueGetter: (p) => currency(p.row.total),
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1.4,
      valueGetter: (p) => new Date(p.row.created_at).toLocaleString(),
    },
  ];

  // Mobile Card Component
  const MobileCard = ({ row }) => (
    <CCard className="mb-3 shadow-sm">
      <CCardHeader className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">Date: {row.date}</h6>
          <CButton
            size="sm"
            color="info"
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
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol xs={6} className="text-center">
            <div className="border-end">
              <h6 className="text-muted mb-1">Total Discount</h6>
              <h5 className="text-success mb-0">{currency(row.totalDiscount)}</h5>
            </div>
          </CCol>
          <CCol xs={6} className="text-center">
            <h6 className="text-muted mb-1">Transactions</h6>
            <h5 className="text-primary mb-0">{row.transactionCount}</h5>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  );

  /* --------------------------- UI --------------------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Discount Usage Report</h2>

      {/* date pickers */}
      <CRow className="align-items-end mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <CCol xs="auto">
          <label className="form-label fw-bold" htmlFor="start">
            Start Date
          </label>
          <CFormInput
            id="start"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol xs="auto">
          <label className="form-label fw-bold" htmlFor="end">
            End Date
          </label>
          <CFormInput
            id="end"
            type="date"
            value={endDate}
            min={startDate}
            max={formatDate(today)}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol xs="auto" className="pt-2">
          <CButton color="primary" onClick={handleGenerateReport}>
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {/* Filter Section */}
      <CRow className="mb-3">
        <CCol xs={12} md={4} className="mb-2">
          <CInputGroup>
            <CInputGroupText>
              <i className="cil-magnifying-glass"></i>
            </CInputGroupText>
            <CFormInput
              placeholder="Search by date, discount, or transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol xs={6} md={3} className="mb-2">
          <CFormSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="totalDiscount">Sort by Discount</option>
            <option value="transactionCount">Sort by Transactions</option>
          </CFormSelect>
        </CCol>
        <CCol xs={6} md={3} className="mb-2">
          <CFormSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </CFormSelect>
        </CCol>
        <CCol xs={12} md={2} className="mb-2">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSortBy('date');
              setSortOrder('desc');
            }}
            className="w-100"
          >
            Clear Filters
          </CButton>
        </CCol>
      </CRow>

      {/* main grid */}
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {/* Desktop View - DataGrid */}
          {!isMobileView && (
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
          )}
          
          {/* Mobile View - Cards */}
          {isMobileView && (
            <div className="mobile-cards-container">
              {rows.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted">No data found</h5>
                  <p className="text-muted">Try adjusting your filters or date range</p>
                </div>
              ) : (
                rows.map((row) => (
                  <MobileCard key={row.id} row={row} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* modal */}
      <CModal 
        size={isMobileView ? "lg" : "xl"} 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        className={isMobileView ? "mobile-modal" : ""}
      >
        <CModalHeader>
          <CModalTitle>
            Transactions on {modalDate}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={{ height: isMobileView ? 300 : 450 }}>
            <DataGrid
              rows={modalTransactions}
              columns={modalColumns}
              pageSize={isMobileView ? 3 : 5}
              rowsPerPageOptions={isMobileView ? [3] : [5]}
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: isMobileView ? '0.75rem' : '0.875rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  fontSize: isMobileView ? '0.75rem' : '0.875rem',
                },
              }}
            />
          </div>
        </CModalBody>
      </CModal>

      {/* Mobile-specific styles */}
      <style jsx>{`
        .mobile-cards-container {
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .mobile-modal .modal-dialog {
          margin: 0.5rem;
          max-width: calc(100% - 1rem);
        }
        
        @media (max-width: 767px) {
          .mobile-cards-container {
            padding: 0 0.5rem;
          }
          
          .card {
            border-radius: 8px;
          }
          
          .card-header {
            padding: 0.75rem;
          }
          
          .card-body {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DiscountUsageReport;
