import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbacks } from '../../redux/slices/feedbackSlice';
import { CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';

const Feedback = () => {
  const dispatch = useDispatch();
  const { feedbacks, loading, error } = useSelector((state) => state.feedbacks);
  const restaurantId = useSelector((state) => state.auth.restaurantId);

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchFeedbacks(restaurantId));
    }
  }, [dispatch, restaurantId]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 className="mb-4">Customer Feedback</h2>
      {loading ? (
        <div className="d-flex justify-content-center">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Customer Name</CTableHeaderCell>
              <CTableHeaderCell>Phone Number</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>Feedback</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Date</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {feedbacks?.map((feedback, index) => (
              <CTableRow key={index}>
                <CTableDataCell>{feedback.customerName}</CTableDataCell>
                <CTableDataCell>{feedback.phoneNumber}</CTableDataCell>
                <CTableDataCell>{feedback.email || 'N/A'}</CTableDataCell>
                <CTableDataCell>{feedback.feedback || 'N/A'}</CTableDataCell>
                <CTableDataCell>{feedback.short || 'N/A'}</CTableDataCell>
                <CTableDataCell>{formatDate(feedback.date)}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  );
};

export default Feedback;