// TaxCollectedReport.js
// ---------------------------------------------------------------
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
} from '@coreui/react';
import { fetchAllTransactions } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];

const TaxCollectedReport = () => {
  const dispatch = useDispatch();
  const { allTransactions, loading } = useSelector((s) => s.reports);
  // const { restaurantId, token } = useSelector((s) => s.auth);
  const restaurantId = localStorage.getItem('restaurantId');
  const token = localStorage.getItem('authToken')
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

  /* ------------------------------ fetch data ------------------------------ */
  useEffect(() => {
    if (restaurantId && token)
      dispatch(fetchAllTransactions({ restaurantId, token }));
  }, [dispatch, restaurantId, token]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(fetchAllTransactions({ restaurantId, token }));
  };

  // Process transactions to calculate tax collection by date
  const transactions = Array.isArray(allTransactions) ? allTransactions : []
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return transactionDate >= start && transactionDate <= end
  })

  const taxData = filteredTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.createdAt).toLocaleDateString()
    const taxAmount = transaction.tax_amount || 0

    if (!acc[date]) {
      acc[date] = {
        date,
        totalTax: 0,
        transactions: []
      }
    }
    acc[date].totalTax += taxAmount
    
    // FIXED: Match the field names with modalColumns
    acc[date].transactions.push({
      id: transaction._id,
      tableNumber: transaction.tableNumber || 'N/A',
      userId: transaction.customerId?.name || transaction.username || 'N/A',
      type: transaction.type || 'N/A',
      sub_total: transaction.sub_total || 0,
      discount: transaction.discount || 0,
      tax: transaction.tax_amount || taxAmount,
      total: transaction.total || 0,
      note: transaction.note || '',
      created_at: transaction.createdAt
    })

    return acc
  }, {})

  const rows = Object.values(taxData).map((item, index) => ({
    id: index + 1,
    date: item.date,
    totalTax: item.totalTax,
    transactions: item.transactions
  }))

  /* ---------------------------- column helpers ---------------------------- */
  const currency = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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
    { field: 'id', headerName: 'S.No.', width: 190 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.7 },
    { field: 'userId', headerName: 'Customer', flex: 1 },
    {
      field: 'type',
      headerName: 'Payment Type',
      flex: 1,
    },
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
    {
      field: 'note',
      headerName: 'Note',
      flex: 1.2,
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1.4,
      valueGetter: (p) => p.row.created_at ? new Date(p.row.created_at).toLocaleString() : 'N/A',
    },
  ];

  /* -------------------------------- render -------------------------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Tax Collected Report</h2>

      {/* date-range controls */}
      <CRow className="align-items-end mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <CCol xs="auto">
          <label htmlFor="start" className="form-label fw-bold">
            Start&nbsp;Date
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
          <label htmlFor="end" className="form-label fw-bold">
            End&nbsp;Date
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

      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={mainColumns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            components={{ Toolbar: CustomToolbar }}
            sx={{
              backgroundColor: '#fff',
              '& .hdr': { fontWeight: 700, fontSize: '1.05rem' },
            }}
          />
        </div>
      )}

      {/* ──────────────── transactions modal ──────────────── */}
      <CModal size="xl" visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Transactions on {modalDate}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={{ height: 450 }}>
            <DataGrid
              rows={modalRows}
              columns={modalColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </div>
        </CModalBody>
      </CModal>
    </div>
  );
};

export default TaxCollectedReport;