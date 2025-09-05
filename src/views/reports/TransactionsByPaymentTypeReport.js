import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CButton, CCol, CFormInput, CModal, CModalBody,
  CModalHeader, CModalTitle, CRow, CSpinner
} from '@coreui/react';
import { DataGrid } from '@mui/x-data-grid';
import { fetchTransactionsByPaymentType } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];
const currency = (n) => `₹${Number(n).toFixed(2)}`;

const TransactionsByPaymentTypeReport = () => {
  const dispatch = useDispatch();
  const { transactionsByPaymentType, loading } = useSelector((s) => s.reports);
  const { token } = useSelector((s) => s.auth);

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);

  const [startDate, setStartDate] = useState(formatDate(lastWeek));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTransactions, setModalTransactions] = useState([]);

  useEffect(() => {
    if (token) {
      dispatch(fetchTransactionsByPaymentType({ token, startDate, endDate }));
    }
  }, [dispatch, token]);

  const handleGenerate = () => {
    if (!startDate || !endDate) return alert("Both dates are required.");
    if (new Date(endDate) < new Date(startDate)) return alert("End date cannot be before start date.");
    dispatch(fetchTransactionsByPaymentType({ token, startDate, endDate }));
  };

  const rows = useMemo(() => {
    let counter = 1;
    return (transactionsByPaymentType || []).flatMap((entry) =>
      entry.paymentTypes.map((pt) => ({
        id: counter++,
        date: entry.date,
        paymentType: pt.paymentType,
        transactionCount: pt.transactionCount,
        transactions: pt.transactions,
      }))
    );
  }, [transactionsByPaymentType]);

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

  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Transactions by Payment Type</h2>

      <CRow className="mb-3 gap-3">
        <CCol xs="auto">
          <label className="form-label fw-bold">Start Date</label>
          <CFormInput
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol xs="auto">
          <label className="form-label fw-bold">End Date</label>
          <CFormInput
            type="date"
            value={endDate}
            min={startDate}
            max={formatDate(today)}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol xs="auto" className="pt-2">
          <CButton color="primary" onClick={handleGenerate}>
            Generate Report
          </CButton>
        </CCol>
      </CRow>

      {loading ? (
        <div className="text-center">
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
            '& .MuiDataGrid-columnHeaders': { fontWeight: 'bold', fontSize: '1.05rem' },
          }}
        />
      )}

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
    </div>
  );
};

export default TransactionsByPaymentTypeReport;
