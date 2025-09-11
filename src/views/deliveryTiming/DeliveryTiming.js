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
  const rowsPerPage = 5; // change as needed

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

  // Pagination logic
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const paginatedData = deliveryTimings?.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="px-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold">Delivery Timings</h2>
        <CButton color="primary" onClick={() => setModalVisible(true)} disabled={isLoading}>
          Add Timing
        </CButton>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center"><CSpinner /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="table-auto w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border px-4 py-2">Start Time</th>
                  <th className="border px-4 py-2">End Time</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData?.map((timing) => (
                  <tr key={timing._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{timing.start_time}</td>
                    <td className="border px-4 py-2">{timing.end_time}</td>
                    <td className="border px-4 py-2 text-center">
                      <CButton
                        color={timing.delivery_status ? 'success' : 'danger'}
                        onClick={() => handleStatusToggle(timing._id, timing.delivery_status)}
                        disabled={isLoading}
                        size="sm"
                      >
                        {timing.delivery_status ? 'Active' : 'Inactive'}
                      </CButton>
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <CButton
                        color="danger"
                        onClick={() => {
                          setSelectedTiming(timing);
                          setDeleteModalVisible(true);
                        }}
                        disabled={isLoading}
                        size="sm"
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
