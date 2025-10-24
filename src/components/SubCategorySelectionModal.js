// src/components/SubCategorySelectionModal.js

import React, { useState, useEffect } from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CFormSelect, CRow, CCol } from '@coreui/react';

const SubCategorySelectionModal = ({
  visible,
  onClose,
  menuItem, // The menu item that was clicked (e.g., Pizza)
  subCategories, // All available subcategories (e.g., [{id: 1, sub_category_name: 'Small'}, {id: 2, sub_category_name: 'Medium'}])
  onAddToCartWithSubcategory, // Function to call when an item with subcategory is selected
}) => {
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');

  // Filter subcategories relevant to the current menuItem's category
  // Assuming menuItem has a 'categoryId' property
  const relevantSubcategories = subCategories?.filter(
    (sub) => sub.category_id === menuItem?.categoryId
  ) || [];

  useEffect(() => {
    // Reset selected subcategory when modal opens for a new item
    if (visible && menuItem) {
      setSelectedSubcategoryId(''); // Reset selection when modal becomes visible for a new item
      // Optionally, if an item has a default sub_category, you can pre-select it
      // if (menuItem.sub_category) {
      //   setSelectedSubcategoryId(menuItem.sub_category);
      // }
    }
  }, [visible, menuItem]);

  const handleAdd = () => {
    if (!selectedSubcategoryId) {
      alert('Please select a subcategory.');
      return;
    }

    // Find the full subcategory object
    const selectedSubcategory = relevantSubcategories.find(
      (sub) => sub.id === Number(selectedSubcategoryId)
    );

    if (selectedSubcategory) {
      // Create a new item object with subcategory details
      const itemToAdd = {
        ...menuItem,
        selectedSubcategoryId: selectedSubcategory.id,
        selectedSubcategoryName: selectedSubcategory.sub_category_name,
        // You might want to adjust price based on subcategory here if your logic supports it
        // For now, assuming price is from menuItem and subcategory is just a tag.
      };
      onAddToCartWithSubcategory(itemToAdd);
      onClose(); // Close the modal after adding
    }
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Select {menuItem?.itemName} Option</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="mb-3">
          <CCol xs={12}>
            <p className="fw-bold">Item: {menuItem?.itemName}</p>
            <p className="mb-3">Price: ₹{menuItem?.price}</p>
          </CCol>
          <CCol xs={12}>
            <CFormSelect
              label="Select Subcategory"
              value={selectedSubcategoryId}
              onChange={(e) => setSelectedSubcategoryId(e.target.value)}
              required
            >
              <option value="">Choose an option...</option>
              {relevantSubcategories && relevantSubcategories.length > 0 ? relevantSubcategories.map((sub, index) => (
                <option key={sub.id || `sub-${index}`} value={sub.id}>
                  {sub.sub_category_name}
                </option>
              )) : (
                <option value="" disabled>No subcategories available</option>
              )}
            </CFormSelect>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleAdd}>
          Add to Cart
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default SubCategorySelectionModal;