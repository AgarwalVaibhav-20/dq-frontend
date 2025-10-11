import React, { useState, useEffect } from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CContainer,
  CRow,
  CCol,
  CFormSelect,
  CCard,
  CCardImage,
  CCardBody,
  CForm,
  CSpinner,
  CCarousel,
  CCarouselItem,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../../redux/slices/bannerSlice'
import { toast } from 'react-toastify'

export default function Banner() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [bannerData, setBannerData] = useState({
    banner_1: null,
    banner_2: null,
    banner_3: null,
  })
  const [editedBanner, setEditedBanner] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('All')
  const [dropdownOpen, setDropdownOpen] = useState({})

  const dispatch = useDispatch()
  const { banners, loading, loadingUpdate } = useSelector((state) => state.banner)
  const token = localStorage.getItem('authToken')
  const restaurantId = localStorage.getItem('restaurantId');

  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchBanners({ token, restaurantId }))
    }
  }, [dispatch, token, restaurantId])

  // NEW: Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click target is outside of any element with the 'dropdown-container' class
      if (!event.target.closest('.dropdown-container')) {
        setDropdownOpen({}) // Close all dropdowns
      }
    }

    // Add listener only if a dropdown is open
    if (Object.values(dropdownOpen).some(Boolean)) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])


  const filteredBanners = (banners || [])
    .filter((banner) => banner && typeof banner === 'object')
    .filter((banner) => {
      if (filter === 'All') return true

      const createdAt = new Date(banner.createdAt || banner.created_at)
      const now = new Date()

      switch (filter) {
        case 'This week':
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return createdAt >= weekAgo
        case 'This month':
          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
        case 'Last 3 Months':
          const threeMonthsAgo = new Date(now)
          threeMonthsAgo.setMonth(now.getMonth() - 3)
          return createdAt >= threeMonthsAgo
        default:
          return true
      }
    })
    // UPDATED: Enhanced search filter logic
    .filter((banner) => {
      if (!searchTerm) return true
      const lowerCaseSearchTerm = searchTerm.toLowerCase()

      // Check URLs
      const urls = [banner.banner_1, banner.banner_2, banner.banner_3].filter(Boolean)
      const urlMatch = urls.some((url) =>
        url && url.toLowerCase().includes(lowerCaseSearchTerm)
      )
      if (urlMatch) return true

      // Check Restaurant ID
      const restaurantIdStr = banner.restaurantId || ''
      const restaurantIdMatch = restaurantIdStr.toString().toLowerCase().includes(lowerCaseSearchTerm)
      
      return restaurantIdMatch
    })

  const handleAddBanner = async () => {
    if (!bannerData.banner_1) {
      toast.error('Please upload the first banner image (banner_1) as it is required.')
      return
    }

    try {
      const resultAction = await dispatch(createBanner({
        banner_1: bannerData.banner_1,
        banner_2: bannerData.banner_2,
        banner_3: bannerData.banner_3,
        token,
        restaurantId
      }))

      if (createBanner.fulfilled.match(resultAction)) {
        setBannerData({ banner_1: null, banner_2: null, banner_3: null })
        setModalVisible(false)
        dispatch(fetchBanners({ token, restaurantId }))
      }
    } catch (error) {
      console.log(error, "banner creation error")
      console.error('Error creating banner:', error)
    }
  }

  const handleEditBanner = (banner) => {
    setEditedBanner({ ...banner })
    setEditModalVisible(true)
  }

  const handleUpdateBanner = async () => {
    if (
      !editedBanner.banner_1 &&
      !editedBanner.banner_2 &&
      !editedBanner.banner_3
    ) {
      toast.error('Please upload at least one banner image.')
      return
    }

    try {
      const payload = {
        id: editedBanner._id || editedBanner.id,
        banner_1: editedBanner.banner_1,
        banner_2: editedBanner.banner_2,
        banner_3: editedBanner.banner_3,
        token,
        restaurantId
      }

      const resultAction = await dispatch(updateBanner(payload))

      if (updateBanner.fulfilled.match(resultAction)) {
        setEditModalVisible(false)
        setEditedBanner({})
        dispatch(fetchBanners({ token, restaurantId }))
      }
    } catch (error) {
      console.error('Error updating banner:', error)
    }
  }

  const handleDeleteBanner = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        const resultAction = await dispatch(deleteBanner({ id, token, restaurantId }))
        if (deleteBanner.fulfilled.match(resultAction)) {
          dispatch(fetchBanners({ token, restaurantId }))
        }
      } catch (error) {
        console.error('Error deleting banner:', error)
      }
    }
  }

  // UPDATED: Toggle function now ensures only one dropdown is open at a time
  const toggleDropdown = (id) => {
    setDropdownOpen(prev => ({
      [id]: !prev[id]
    }));
  };

  const handleFileChange = (e, bannerKey, isEdit = false) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, JPG, PNG, and WebP files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB.')
      return
    }

    if (isEdit) {
      setEditedBanner((prev) => ({
        ...prev,
        [bannerKey]: file,
      }))
    } else {
      setBannerData((prev) => ({
        ...prev,
        [bannerKey]: file,
      }))
    }
  }

  if (loading && !banners.length) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <CSpinner className="m-auto" />
      </div>
    )
  }

  const AddBannerModal = () => (
    <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
      <CModalHeader>
        <h5>Add New Banner</h5>
      </CModalHeader>
      <CModalBody>
        <CForm>
          {['banner_1', 'banner_2', 'banner_3'].map((key) => (
            <div key={key} className="mb-3">
              <label htmlFor={key} className="form-label">
                {key.replace('_', ' ').toUpperCase()} {key === 'banner_1' && <span className="text-danger">*</span>}
              </label>
              <CFormInput
                id={key}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, key)}
              />
              {bannerData[key] && (
                <img
                  src={URL.createObjectURL(bannerData[key])}
                  alt="preview"
                  className="img-fluid rounded mt-2"
                  style={{ maxHeight: '150px', objectFit: 'cover' }}
                />
              )}
            </div>
          ))}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setModalVisible(false)}>
          Close
        </CButton>
        <CButton color="primary" onClick={handleAddBanner} disabled={loading}>
          {loading ? <CSpinner as="span" size="sm" aria-hidden="true" /> : 'Save'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  const EditBannerModal = () => (
    <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
      <CModalHeader>
        <h5>Edit Banner</h5>
      </CModalHeader>
      <CModalBody>
        <CForm>
          {['banner_1', 'banner_2', 'banner_3'].map((key) => (
            <div key={key} className="mb-3">
              <label htmlFor={'edit_' + key} className="form-label">
                {key.replace('_', ' ').toUpperCase()}
              </label>
              <CFormInput
                id={'edit_' + key}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, key, true)}
              />
              {editedBanner[key] && (
                <img
                  src={
                    editedBanner[key] instanceof File
                      ? URL.createObjectURL(editedBanner[key])
                      : editedBanner[key]
                  }
                  alt="preview"
                  className="img-fluid rounded mt-2"
                  style={{ maxHeight: '150px', objectFit: 'cover' }}
                />
              )}
            </div>
          ))}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleUpdateBanner} disabled={loadingUpdate}>
          {loadingUpdate ? <CSpinner as="span" size="sm" aria-hidden="true" /> : 'Save Changes'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  return (
    <div className="p-2 p-md-4">
      {/* Mobile Responsive Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h1 className="fs-4 fw-semibold mb-2 mb-md-0">Banners ({filteredBanners.length})</h1>
        <div className="d-flex justify-content-end">
          <CButton 
            color="primary" 
            onClick={() => setModalVisible(true)}
            className="w-100 w-md-auto"
            size="sm"
            style={{ 
              fontSize: '0.875rem', 
              padding: '0.375rem 0.75rem',
              minWidth: 'auto'
            }}
          >
            Add Banner
          </CButton>
        </div>
      </div>

      {/* Mobile Responsive Search and Filter */}
      <div className="d-flex flex-column flex-md-row mb-4 gap-2">
        {/* UPDATED: Search input placeholder */}
        <CFormInput
          placeholder="Search by URL or Restaurant ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow-1"
          style={{ minWidth: '200px' }}
        />
        <CFormSelect 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="w-100 w-md-auto"
          style={{ minWidth: '150px' }}
        >
          <option value="All">All</option>
          <option value="This week">This Week</option>
          <option value="This month">This Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </CFormSelect>
      </div>

      {filteredBanners.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No banners found. Click "Add Banner" to create your first banner.</p>
        </div>
      ) : (
        <CRow>
          {filteredBanners.map((banner) => (
            <CCol key={banner._id || banner.id} xs="12" sm="6" md="4" lg="3" className="mb-4">
              <CCard className="shadow-sm border rounded h-100">
                {(() => {
                  const images = [banner.banner_1, banner.banner_2, banner.banner_3].filter(Boolean)

                  if (images.length === 0) {
                    return (
                      <div className="d-flex align-items-center justify-content-center" style={{ height: '150px', backgroundColor: '#f8f9fa' }}>
                        <span className="text-muted">No images</span>
                      </div>
                    )
                  }

                  if (images.length === 1) {
                    return (
                      <CCardImage
                        src={images[0]}
                        alt="Banner"
                        className="img-fluid"
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                    )
                  }

                  return (
                    <CCarousel controls indicators transition="crossfade" style={{ height: '150px' }}>
                      {images.map((url, idx) => (
                        <CCarouselItem key={idx}>
                          <img
                            src={url}
                            className="d-block w-100"
                            alt={`Banner ${idx + 1}`}
                            style={{ height: '150px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg=='
                            }}
                          />
                        </CCarouselItem>
                      ))}
                    </CCarousel>
                  )
                })()}
                <CCardBody className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1">
                      <strong>ID:</strong> {banner.restaurantId || 'N/A'}
                    </p>
                    <p className="mb-0 text-muted small">
                      Created: {new Date(banner.createdAt || banner.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {/* UPDATED: Added a wrapper div with a class for the click-outside logic */}
                  <div className="position-relative dropdown-container">
                    <CButton
                      color="light"
                      className="p-0 border-0"
                      style={{ fontSize: '20px' }}
                      onClick={() => toggleDropdown(banner._id || banner.id)}
                    >
                      &#8942;
                    </CButton>
                    {dropdownOpen[banner._id || banner.id] && (
                      <div className="dropdown-menu show position-absolute" style={{ right: 0, zIndex: 1000 }}>
                        <button className="dropdown-item" onClick={() => {
                          handleEditBanner(banner)
                          toggleDropdown(banner._id || banner.id)
                        }}>
                          Edit
                        </button>
                        <button className="dropdown-item text-danger" onClick={() => {
                          handleDeleteBanner(banner._id || banner.id)
                          toggleDropdown(banner._id || banner.id)
                        }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      )}

      {AddBannerModal()}
      {EditBannerModal()}
    </div>
  )
}