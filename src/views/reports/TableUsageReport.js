// TableUsageReport.js
// -----------------------------------------
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
} from '@coreui/react';
import { fetchTableUsageByDate } from '../../redux/slices/reportSlice'; // create this thunk for /tableUsageByDate
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];

const TableUsageReport = () => {
  const dispatch = useDispatch();
  const { tableUsageByDate, loading } = useSelector((s) => s.reports);
  const { restaurantId, token } = useSelector((s) => s.auth);

  // Date range states
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(formatDate(oneYearAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  // Filter states
  const [filterTableNumber, setFilterTableNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTable, setModalTable] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Fetch data effect
  useEffect(() => {
    if (restaurantId && token)
      dispatch(fetchTableUsageByDate({ token, startDate, endDate, restaurantId }));
  }, [dispatch, restaurantId, token, startDate, endDate]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(fetchTableUsageByDate({ token, startDate, endDate, restaurantId }));
  };

  // Currency formatter
  const currency = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Main table: each row is a date + table usage summary
  // We'll flatten: one row per date-table combo
  const rows = useMemo(() => {
    if (!tableUsageByDate) return [];
    let id = 1;
    const data = [];
    for (const dateEntry of tableUsageByDate) {
      const date = dateEntry.date;
      for (const table of dateEntry.tables) {
        data.push({
          id: id++,
          date,
          tableNumber: table.tableNumber,
          transactionCount: table.transactionCount,
          transactions: table.transactions,
        });
      }
    }
    return data;
  }, [tableUsageByDate]);

  // Filtered data based on search and table filter
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch = searchTerm === '' || 
        row.tableNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.date.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTableFilter = filterTableNumber === '' || 
        row.tableNumber.toString() === filterTableNumber;
      
      return matchesSearch && matchesTableFilter;
    });
  }, [rows, searchTerm, filterTableNumber]);

  // Get unique table numbers for filter dropdown
  const uniqueTableNumbers = useMemo(() => {
    const tables = [...new Set(rows.map(row => row.tableNumber))].sort((a, b) => a - b);
    return tables;
  }, [rows]);

  // Columns for main grid
  const columns = [
    { field: 'id', headerName: 'S.No.', width: 90, headerClassName: 'hdr' },
    { field: 'date', headerName: 'Date', flex: 1, headerClassName: 'hdr' },
    {
      field: 'tableNumber',
      headerName: 'Table Number',
      flex: 1,
      headerClassName: 'hdr',
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
            setModalTable(p.row.tableNumber);
            setModalTransactions(
              p.row.transactions.map((t, idx) => ({
                id: idx + 1,
                ...t,
              }))
            );
            setModalVisible(true);
          }}
        >
          View Details
        </CButton>
      ),
    },
  ];

  // Columns for transactions modal
  const modalColumns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'user_id', headerName: 'User ID', flex: 0.7 },
    { field: 'payment_type', headerName: 'Payment Type', flex: 1 },
    {
      field: 'sub_total',
      headerName: 'Sub Total',
      flex: 1,
      valueGetter: (p) => currency(p.row.sub_total),
    },
    {
      field: 'discount',
      headerName: 'Discount',
      flex: 1,
      valueGetter: (p) => currency(p.row.discount),
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
    { field: 'note', headerName: 'Note', flex: 1.2 },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1.4,
      valueGetter: (p) => new Date(p.row.created_at).toLocaleString(),
    },
  ];

  // Mobile Card Component
  const MobileCard = ({ row }) => (
    <CCard className="mb-3 shadow-sm mobile-card table-usage-card">
      <CCardHeader className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="cil-table me-2"></i>
            Table #{row.tableNumber}
          </h6>
          <span className="badge bg-primary">
            {row.transactionCount} Transactions
          </span>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="row">
          <div className="col-6">
            <small className="text-muted d-block">Date:</small>
            <p className="mb-2 fw-bold">{row.date}</p>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Transactions:</small>
            <p className="mb-2 fw-bold text-primary">{row.transactionCount}</p>
          </div>
        </div>
        <div className="d-grid">
          <CButton
            size="sm"
            color="info"
            onClick={() => {
              setModalDate(row.date);
              setModalTable(row.tableNumber);
              setModalTransactions(
                row.transactions.map((t, idx) => ({
                  id: idx + 1,
                  ...t,
                }))
              );
              setModalVisible(true);
            }}
          >
            <i className="cil-eye me-1"></i>
            View Details
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );

  return (
    <div className="p-3 p-md-4" style={{ minHeight: '100vh' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-card {
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
          }
          .mobile-card .card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px 8px 0 0;
          }
          .mobile-card .card-body {
            padding: 1rem;
          }
          .filter-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }
        }
        .table-usage-card {
          transition: transform 0.2s ease-in-out;
        }
        .table-usage-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
      <h2 className="mb-4">Table Usage Report</h2>

      {/* Date range pickers */}
      <CRow className="align-items-end mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <CCol xs={12} sm={6} md={3}>
          <label htmlFor="start" className="form-label fw-bold">
            Start Date
          </label>
          <CFormInput
            type="date"
            id="start"
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
            type="date"
            id="end"
            value={endDate}
            min={startDate}
            max={formatDate(today)}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol xs={12} sm={12} md={3} className="pt-2">
          <CButton color="primary" onClick={handleGenerateReport} className="w-100 w-md-auto">
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {/* Filter Section */}
      <div className="filter-section">
        <h5 className="mb-3">Filters</h5>
        <CRow className="mb-3">
          <CCol xs={12} md={6} className="mb-2">
            <CInputGroup>
              <CInputGroupText>
                <i className="cil-magnifying-glass"></i>
              </CInputGroupText>
              <CFormInput
                placeholder="Search by table number or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CInputGroup>
          </CCol>
          <CCol xs={12} md={6} className="mb-2">
            <CFormSelect
              value={filterTableNumber}
              onChange={(e) => setFilterTableNumber(e.target.value)}
            >
              <option value="">All Tables</option>
              {uniqueTableNumbers.map(tableNum => (
                <option key={tableNum} value={tableNum}>
                  Table #{tableNum}
                </option>
              ))}
            </CFormSelect>
          </CCol>
        </CRow>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing {filteredRows.length} of {rows.length} records
          </small>
          {(searchTerm || filterTableNumber) && (
            <CButton
              size="sm"
              color="secondary"
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterTableNumber('');
              }}
            >
              Clear Filters
            </CButton>
          )}
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : isMobileView ? (
        // Mobile Cards View
        <div>
          {filteredRows.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No data found</p>
            </div>
          ) : (
            filteredRows.map((row) => (
              <MobileCard key={row.id} row={row} />
            ))
          )}
        </div>
      ) : (
        // Desktop Table View
        <DataGrid
          autoHeight
          rows={filteredRows}
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

      {/* Modal with transactions of the selected table & date */}
      <CModal size="xl" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>
            Transactions for Table #{modalTable} on {modalDate}
          </CModalTitle>
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
    </div>
  );
};

export default TableUsageReport;
