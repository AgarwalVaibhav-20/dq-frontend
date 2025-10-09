import React, { useState, useEffect } from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CRow, CCol,
  CFormSelect,
  CCard,
  CCardBody,
  CSpinner,
  CForm,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../../redux/slices/subCategorySlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import { toast } from 'react-toastify'

export default function SubCategory() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [subCategoryName, setSubCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [editedSubCategory, setEditedSubCategory] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('All')
  const [dropdownOpen, setDropdownOpen] = useState({})

  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const { subCategories, loading: subCategoriesLoading } = useSelector((state) => state.subCategory)
  const { categories, loading: categoriesLoading } = useSelector((state) => state.category)
  
  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchSubCategories({ token, restaurantId }))
      dispatch(fetchCategories({ token, restaurantId }))
    }
  }, [dispatch, token, restaurantId])

  // ✅ Add Subcategory
  const handleAddSubCategory = async () => {
    if (!subCategoryName) {
      toast.error('Please provide all required fields.')
      return
    }

    try {
      await dispatch(
        createSubCategory({ sub_category_name: subCategoryName, categoryId, token })
      ).unwrap()
      dispatch(fetchSubCategories({ token, restaurantId }))
      setSubCategoryName('')
      setCategoryId('')
      setModalVisible(false)
      toast.success('Subcategory created successfully!')
    } catch (error) {
      toast.error(error || 'Failed to create subcategory.')
    }
  }

  // ✅ Edit Subcategory - FIX: Close dropdown after opening edit modal
  const handleEditSubCategory = (sub) => {
    setEditedSubCategory({
      ...sub,
      categoryId: sub.categoryId?._id || sub.categoryId,
    })
    setEditModalVisible(true)
    setDropdownOpen({}) // ✅ CLOSE ALL DROPDOWNS
  }

  const handleUpdateSubCategory = async () => {
    if (!editedSubCategory.sub_category_name || !editedSubCategory.categoryId) {
      toast.error('Please provide all required fields.')
      return
    }

    try {
      await dispatch(
        updateSubCategory({
          id: editedSubCategory._id || editedSubCategory.id, // ✅ Handle both _id and id
          sub_category_name: editedSubCategory.sub_category_name,
          categoryId: editedSubCategory.categoryId,
          token,
        })
      ).unwrap()
      dispatch(fetchSubCategories({ token, restaurantId }))
      setEditModalVisible(false)
      setEditedSubCategory({})
      toast.success('Subcategory updated successfully!')
    } catch (error) {
      toast.error(error || 'Failed to update subcategory.')
    }
  }

  // ✅ Delete Subcategory - FIX: Close dropdown after delete
  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return
    
    setDropdownOpen({}) // ✅ CLOSE ALL DROPDOWNS
    
    try {
      await dispatch(deleteSubCategory({ id, token })).unwrap()
      dispatch(fetchSubCategories({ token, restaurantId }))
      toast.success('Subcategory deleted successfully!')
    } catch (error) {
      toast.error(error || 'Failed to delete subcategory.')
    }
  }

  // ✅ Toggle dropdown menu - FIX: Prevent event bubbling
  const toggleDropdown = (id, e) => {
    e.stopPropagation() // ✅ PREVENT EVENT BUBBLING
    setDropdownOpen((prev) => ({ [id]: !prev[id] })) // ✅ ONLY ONE DROPDOWN OPEN AT A TIME
  }

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen({})
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // ✅ Filtered subcategories
  const filteredSubCategories = subCategories
    ?.filter((sub) => {
      if (filter === 'All') return true
      const createdAt = new Date(sub.created_at)
      const now = new Date()
      switch (filter) {
        case 'This week':
          return createdAt >= new Date(now.setDate(now.getDate() - 7))
        case 'This month':
          return createdAt.getMonth() === new Date().getMonth()
        case 'Last 3 Months':
          return createdAt >= new Date(now.setMonth(now.getMonth() - 3))
        default:
          return true
      }
    })
    .filter((sub) => sub.sub_category_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (categoriesLoading || subCategoriesLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <CSpinner className="m-auto" />
      </div>
    )
  }

  // ✅ Mobile Responsive Add Modal
  const AddSubCategoryModal = () => (
    <CModal 
      visible={modalVisible} 
      onClose={() => setModalVisible(false)}
      size="lg"
      className="modal-fullscreen-sm-down"
    >
      <CModalHeader className="border-bottom">
        <h5 className="mb-0">Add New Subcategory</h5>
      </CModalHeader>
      <CModalBody className="p-4">
        <div className="mb-3">
          <label className="form-label fw-semibold">Subcategory Name</label>
          <CFormInput
            type="text"
            placeholder="Enter subcategory name"
            name="sub_category_name"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            size="lg"
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Category</label>
          <CFormSelect
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            size="lg"
          >
            <option value="" disabled hidden>
              Choose a category
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.categoryName}
              </option>
            ))}
          </CFormSelect>
        </div>
      </CModalBody>
      <CModalFooter className="border-top d-flex flex-column flex-sm-row gap-2">
        <CButton 
          color="secondary" 
          onClick={() => setModalVisible(false)}
          className="w-100 w-sm-auto"
          size="lg"
        >
          Cancel
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleAddSubCategory} 
          disabled={subCategoriesLoading}
          className="w-100 w-sm-auto"
          size="lg"
        >
          {subCategoriesLoading ? (
            <>
              <CSpinner as="span" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            'Save Subcategory'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  // ✅ Mobile Responsive Edit Modal
  const EditSubCategoryModal = () => (
    <CModal 
      visible={editModalVisible} 
      onClose={() => setEditModalVisible(false)}
      size="lg"
      className="modal-fullscreen-sm-down"
    >
      <CModalHeader className="border-bottom">
        <h5 className="mb-0">Edit Subcategory</h5>
      </CModalHeader>
      <CModalBody className="p-4">
        <CForm>
          <div className="mb-3">
            <label className="form-label fw-semibold">Subcategory Name</label>
            <CFormInput
              type="text"
              name="sub_category_name"
              value={editedSubCategory.sub_category_name || ''}
              onChange={(e) =>
                setEditedSubCategory((prev) => ({ ...prev, sub_category_name: e.target.value }))
              }
              size="lg"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Category</label>
            <CFormSelect
              value={editedSubCategory.categoryId || ''}
              name="categoryId"
              onChange={(e) =>
                setEditedSubCategory((prev) => ({ ...prev, categoryId: e.target.value }))
              }
              size="lg"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.categoryName}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter className="border-top d-flex flex-column flex-sm-row gap-2">
        <CButton 
          color="secondary" 
          onClick={() => setEditModalVisible(false)}
          className="w-100 w-sm-auto"
          size="lg"
        >
          Cancel
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleUpdateSubCategory}
          className="w-100 w-sm-auto"
          size="lg"
        >
          {subCategoriesLoading ? (
            <>
              <CSpinner as="span" size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            'Save Changes'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  return (
    <div className="p-3 p-md-4">
      {/* Mobile Responsive Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h1 className="fs-4 fw-semibold mb-3 mb-md-0">My Subcategories</h1>
        <CButton 
          color="primary" 
          onClick={() => setModalVisible(true)}
          className="w-100 w-md-auto"
          size="sm"
        >
          Add Subcategory
        </CButton>
      </div>

      {/* Mobile Responsive Search & Filter */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <CFormInput
          placeholder="Search subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-fill"
          size="sm"
        />
        <CFormSelect 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="w-100 w-md-auto"
          size="sm"
        >
          <option value="All">All</option>
          <option value="This week">This Week</option>
          <option value="This month">This Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </CFormSelect>
      </div>

      {/* Mobile Responsive Subcategories Grid */}
      <CRow className="g-3">
        {filteredSubCategories.map((sub) => (
          <CCol key={sub._id || sub.id} xs="12" sm="6" lg="4" xl="3" className="d-flex">
            <CCard className="shadow-sm border rounded flex-fill w-100">
              <CCardBody className="d-flex flex-column justify-content-between h-100 p-3">
                <div>
                  <h5 className="fw-bold mb-2 text-truncate" title={sub.sub_category_name}>
                    {sub.sub_category_name}
                  </h5>
                  <small className="text-muted d-block text-truncate">
                    Category: {sub.categoryName || 'No category'}
                  </small>
                </div>
                <div className="position-relative mt-3 text-end">
                  <CButton
                    color="light"
                    className="p-1 border-0 rounded-circle"
                    style={{ fontSize: '18px', width: '32px', height: '32px' }}
                    onClick={(e) => toggleDropdown(sub._id || sub.id, e)}
                  >
                    &#8942;
                  </CButton>
                  {dropdownOpen[sub._id || sub.id] && (
                    <div
                      className="dropdown-menu show position-absolute"
                      style={{ right: 0, zIndex: 1000, minWidth: '120px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        className="dropdown-item py-2" 
                        onClick={() => handleEditSubCategory(sub)}
                      >
                        <i className="fas fa-edit me-2"></i>Edit
                      </button>
                      <button
                        className="dropdown-item text-danger py-2"
                        onClick={() => handleDeleteSubCategory(sub._id || sub.id)}
                      >
                        <i className="fas fa-trash me-2"></i>Delete
                      </button>
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {AddSubCategoryModal()}
      {EditSubCategoryModal()}
    </div>
  )
}