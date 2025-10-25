import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CButton, CSpinner, CForm, CFormInput, CFormSelect } from '@coreui/react';
import { toast } from 'react-toastify';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import {
  addDeliveryTiming,
  deleteDeliveryTiming,
  fetchDeliveryTimings,
  updateDeliveryTimingStatus,
} from '../../redux/slices/deliveryTimingSlice';
import CommonModal from '../../components/CommonModal';

const DeliveryTiming = () => {
  const dispatch = useDispatch();
  const { deliveryTimings, isLoading, error } = useSelector((state) => state.deliveryTimings);
  const { restaurantId } = useSelector((state) => state.auth);

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTiming, setSelectedTiming] = useState(null);
  const token = localStorage.getItem("authToken");
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    delivery_status: '1',
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchDeliveryTimings({ token, restaurantId }));
    }
  }, [dispatch, token, restaurantId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ start_time: '', end_time: '', delivery_status: '1' });
    setModalVisible(false);
    setSelectedTiming(null);
  };

  const handleAddDeliveryTiming = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addDeliveryTiming({ ...formData, restaurantId, token })).unwrap();
      resetForm();
      dispatch(fetchDeliveryTimings({ token, restaurantId }));
      toast.success('Delivery timing added successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to add delivery timing.');
    }
  };

  const handleDeleteDeliveryTiming = async () => {
    try {
      await dispatch(deleteDeliveryTiming({ id: selectedTiming._id, token })).unwrap();
      setDeleteModalVisible(false);
      toast.success('Delivery timing deleted successfully!');
      dispatch(fetchDeliveryTimings({ token, restaurantId }));
    } catch (error) {
      toast.error(error.message || 'Failed to delete delivery timing.');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus ? false : true;
    try {
      await dispatch(updateDeliveryTimingStatus({ id, delivery_status: newStatus, token })).unwrap();
      toast.success('Status updated successfully!');
      dispatch(fetchDeliveryTimings({ token, restaurantId }));
    } catch (error) {
      toast.error(error.message || 'Failed to update status.');
    }
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const paginatedData = deliveryTimings?.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="px-2 sm:px-5" style={{ backgroundColor: 'var(--cui-body-bg)', minHeight: '100vh' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--cui-body-color)' }}>
          Delivery Timings
        </h2>
        <CButton 
          color="primary" 
          onClick={() => setModalVisible(true)} 
          disabled={isLoading}
          className="w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4 py-2"
          style={{
            fontSize: '0.875rem',
            padding: '8px 16px',
            minWidth: '120px',
          }}
        >
          Add Timing
        </CButton>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center"><CSpinner /></div>
      ) : (
        <>
          <div 
            className="overflow-x-auto rounded-lg shadow-md" 
            style={{ 
              backgroundColor: 'var(--cui-card-bg)',
              border: '1px solid var(--cui-border-color)'
            }}
          >
            <table className="table-auto w-full border-collapse">
              <thead style={{ backgroundColor: 'var(--cui-gray-100)' }}>
                <tr>
                  <th 
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                    style={{ 
                      borderBottom: '1px solid var(--cui-border-color)',
                      color: 'var(--cui-body-color)'
                    }}
                  >
                    Start Time
                  </th>
                  <th 
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                    style={{ 
                      borderBottom: '1px solid var(--cui-border-color)',
                      color: 'var(--cui-body-color)'
                    }}
                  >
                    End Time
                  </th>
                  <th 
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                    style={{ 
                      borderBottom: '1px solid var(--cui-border-color)',
                      color: 'var(--cui-body-color)'
                    }}
                  >
                    Status
                  </th>
                  <th 
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                    style={{ 
                      borderBottom: '1px solid var(--cui-border-color)',
                      color: 'var(--cui-body-color)'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData?.map((timing) => (
                  <tr 
                    key={timing._id} 
                    style={{ backgroundColor: 'var(--cui-card-bg)' }}
                    className="hover:bg-opacity-80"
                  >
                    <td 
                      className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                      style={{ 
                        borderBottom: '1px solid var(--cui-border-color)',
                        color: 'var(--cui-body-color)'
                      }}
                    >
                      {timing.start_time}
                    </td>
                    <td 
                      className="px-2 sm:px-4 py-2 text-xs sm:text-sm" 
                      style={{ 
                        borderBottom: '1px solid var(--cui-border-color)',
                        color: 'var(--cui-body-color)'
                      }}
                    >
                      {timing.end_time}
                    </td>
                    <td 
                      className="px-2 sm:px-4 py-2 text-center" 
                      style={{ borderBottom: '1px solid var(--cui-border-color)' }}
                    >
                      <CButton
                        color={timing.delivery_status ? 'success' : 'danger'}
                        onClick={() => handleStatusToggle(timing._id, timing.delivery_status)}
                        disabled={isLoading}
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                      >
                        {timing.delivery_status ? 'Active' : 'Inactive'}
                      </CButton>
                    </td>
                    <td 
                      className="px-2 sm:px-4 py-2 text-center" 
                      style={{ borderBottom: '1px solid var(--cui-border-color)' }}
                    >
                      <CButton
                        color="danger"
                        onClick={() => {
                          setSelectedTiming(timing);
                          setDeleteModalVisible(true);
                        }}
                        disabled={isLoading}
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                      >
                        Delete
                      </CButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center my-4">
            <Stack spacing={2}>
              <Pagination
                count={Math.ceil(deliveryTimings.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'var(--cui-body-color)',
                    fontSize: '0.75rem',
                    minWidth: '32px',
                    height: '32px',
                    '@media (min-width: 640px)': {
                      fontSize: '0.875rem',
                      minWidth: '40px',
                      height: '40px',
                    }
                  }
                }}
              />
            </Stack>
          </div>
        </>
      )}

      {/* Add Modal */}
      <CommonModal
        visible={modalVisible}
        onClose={resetForm}
        title="Add Delivery Timing"
        onConfirm={handleAddDeliveryTiming}
        confirmButtonText={isLoading ? <CSpinner size="sm" /> : 'Save'}
        confirmButtonColor="primary"
        isLoading={isLoading}
        formId="deliveryTimingForm"
      >
        <CForm id="deliveryTimingForm" onSubmit={handleAddDeliveryTiming}>
          <CFormInput
            type="time"
            label="Start Time"
            name="start_time"
            value={formData.start_time}
            onChange={handleInputChange}
            required
            className="mb-3"
          />
          <CFormInput
            type="time"
            label="End Time"
            name="end_time"
            value={formData.end_time}
            onChange={handleInputChange}
            required
            className="mb-3"
          />
          <CFormSelect
            label="Status"
            name="delivery_status"
            value={formData.delivery_status}
            onChange={handleInputChange}
            options={[
              { label: 'Active', value: '1' },
              { label: 'Inactive', value: '0' },
            ]}
            className="mb-3"
          />
        </CForm>
      </CommonModal>

      {/* Delete Modal */}
      <CommonModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Confirm Deletion"
        onConfirm={handleDeleteDeliveryTiming}
        confirmButtonText={isLoading ? <CSpinner size="sm" /> : 'Delete'}
        confirmButtonColor="danger"
        isLoading={isLoading}
      >
        Are you sure you want to delete this delivery timing?
      </CommonModal>
    </div>
  );
};

export default DeliveryTiming;
