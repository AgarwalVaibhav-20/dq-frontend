import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';

const DeleteModal = ({ showDeleteModal, cancelDelete, confirmDelete }) => {
  return (
    <CModal visible={showDeleteModal} onClose={cancelDelete}>
      <CModalHeader>
        <CModalTitle>Confirm Deletion</CModalTitle>
      </CModalHeader>
      <CModalBody>Are you sure you want to delete this item from the cart?</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={cancelDelete}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={confirmDelete}>
          Delete
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DeleteModal;