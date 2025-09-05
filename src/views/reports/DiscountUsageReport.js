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
} from '@coreui/react';
import CustomToolbar from '../../utils/CustomToolbar';
import { fetchDiscountUsageByDate } from '../../redux/slices/reportSlice';

const formatDate = (d) => d.toISOString().split('T')[0];

const DiscountUsageReport = () => {
  const dispatch = useDispatch();
  const { discountUsageByDate, loading } = useSelector((s) => s.reports);
  const { token } = useSelector((s) => s.auth);


  /* ---------------------- date pickers ---------------------- */
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 6);

  const [startDate, setStartDate] = useState(formatDate(lastMonth));
  const [endDate, setEndDate] = useState(formatDate(today));

  /* ---------------------- modal state ----------------------- */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);


  useEffect(() => {
  if (token) {
    dispatch(fetchDiscountUsageByDate({ token, startDate, endDate }));
  }
}, [dispatch, token]);
  /* ------------------ fetch on button click ----------------- */
  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(
      fetchDiscountUsageByDate({ token, startDate, endDate })
    );
  };

  /* ------------------ helpers & columns --------------------- */
  const currency = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // rows: one per date
  const rows = useMemo(
    () =>
      (discountUsageByDate || []).map((d, idx) => ({
        id: idx + 1,
        date: d.date,
        totalDiscount: d.totalDiscount,
        transactionCount: d.transactions.length,
        transactions: d.transactions,
      })),
    [discountUsageByDate]
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

      {/* main grid */}
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

      {/* modal */}
      <CModal size="xl" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>
            Transactions on {modalDate}
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

export default DiscountUsageReport;
