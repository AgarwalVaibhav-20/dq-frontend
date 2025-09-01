import React from 'react'
import { CFormInput, CFormSelect, CFormLabel, CButton } from '@coreui/react'

const EditMenuItem = ({
  formData,
  handleInputChange,
  handleImageChange,
  categories,
  subCategories,
  previewImage,
  isEdit = false,
}) => {
  const filteredSubCategories = subCategories?.filter(
    (sub) => sub.category_id === Number(formData.categoryId),
  )
  return (
    <div className="p-3">
      <div className="mb-3">
        <CFormLabel>Item Name</CFormLabel>
        <CFormInput
          type="text"
          name="itemName"
          value={formData.itemName}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <CFormLabel>Category</CFormLabel>
        <CFormSelect name="categoryId" value={formData.categoryId} onChange={handleInputChange}>
          <option value="">Select Category</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </CFormSelect>
      </div>

      <div>
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
      </div>

      <div className="mb-3">
        <CFormLabel>Price</CFormLabel>
        <CFormInput
          type="text"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <CFormLabel>Item Image</CFormLabel>
        <CFormInput type="file" accept="image/*" onChange={handleImageChange} />
        {previewImage && (
          <div className="mt-2">
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '200px', maxHeight: '200px' }}
            />
          </div>
        )}
      </div>

      {isEdit && (
        <div className="text-muted small mt-3">
          Note: Leave image field empty to keep existing image
        </div>
      )}
    </div>
  )
}

export default EditMenuItem
