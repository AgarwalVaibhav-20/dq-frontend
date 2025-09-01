import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CButton, CCol, CFormInput, CModal, CModalBody, CModalHeader, CModalTitle, CRow, CSpinner } from '@coreui/react';
import { DataGrid } from '@mui/x-data-grid';
import { fetchMostOrderedDishes } from '../../redux/slices/reportSlice';
import CustomToolbar from '../../utils/CustomToolbar';

const formatDate = (d) => d.toISOString().split('T')[0];

function MostOrderedDishesReport() {
  const dispatch = useDispatch();
  const { mostOrderedDishes, loading } = useSelector((s) => s.reports);
  const { token } = useSelector((s) => s.auth);

  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 6);

  const [startDate, setStartDate] = useState(formatDate(lastMonth));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalDishes, setModalDishes] = useState([]);

  useEffect(() => {
    if (token) {
      dispatch(fetchMostOrderedDishes({ token, startDate, endDate }));
    }
  }, [dispatch, token]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) return alert('Please select both dates');
    if (new Date(endDate) < new Date(startDate))
      return alert('End date cannot be before start date');
    dispatch(fetchMostOrderedDishes({ token, startDate, endDate }));
  };

  const rows = useMemo(
    () =>
      (mostOrderedDishes || []).map((entry, index) => ({
        id: index + 1,
        date: entry.date,
        itemCount: entry.dishes.length,
        dishes: entry.dishes,
      })),
    [mostOrderedDishes]
  );

  const columns = [
    { field: 'id', headerName: 'S.No.', width: 80 },
    { field: 'date', headerName: 'Date', flex: 1 },
    {
      field: 'itemCount',
      headerName: 'Item Count',
      flex: 1,
    },
    {
      field: 'details',
      headerName: 'View Dishes',
      flex: 1.3,
      renderCell: (params) => (
        <CButton
          size="sm"
          color="info"
          onClick={() => {
            setModalDate(params.row.date);
            setModalDishes(params.row.dishes);
            setModalVisible(true);
          }}
        >
          View
        </CButton>
      ),
    },
  ];

  const modalColumns = [
    { field: 'itemId', headerName: 'Item ID', flex: 1 },
    { field: 'itemName', headerName: 'Item Name', flex: 1.5 },
    { field: 'totalQuantity', headerName: 'Quantity Ordered', flex: 1 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2 className="mb-4">Most Ordered Dishes Report</h2>

      <CRow className="align-items-end mb-3" style={{ gap: '1rem', flexWrap: 'wrap' }}>
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
          <CButton color="primary" onClick={handleGenerateReport}>
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
            '& .MuiDataGrid-columnHeaders': {
              fontWeight: 700,
              fontSize: '1.05rem',
            },
          }}
        />
      )}

      <CModal size="lg" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Top Dishes on {modalDate}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={{ height: 400 }}>
            <DataGrid
              rows={modalDishes.map((dish, i) => ({ id: i + 1, ...dish }))}
              columns={modalColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </div>
        </CModalBody>
      </CModal>
    </div>
  );
}

export default MostOrderedDishesReport;
