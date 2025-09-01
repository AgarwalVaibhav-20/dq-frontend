import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CRow, CCol, CFormInput, CFormSelect } from '@coreui/react';
import { cilPlus, cilMinus } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

const EditStockModal = ({
  visible,
  onClose,
  stockItems,
  setStockItems, // Pass the setter function for stockItems
  inventories,
  onSubmit, // Pass onSubmit function to handle API update
}) => {
  // Handle changes in stock items
  const handleStockChange = (index, field, value) => {
    const updatedStockItems = stockItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setStockItems(updatedStockItems); // Update stockItems in the parent component
  };

  // Add a new stock section
  const addStockSection = () => {
    setStockItems([...stockItems, { stockId: '', quantity: '' }]); // Add a new stock item
  };

  // Remove a stock section
  const removeStockSection = (index) => {
    const updatedStockItems = stockItems.filter((_, i) => i !== index);
    setStockItems(updatedStockItems); // Remove the stock item
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(stockItems); // Pass updated stockItems to the parent component
    onClose(); // Close the modal
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Edit Stock</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {stockItems.map((stock, index) => (
          <CRow key={index} className="align-items-center mb-3">
            <CCol xs={5}>
              <CFormSelect
                value={stock.stockId}
                onChange={(e) => handleStockChange(index, 'stockId', e.target.value)}
                required
              >
                <option value="">Select Inventory</option>
                {inventories?.map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.itemName}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={4}>
              <CFormInput
                type="number"
                value={stock.quantity}
                onChange={(e) => handleStockChange(index, 'quantity', e.target.value)}
                placeholder="Quantity"
                required
              />
            </CCol>
            <CCol xs={3}>
              <CButton
                color="danger"
                size="sm"
                onClick={() => removeStockSection(index)}
              >
                <CIcon icon={cilMinus} />
              </CButton>
            </CCol>
          </CRow>
        ))}
        <CButton color="success" onClick={addStockSection}>
          <CIcon icon={cilPlus} /> Add Stock
        </CButton>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleSubmit}>
          Submit
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default EditStockModal;