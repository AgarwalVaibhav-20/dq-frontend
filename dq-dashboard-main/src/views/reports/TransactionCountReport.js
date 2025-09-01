// TransactionCountReport.js
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
import { fetchTransactionCountByDate } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];

const TransactionCountReport = () => {
  const dispatch = useDispatch();
  const { transactionCountByDate, loading } = useSelector((s) => s.reports);
  const { restaurantId, token } = useSelector((s) => s.auth);

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
    if (restaurantId)
      dispatch(fetchTransactionCountByDate({ token, startDate, endDate }));
  }, [dispatch, restaurantId, token, startDate, endDate]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates.');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date.');

    dispatch(fetchTransactionCountByDate({ token, startDate, endDate }));
  };

  /* ---------------------------- column helpers ---------------------------- */
  const currency = (n) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  /* ------------------------- MAIN grid: columns --------------------------- */
  const mainColumns = useMemo(
    () => [
      { field: 'id', headerName: 'S.No.', width: 90, headerClassName: 'hdr' },
      { field: 'date', headerName: 'Date', flex: 1.1, headerClassName: 'hdr' },
      {
        field: 'transactionCount',
        headerName: 'Total Tx',
        flex: 0.9,
        headerClassName: 'hdr',
      },
      {
        field: 'tablePreview',
        headerName: 'Tables (Preview)',
        flex: 1.5,
        headerClassName: 'hdr',
        valueGetter: (p) => p.row.tablePreview,
      },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        flex: 1.1,
        headerClassName: 'hdr',
        valueGetter: (p) => currency(p.row.totalAmount),
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
    { field: 'id', headerName: 'Id', width: 60 },
    { field: 'tableNumber', headerName: 'Table', flex: 0.6 },
    { field: 'user_id', headerName: 'User', flex: 0.6 },
    {
      field: 'payment_type',
      headerName: 'Pay Type',
      flex: 0.8,
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 0.8,
      valueGetter: (p) => currency(p.row.total),
    },
    {
      field: 'discount',
      headerName: 'Disc.',
      flex: 0.7,
      valueGetter: (p) => currency(p.row.discount),
    },
    {
      field: 'tax',
      headerName: 'Tax',
      flex: 0.6,
      valueGetter: (p) => currency(p.row.tax),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1.4,
      valueGetter: (p) => new Date(p.row.created_at).toLocaleString(),
    },
  ];

  /* ----------------------------- row mapping ------------------------------ */
  const rows = useMemo(
    () =>
      (transactionCountByDate || []).map((r, i) => {
        const tables = [
          ...new Set(r.transactions.map((t) => t.tableNumber).filter(Boolean)),
        ];
        const totalAmount = r.transactions.reduce(
          (sum, t) => sum + parseFloat(t.total || 0),
          0
        );

        return {
          id: i + 1,
          ...r,
          tablePreview:
            tables.length > 3
              ? `${tables.slice(0, 3).join(', ')} …(+${tables.length - 3})`
              : tables.join(', ') || 'N/A',
          totalAmount,
        };
      }),
    [transactionCountByDate]
  );

  /* -------------------------------- render -------------------------------- */
  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Transaction Count Report</h2>

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
      <CModal size="lg" visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Transactions on {modalDate}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={{ height: 400 }}>
            <DataGrid
              rows={modalRows}
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

export default TransactionCountReport;
