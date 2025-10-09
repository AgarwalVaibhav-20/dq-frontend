import React, { useEffect, useState, useMemo } from 'react';
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
  CContainer,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from '@coreui/react';
import { fetchAllTransactions } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

/* ----------------------------- Helpers ----------------------------- */
const formatDate = (d) => d.toISOString().split('T')[0];
const currency = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const TaxCollectedReport = () => {
  const dispatch = useDispatch();
  const { allTransactions, loading } = useSelector((s) => s.reports);

  const restaurantId = localStorage.getItem('restaurantId');
  const token = localStorage.getItem('authToken');

  /* ---------------------- date pickers & local state ---------------------- */
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(formatDate(oneYearAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  // modal state
  const [visible, setVisible] = useState(false);
  const [modalRows, setModalRows] = useState([]);
  const [modalDate, setModalDate] = useState('');

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'cards'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'tax', 'transactions'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [searchTerm, setSearchTerm] = useState('');

  /* ------------------------------ fetch data ------------------------------ */
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchAllTransactions({ restaurantId, token }));
    }
  }, [dispatch, restaurantId, token]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setViewMode('cards');
      } else {
        setViewMode('grid');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(fetchAllTransactions({ restaurantId, token }));
  };

  /* ---------------- Process transactions into daily tax stats -------------- */
  const transactions = Array.isArray(allTransactions) ? allTransactions : [];

  const filteredTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.createdAt);
    return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
  });

  const taxData = filteredTransactions.reduce((acc, txn) => {
    const date = new Date(txn.createdAt).toISOString().split('T')[0];
    const taxAmount = txn.tax_amount || txn.taxAmount || 0;

    if (!acc[date]) {
      acc[date] = {
        date,
        totalTax: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    acc[date].totalTax += taxAmount;
    acc[date].transactionCount++;
    acc[date].transactions.push({
      id: txn._id,
      tableNumber: txn.tableNumber || 'N/A',
      userId: txn.customerId?.name || txn.username || 'N/A',
      type: txn.type || 'N/A',
      sub_total: txn.sub_total || 0,
      discount: txn.discount || 0,
      tax: taxAmount,
      total: txn.total || 0,
      note: txn.note || '',
      created_at: txn.createdAt,
    });

    return acc;
  }, {});

  const rows = Object.values(taxData).map((item, index) => ({
    id: index + 1,
    date: item.date,
    totalTax: item.totalTax,
    transactionCount: item.transactionCount,
    transactions: item.transactions,
  }));

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.totalTax.toString().includes(searchTerm) ||
        row.transactionCount.toString().includes(searchTerm)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'tax':
          aValue = a.totalTax;
          bValue = b.totalTax;
          break;
        case 'transactions':
          aValue = a.transactionCount;
          bValue = b.transactionCount;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [rows, searchTerm, sortBy, sortOrder]);

  /* ------------------------- MAIN grid: columns --------------------------- */
  const mainColumns = useMemo(
    () => [
      { field: 'id', headerName: 'S.No.', width: 90, headerClassName: 'hdr' },
      { field: 'date', headerName: 'Date', flex: 1.1, headerClassName: 'hdr' },
      {
        field: 'totalTax',
        headerName: 'Total Tax Collected',
        flex: 1.1,
        headerClassName: 'hdr',
        valueGetter: (p) => currency(p.row.totalTax),
      },
      {
        field: 'transactionCount',
        headerName: 'Transactions',
        flex: 1,
        headerClassName: 'hdr',
      },
      {
        field: 'details',
        headerName: 'See Details',
        width: 140,
        sortable: false,
        renderCell: (p) => (
          <CButton
            size="sm"
            color="info"
            onClick={() => {
              setModalDate(p.row.date);
              setModalRows(
                p.row.transactions.map((t, idx) => ({
                  id: idx + 1,
                  ...t,
                }))
              );
              setVisible(true);
            }}
          >
            View
          </CButton>
        ),
      },
    ],
    []
  );

  /* ------------------------- MODAL grid: columns -------------------------- */
  const modalColumns = [
    { field: 'id', headerName: 'S.No.', width: 80 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.7 },
    { field: 'userId', headerName: 'Customer', flex: 1 },
    { field: 'type', headerName: 'Payment Type', flex: 1 },
    {
      field: 'sub_total',
      headerName: 'Sub Total',
      flex: 1,
      valueGetter: (p) => currency(p.row.sub_total || 0),
    },
    {
      field: 'discount',
      headerName: 'Discount',
      flex: 1,
      valueGetter: (p) => currency(p.row.discount || 0),
    },
    {
      field: 'tax',
      headerName: 'Tax',
      flex: 1,
      valueGetter: (p) => currency(p.row.tax || 0),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      valueGetter: (p) => currency(p.row.total || 0),
    },
    { field: 'note', headerName: 'Note', flex: 1.2 },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1.4,
      valueGetter: (p) =>
        p.row.created_at ? new Date(p.row.created_at).toLocaleString() : 'N/A',
    },
  ];

  // Mobile Card Component
  const MobileCard = ({ row, index }) => (
    <CCard className="mb-3 shadow-sm" style={{ border: '1px solid #e0e0e0' }}>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0">Date: {row.date}</h6>
          <small className="text-muted">#{index + 1}</small>
        </div>
        <CBadge color="info">{row.transactionCount} Transactions</CBadge>
      </CCardHeader>
      <CCardBody>
        <div className="row">
          <div className="col-6">
            <strong>Total Tax:</strong>
            <div className="text-success fw-bold">{currency(row.totalTax)}</div>
          </div>
          <div className="col-6 text-end">
            <CButton
              size="sm"
              color="info"
              onClick={() => {
                setModalDate(row.date);
                setModalRows(
                  row.transactions.map((t, idx) => ({
                    id: idx + 1,
                    ...t,
                  }))
                );
                setVisible(true);
              }}
            >
              View Details
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );

  /* -------------------------------- render -------------------------------- */
  return (
    <CContainer fluid className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Tax Collected Report</h2>
        {!isMobile && (
          <div className="d-flex gap-2">
            <CButton
              color={viewMode === 'grid' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </CButton>
            <CButton
              color={viewMode === 'cards' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Card View
            </CButton>
          </div>
        )}
      </div>

      {/* date-range controls */}
      <CRow className="align-items-end mb-4" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <CCol xs={12} sm={6} md={3}>
          <label htmlFor="start" className="form-label fw-bold">
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

        <CCol xs={12} sm={6} md={3}>
          <label htmlFor="end" className="form-label fw-bold">
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

        <CCol xs={12} sm={12} md={3} className="pt-2">
          <CButton color="primary" onClick={handleGenerateReport} className="w-100">
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {/* Filter and Search Controls */}
      <CRow className="mb-4">
        <CCol xs={12} md={6}>
          <CInputGroup>
            <CInputGroupText>🔍</CInputGroupText>
            <CFormInput
              placeholder="Search by date, tax amount, or transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol xs={12} md={3}>
          <CFormSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="tax">Sort by Tax Amount</option>
            <option value="transactions">Sort by Transactions</option>
          </CFormSelect>
        </CCol>
        <CCol xs={12} md={3}>
          <CFormSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </CFormSelect>
        </CCol>
      </CRow>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {viewMode === 'cards' || isMobile ? (
            // Mobile/Card View
            <div>
              {filteredAndSortedRows.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted">No tax data found for the selected period</h5>
                  <p className="text-muted">Try adjusting your date range or search terms</p>
                </div>
              ) : (
                filteredAndSortedRows.map((row, index) => (
                  <MobileCard key={row.id} row={row} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop Grid View
            <div style={{ overflowX: 'auto' }}>
              <DataGrid
                autoHeight
                rows={filteredAndSortedRows}
                columns={mainColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                components={{ Toolbar: CustomToolbar }}
                sx={{
                  backgroundColor: '#fff',
                  '& .hdr': { fontWeight: 700, fontSize: '1.05rem' },
                }}
              />
            </div>
          )}
        </>
      )}

      {/* ──────────────── transactions modal ──────────────── */}
      <CModal size="xl" visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Transactions on {modalDate}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {isMobile ? (
            // Mobile view for modal
            <div>
              {modalRows.map((transaction, index) => (
                <CCard key={transaction.id} className="mb-3">
                  <CCardBody>
                    <div className="row">
                      <div className="col-6">
                        <strong>Table:</strong> {transaction.tableNumber}<br/>
                        <strong>Customer:</strong> {transaction.userId}<br/>
                        <strong>Type:</strong> {transaction.type}
                      </div>
                      <div className="col-6">
                        <strong>Sub Total:</strong> {currency(transaction.sub_total)}<br/>
                        <strong>Discount:</strong> {currency(transaction.discount)}<br/>
                        <strong>Tax:</strong> {currency(transaction.tax)}<br/>
                        <strong>Total:</strong> {currency(transaction.total)}
                      </div>
                    </div>
                    {transaction.note && (
                      <div className="mt-2">
                        <strong>Note:</strong> {transaction.note}
                      </div>
                    )}
                    <div className="mt-2 text-muted small">
                      {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </CCardBody>
                </CCard>
              ))}
            </div>
          ) : (
            // Desktop view for modal
            <div style={{ height: 450 }}>
              <DataGrid
                rows={modalRows}
                columns={modalColumns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </div>
          )}
        </CModalBody>
      </CModal>
    </CContainer>
  );
};

export default TaxCollectedReport;
