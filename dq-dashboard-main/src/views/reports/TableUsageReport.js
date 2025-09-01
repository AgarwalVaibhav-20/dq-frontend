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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTable, setModalTable] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  // Fetch data effect
  useEffect(() => {
    if (restaurantId)
      dispatch(fetchTableUsageByDate({ token, startDate, endDate }));
  }, [dispatch, restaurantId, token, startDate, endDate]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(fetchTableUsageByDate({ token, startDate, endDate }));
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

  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Table Usage Report</h2>

      {/* Date range pickers */}
      <CRow className="align-items-end mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <CCol xs="auto">
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
        <CCol xs="auto">
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

      {/* Modal with transactions of the selected table & date */}
      <CModal size="xl" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>
            Transactions for {modalTable} on {modalDate}
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
