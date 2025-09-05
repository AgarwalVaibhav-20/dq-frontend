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
  const { banners, loading } = useSelector((state) => state.banner)
  const token = useSelector((state) => state.auth.token)
  const restaurantId = useSelector((state) => state.auth.restaurantId)

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchBanners({ restaurantId, token }))
    }
  }, [dispatch, token, restaurantId])

  const filteredBanners = (banners || [])
    .filter((banner) => banner && typeof banner === 'object')
    .filter((banner) => {
      if (filter === 'All') return true

      const createdAt = new Date(banner.created_at)
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
    .filter((banner) => {
      const urls = [banner.banner_1, banner.banner_2, banner.banner_3].filter(Boolean)
      return urls.some((url) => url.toLowerCase().includes(searchTerm.toLowerCase()))
    })

  const handleAddBanner = () => {
    if (!bannerData.banner_1) {
      toast.error('Please upload the first banner image (banner_1) as it is required.')
      return
    }

    const formData = {
      banner_1: bannerData.banner_1,
      banner_2: bannerData.banner_2,
      banner_3: bannerData.banner_3,
      restaurantId,
      token,
    }

    dispatch(createBanner(formData)).then(() => {
      dispatch(fetchBanners({ restaurantId, token }))
      setBannerData({ banner_1: null, banner_2: null, banner_3: null })
      setModalVisible(false)
    })
  }

  const handleEditBanner = (banner) => {
    setEditedBanner(banner)
    setEditModalVisible(true)
  }

  const handleUpdateBanner = () => {
    if (
      !editedBanner.banner_1 &&
      !editedBanner.banner_2 &&
      !editedBanner.banner_3
    ) {
      toast.error('Please upload at least one banner image.')
      return
    }

    const payload = {
      id: editedBanner.id,
      banner_1: editedBanner.banner_1 instanceof File ? editedBanner.banner_1 : null,
      banner_2: editedBanner.banner_2 instanceof File ? editedBanner.banner_2 : null,
      banner_3: editedBanner.banner_3 instanceof File ? editedBanner.banner_3 : null,
      restaurantId,
      token,
    }

    dispatch(updateBanner(payload))
      .unwrap()
      .then(() => {


        setEditModalVisible(false)
        setEditedBanner({})
        return dispatch(fetchBanners({ restaurantId, token }))
      })
      .catch((error) => {
        toast.error(error || 'Failed to update banner.')
      })
  }

  const handleDeleteBanner = (id) => {
    dispatch(deleteBanner({ id, token }))
  }

  const toggleDropdown = (id) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleFileChange = (e, bannerKey, isEdit = false) => {
    const file = e.target.files[0]
    if (!file) return
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

  if (loading) {
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
                {key.replace('_', ' ').toUpperCase()}
              </label>
              <CFormInput
                id={key}
                type="file"
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
          {loading ? 'Saving...' : 'Save'}
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
                onChange={(e) => handleFileChange(e, key, true)}
              />
              {editedBanner[key] && (
                <img
                  src={
                    typeof editedBanner[key] === 'string'
                      ? editedBanner[key]
                      : URL.createObjectURL(editedBanner[key])
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
        <CButton color="primary" onClick={handleUpdateBanner}>
          {loading ? <CSpinner as="span" size="sm" aria-hidden="true" /> : 'Save Changes'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-semibold">Banners</h1>
        <CButton color="primary" onClick={() => setModalVisible(true)}>
          Add Banner
        </CButton>
      </div>

      <div className="d-flex mb-4">
        <CFormInput
          placeholder="Search banners by image URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="me-3"
        />
        <CFormSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="This week">This Week</option>
          <option value="This month">This Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </CFormSelect>
      </div>

      <CRow>
        {filteredBanners?.map((banner) => (
          <CCol key={banner.id} xs="12" sm="6" md="4" lg="3" className="mb-4">
            <CCard className="shadow-sm border rounded h-100">
              {(() => {
                const images = [banner.banner_1, banner.banner_2, banner.banner_3].filter(Boolean)

                if (images.length === 0) return null

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
                          style={{ height: '150px', objectFit: 'contain' }}
                        />
                      </CCarouselItem>
                    ))}
                  </CCarousel>
                )
              })()}
              <CCardBody className="d-flex justify-content-between align-items-center">
                <p className="mb-0">
                  <strong>Restaurant ID:</strong> {banner.restaurantId || 'N/A'}
                </p>
                <div className="position-relative">
                  <CButton
                    color="light"
                    className="p-0 border-0"
                    style={{ fontSize: '20px' }}
                    onClick={() => toggleDropdown(banner.id)}
                  >
                    &#8942;
                  </CButton>
                  {dropdownOpen[banner.id] && (
                    <div className="dropdown-menu show position-absolute" style={{ right: 0, zIndex: 1000 }}>
                      <button className="dropdown-item" onClick={() => handleEditBanner(banner)}>
                        Edit
                      </button>
                      <button className="dropdown-item text-danger" onClick={() => handleDeleteBanner(banner.id)}>
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

      {AddBannerModal()}
      {EditBannerModal()}
    </div>
  )
}
