import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CButton, CSpinner, CCard, CCardBody, CBadge } from '@coreui/react'
import { toast } from 'react-toastify'

import {
  createRestaurant,
  deleteRestaurant,
  fetchRestaurants,
  updateRestaurant,
  updateRestaurantStatus,
} from '../../redux/slices/restaurantSlice'

import CommonModal from '../../components/CommonModal'
import RestaurantList from '../../components/RestaurantList'

// ---------------- Constants ----------------
const defaultOperatingHours = {
  monday: { open: '09:00', close: '22:00', isOpen: true },
  tuesday: { open: '09:00', close: '22:00', isOpen: true },
  wednesday: { open: '09:00', close: '22:00', isOpen: true },
  thursday: { open: '09:00', close: '22:00', isOpen: true },
  friday: { open: '09:00', close: '22:00', isOpen: true },
  saturday: { open: '09:00', close: '22:00', isOpen: true },
  sunday: { open: '09:00', close: '22:00', isOpen: true },
}

const availableFeatures = [
  'Free WiFi', 'Parking Available', 'Outdoor Seating', 'Home Delivery',
  'Takeaway', 'Credit Card Accepted', 'Air Conditioning', 'Family Friendly',
  'Pet Friendly', 'Live Music', 'Private Dining', 'Catering Services'
]

const defaultFormData = {
  restaurantId: '',
  restaurantName: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  cuisine: '',
  description: '',
  website: '',
  restaurantImage: null,
  features: [],
  operatingHours: defaultOperatingHours,
}

// ---------------- Helper ----------------
const buildFormData = (data) => {
  const formDataObj = new FormData()
  Object.keys(data).forEach((key) => {
    if (key === 'createdBy') return
    if (key === 'restaurantImage' && data[key]) {
      formDataObj.append(key, data[key])
    } else if (key === 'features' || key === 'operatingHours') {
      formDataObj.append(key, JSON.stringify(data[key]))
    } else if (data[key] !== null && data[key] !== '') {
      formDataObj.append(key, data[key])
    }
  })
  return formDataObj
}

// ---------------- Main Component ----------------
const Restaurants = () => {
  const dispatch = useDispatch()
  const { restaurants, loading: restaurantsLoading } = useSelector((state) => state.restaurants)
  const token = localStorage.getItem('authToken')

  const [modalState, setModalState] = useState({ type: '', visible: false }) // 'add' | 'edit' | 'delete' | 'detail'
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState(defaultFormData)
  const [previewImage, setPreviewImage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const restaurantId = localStorage.getItem('restaurantId');

  // ---------------- Fetch Restaurants ----------------
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchRestaurants({ token, restaurantId })).catch(() => toast.error('Failed to fetch restaurants'))
    }
  }, [dispatch, restaurantId, token])

  // ---------------- Update Form for Edit ----------------
  useEffect(() => {
    if (selectedRestaurant && modalState.type === 'edit') {
      setFormData({
        ...defaultFormData,
        ...selectedRestaurant,
        restaurantImage: null, // reset image input
      })
      setPreviewImage(selectedRestaurant.restaurantImage)
    }
  }, [selectedRestaurant, modalState.type])

  // ---------------- Handlers ----------------
  const resetForm = () => {
    setFormData(defaultFormData)
    setPreviewImage(null)
    setActiveTab('basic')
    setSelectedRestaurant(null)
    setModalState({ type: '', visible: false })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, restaurantImage: file }))
    setPreviewImage(URL.createObjectURL(file))
  }

  const handleFeatureToggle = (feature) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [field]: value },
      },
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const dataToSend = buildFormData(formData)

      if (modalState.type === 'add') {
        await dispatch(createRestaurant({ formData: dataToSend, token })).unwrap()
        toast.success('Restaurant added successfully!')
      } else if (modalState.type === 'edit' && selectedRestaurant) {
        await dispatch(
          updateRestaurant({ id: selectedRestaurant._id, formData: dataToSend, token })
        ).unwrap()
        toast.success('Restaurant updated successfully!')
      } else if (modalState.type === 'delete' && selectedRestaurant) {
        await dispatch(deleteRestaurant({ id: selectedRestaurant._id, token })).unwrap()
        toast.success('Restaurant deleted successfully!')
      }

      await dispatch(fetchRestaurants({ token }))
      resetForm()
    } catch (error) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await dispatch(updateRestaurantStatus({ token, id, status: newStatus })).unwrap()
      await dispatch(fetchRestaurants({ token }))
      toast.success(`Restaurant marked as ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="container-fluid px-2 px-md-4">
      <div className="d-flex justify-content-between align-items-center my-3 my-md-4">
        <h2 className="fw-bold mb-0 text-black">🏪 Restaurants</h2>
        <CButton
          color="primary"
          className="fw-semibold"
          size="sm"
          style={{ fontSize: '0.85rem', padding: '6px 16px', minHeight: '32px' }}
          onClick={() => setModalState({ type: 'add', visible: true })}
        >
          + Add Restaurant
        </CButton>
      </div>

      <CCard className="border-0 shadow-sm rounded-4">
        <CCardBody className="h-100">
          <RestaurantList
            restaurants={restaurants}
            restaurantsLoading={restaurantsLoading}
            setSelectedRestaurant={setSelectedRestaurant}
            setModalState={setModalState}
            onUpdateStatus={handleUpdateStatus}
          />
        </CCardBody>
      </CCard>

      {/* ---------------- Common Modal for Add/Edit/Delete/Detail ---------------- */}
      <CommonModal
        visible={modalState.visible}
        onClose={resetForm}
        title={
          modalState.type === 'add'
            ? 'Add Restaurant'
            : modalState.type === 'edit'
              ? 'Edit Restaurant'
              : modalState.type === 'delete'
                ? 'Delete Restaurant'
                : 'Restaurant Details'
        }
        onConfirm={modalState.type !== 'detail' ? handleSubmit : undefined}
        confirmButtonText={
          modalState.type === 'add'
            ? 'Add Restaurant'
            : modalState.type === 'edit'
              ? 'Update'
              : modalState.type === 'delete'
                ? 'Delete'
                : ''  //binduu confirm button text to empty for detail view
        }
        confirmButtonColor={modalState.type === 'delete' ? 'danger' : 'primary'}
        isLoading={isSubmitting}
        showFooter={true}
        size="lg"
      >
        {/* Delete confirmation */}
        {modalState.type === 'delete' && (
          <p className="text-muted">
            Are you sure you want to delete "{selectedRestaurant?.restaurantName}"? This action
            cannot be undone.
          </p>
        )}

        {/* Add/Edit form */}
        {(modalState.type === 'add' || modalState.type === 'edit') && (
          <>
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              {['basic', 'contact', 'features'].map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'basic'
                      ? 'Basic Info'
                      : tab === 'contact'
                        ? 'Contact & Address'
                        : 'Features & Hours'}
                  </button>
                </li>
              ))}
            </ul>

            {/* Tabs Content */}
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="row">
                {['restaurantId', 'restaurantName', 'ownerName', 'cuisine'].map((field) => (
                  <div className="col-12 col-md-6 mb-3" key={field}>
                    <label className="form-label text-capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      required={field !== 'cuisine'}
                    />
                  </div>
                ))}
                <div className="col-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Restaurant Image</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  {previewImage && (
                    <div className="d-flex justify-content-center justify-content-md-start mt-2">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="row">
                {['email', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'website'].map(
                  (field) => (
                    <div
                      className={`col-12 col-md-${field === 'address' || field === 'website' ? '12' : '6'} mb-3`}
                      key={field}
                    >
                      <label className="form-label text-capitalize">
                        {field.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type={field === 'email' ? 'email' : field === 'website' ? 'url' : 'text'}
                        className="form-control"
                        name={field}
                        value={formData[field]}
                        onChange={handleInputChange}
                      />
                    </div>
                  )
                )}
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div>
                {/* Features */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Restaurant Features</label>
                  <div className="row">
                    {availableFeatures.map((feature) => (
                      <div key={feature} className="col-12 col-sm-6 col-lg-4 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            id={feature.replace(/\s+/g, '')}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={feature.replace(/\s+/g, '')}
                          >
                            {feature}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Operating Hours</label>
                  {Object.keys(formData.operatingHours).map((day) => (
                    <div key={day} className="row align-items-center mb-3 p-2 border rounded">
                      <div className="col-12 col-md-2 text-capitalize fw-semibold mb-2 mb-md-0">{day}</div>
                      <div className="col-12 col-md-2 mb-2 mb-md-0">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formData.operatingHours[day].isOpen}
                            onChange={(e) =>
                              handleOperatingHoursChange(day, 'isOpen', e.target.checked)
                            }
                          />
                          <label className="form-check-label">Open</label>
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small">Open Time</label>
                        <input
                          type="time"
                          className="form-control form-control-sm"
                          value={formData.operatingHours[day].open}
                          onChange={(e) =>
                            handleOperatingHoursChange(day, 'open', e.target.value)
                          }
                          disabled={!formData.operatingHours[day].isOpen}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small">Close Time</label>
                        <input
                          type="time"
                          className="form-control form-control-sm"
                          value={formData.operatingHours[day].close}
                          onChange={(e) =>
                            handleOperatingHoursChange(day, 'close', e.target.value)
                          }
                          disabled={!formData.operatingHours[day].isOpen}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Details View */}
        {modalState.type === 'detail' && selectedRestaurant && (
          <div className="row">
            <div className="col-12 col-md-5 mb-3 mb-md-0">
              <img
                src={selectedRestaurant.restaurantImage || '/api/placeholder/300/200'}
                alt={selectedRestaurant.restaurantName}
                className="img-fluid rounded-3 shadow-sm"
                style={{ width: '100%', height: '250px', objectFit: 'cover' }}
              />
            </div>
            <div className="col-12 col-md-7">
              <h4 className="fw-bold text-primary mb-3">{selectedRestaurant.restaurantName}</h4>
              <div className="row">
                <div className="col-12 col-sm-6 mb-2">
                  <strong>Owner:</strong> {selectedRestaurant.ownerName}
                </div>
                <div className="col-12 col-sm-6 mb-2">
                  <strong>Email:</strong> 
                  <div className="small text-break">{selectedRestaurant.email}</div>
                </div>
                <div className="col-12 col-sm-6 mb-2">
                  <strong>Phone:</strong> {selectedRestaurant.phone}
                </div>
                <div className="col-12 col-sm-6 mb-2">
                  <strong>Cuisine:</strong> {selectedRestaurant.cuisine}
                </div>
              </div>
              <div className="mb-3">
                <strong>Address:</strong> 
                <div className="small">{selectedRestaurant.address}, {selectedRestaurant.city}, {selectedRestaurant.state} {selectedRestaurant.zipCode}</div>
              </div>
              <div className="mb-3">
                <strong>Features:</strong>
                <div className="mt-2">
                  {selectedRestaurant.features?.map((feature, i) => (
                    <CBadge key={i} color="info" className="me-1 mb-1">
                      {feature}
                    </CBadge>
                  ))}
                </div>
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                <CButton
                  color="primary"
                  size="sm"
                  className="w-100 w-sm-auto"
                  onClick={() => setModalState({ type: 'edit', visible: true })}
                >
                  Edit
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  className="w-100 w-sm-auto"
                  onClick={() => setModalState({ type: 'delete', visible: true })}
                >
                  Delete
                </CButton>
              </div>
            </div>
            <div className="col-12 mt-3">
              <strong>Description:</strong>
              <p className="text-muted mt-2">{selectedRestaurant.description}</p>
            </div>
          </div>
        )}
      </CommonModal>
    </div>
  )
}

export default Restaurants
