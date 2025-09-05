import React from 'react'
import { CForm, CFormInput, CFormSelect, CRow, CCol, CButton } from '@coreui/react'

const MenuItemForm = ({
  formData,
  handleInputChange,
  handleImageChange,
  handleStockChange,
  addStockField,
  categories,
  subCategories,
  inventories,
  previewImage,
  onSubmit,
  formId
}) => {

  const handleFormSubmit = (event) => {
    event.preventDefault();
    onSubmit(); 
  };

  // Filter subcategories based on selected category
  const filteredSubCategories = subCategories?.filter(
  (sub) => sub.category_id === Number(formData.categoryId)
);

  return (
    <CForm id={formId} onSubmit={handleFormSubmit}>
      <CFormInput
        type="text"
        name="itemName"
        label="Item Name"
        value={formData.itemName}
        onChange={handleInputChange}
        placeholder="Enter item name"
        required
        id="validationDefault01"
      />

      <CFormSelect
        name="categoryId"
        label="Category Name"
        value={formData.categoryId}
        onChange={handleInputChange}
        required
      >
        <option value="">Select a category</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.categoryName}
          </option>
        ))}
      </CFormSelect>

      <CFormSelect
        name="sub_category"
        label="Subcategory"
        value={formData.sub_category}
        onChange={handleInputChange}
        required
        disabled={!formData.categoryId}
      >
        <option value="">Select a subcategory</option>
        {filteredSubCategories?.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.sub_category_name}
          </option>
        ))}
      </CFormSelect>

      <CFormInput
        type="file"
        label="Item Image"
        onChange={handleImageChange}
        accept="image/*"
      />
      {previewImage && (
        <img
          src={previewImage}
          alt="Preview"
          className="img-thumbnail mt-2"
          style={{ height: '100px' }}
        />
      )}
      <CFormInput
        type="number"
        name="price"
        label="Price"
        value={formData.price}
        onChange={handleInputChange}
        placeholder="Enter price"
        required
      />

      {formData?.stockItems?.map((stock, index) => (
        <CRow key={index} className="align-items-center mb-2">
          <CCol xs={6}>
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
          <CCol xs={2}>
            {index === formData.stockItems.length - 1 && (
              <CButton color="success" onClick={addStockField}>
                Add
              </CButton>
            )}
          </CCol>
        </CRow>
      ))}
    </CForm>
  )
}

export default MenuItemForm
