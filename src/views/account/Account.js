'use client'

import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CCardTitle,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormLabel,
  CImage,
  CSpinner,
  CAlert,
  CBadge,
  CContainer,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CInputGroup,
  CInputGroupText,
  CFormTextarea,
  CFormSelect,
  CFormCheck,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  uploadRestaurantImage,
} from '../../redux/slices/restaurantProfileSlice'

export default function Account() {
  const dispatch = useDispatch()
  const [profileData, setProfileData] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)
  const restaurantId = localStorage.getItem('restaurantId')
  const token = localStorage.getItem('authToken')
  const id = restaurantProfile?.id

  useEffect(() => {
    dispatch(getRestaurantProfile({ restaurantId, token })).then(({ payload }) => {
      setProfileData(payload || {})
      setFormData(payload || {})
    })
  }, [dispatch, restaurantId, token])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleShowModal = () => {
    setFormData({ ...profileData })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ ...profileData })
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours?.[day],
          [field]: value,
        },
      },
    }))
  }

  const handleFeaturesChange = (feature) => {
    const currentFeatures = formData.features || []
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature]
    
    setFormData((prev) => ({
      ...prev,
      features: updatedFeatures,
    }))
  }

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const updateData = {
        ...formData,
        restaurantId,
      }

      await dispatch(
        updateRestaurantProfile({
          id,
          profileData: updateData,
        })
      )
      setProfileData(formData)
      setShowModal(false)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB')
        return
      }

      setImageUploading(true)
      try {
        await dispatch(uploadRestaurantImage({ id, imageFile: file }))
        await dispatch(getRestaurantProfile({ restaurantId }))
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 3000)
      } catch (error) {
        console.error('Error uploading image:', error)
      } finally {
        setImageUploading(false)
      }
    }
  }

  const InfoRow = ({ icon, label, value, className = '' }) => (
    <div
      className={`d-flex flex-column flex-md-row align-items-start align-items-md-center py-2 py-md-3 border-bottom ${className}`}
      style={{ borderColor: '#f1f3f4' }}
    >
      <div className="d-flex align-items-center mb-2 mb-md-0" style={{ minWidth: '40px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div className="ms-2 ms-md-0" style={{ minWidth: '140px' }}>
          <span
            className="small"
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#5f6368',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="flex-grow-1 ms-0 ms-md-3">
        <span
          className="small"
          style={{
            fontSize: '14px',
            color: value ? '#202124' : '#9aa0a6',
            fontWeight: '400',
            wordBreak: 'break-word',
          }}
        >
          {value || `No ${label.toLowerCase()}`}
        </span>
      </div>
    </div>
  )

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'active':
          return { bg: '#e8f5e8', color: '#137333' }
        case 'inactive':
          return { bg: '#fce8e6', color: '#c5221f' }
        case 'pending':
          return { bg: '#fef7e0', color: '#ea8600' }
        default:
          return { bg: '#e8eaed', color: '#5f6368' }
      }
    }

    const colors = getStatusColor()
    return (
      <CBadge
        style={{
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '12px',
          fontWeight: '500',
          backgroundColor: colors.bg,
          color: colors.color,
          textTransform: 'capitalize',
        }}
      >
        {status || 'Unknown'}
      </CBadge>
    )
  }

  const RatingDisplay = ({ rating, totalReviews }) => (
    <div className="d-flex align-items-center gap-2">
      <div className="d-flex align-items-center">
        <span style={{ fontSize: '20px', color: '#fbbc04' }}>⭐</span>
        <span style={{ fontSize: '16px', fontWeight: '500', color: '#202124', marginLeft: '4px' }}>
          {rating?.toFixed(1) || '0.0'}
        </span>
      </div>
      <span style={{ fontSize: '12px', color: '#5f6368' }}>
        ({totalReviews || 0} reviews)
      </span>
    </div>
  )

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <CSpinner style={{ width: '3rem', height: '3rem', color: '#1a73e8' }} />
          <p className="mt-3" style={{ color: '#5f6368', fontSize: '16px' }}>
            Loading profile...
          </p>
        </div>
      </CContainer>
    )
  }

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const availableFeatures = [
    'WiFi',
    'Parking',
    'Air Conditioning',
    'Outdoor Seating',
    'Takeaway',
    'Home Delivery',
    'Bar',
    'Live Music',
    'Pet Friendly',
    'Wheelchair Accessible',
  ]

  return (
    <>
      <CContainer fluid className="py-2 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {updateSuccess && (
          <CAlert
            color="success"
            className="mb-3 mb-md-4 mx-auto"
            style={{
              maxWidth: '900px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#e8f5e8',
              borderLeft: '4px solid #34a853',
              color: '#137333',
              fontSize: '14px',
            }}
          >
            <strong>Success!</strong> Profile updated successfully.
          </CAlert>
        )}

        {/* Main Profile Card */}
        <CCard
          className="w-100"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            borderRadius: '12px',
            border: '1px solid #dadce0',
            boxShadow: '0 1px 3px rgba(60,64,67,.3)',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header */}
          <CCardHeader
            className="px-3 px-md-4 py-3 py-md-4"
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #dadce0',
            }}
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div className="mb-3 mb-md-0">
                <CCardTitle
                  className="h4 h5-md"
                  style={{
                    color: '#202124',
                    fontSize: '20px',
                    fontWeight: '500',
                    margin: 0,
                  }}
                >
                  Restaurant Profile
                </CCardTitle>
                <p
                  className="d-none d-md-block"
                  style={{
                    color: '#5f6368',
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                  }}
                >
                  Manage your restaurant information and settings
                </p>
              </div>
              <CButton
                onClick={handleShowModal}
                className="w-20 w-md-auto"
                style={{
                  backgroundColor: '#1a73e8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#ffffff',
                  minWidth: '120px',
                }}
              >
                Edit Profile
              </CButton>
            </div>
          </CCardHeader>

          <CCardBody className="p-3 p-md-4">
            <CRow className="g-3 g-md-4">
              {/* Profile Image Section */}
              <CCol xs={12} lg={3} className="text-center">
                <div
                  className="p-3 p-md-4"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e8eaed',
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <CImage
                      rounded
                      src={profileData?.profileImage}
                      alt="Restaurant Profile"
                      width={isMobile ? 100 : 140}
                      height={isMobile ? 100 : 140}
                      style={{
                        border: '4px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(60,64,67,.15)',
                        objectFit: 'cover',
                      }}
                    />
                    {imageUploading && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          borderRadius: '50%',
                          padding: '20px',
                        }}
                      >
                        <CSpinner color="light" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 mt-md-4">
                    <h5
                      className="h6 h5-md"
                      style={{
                        color: '#202124',
                        fontSize: '16px',
                        fontWeight: '500',
                        margin: '0 0 4px 0',
                      }}
                    >
                      {profileData?.restaurantName || 'Restaurant Name'}
                    </h5>
                    <p
                      className="small"
                      style={{
                        color: '#5f6368',
                        fontSize: '12px',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {profileData?.ownerName || 'Owner Name'}
                    </p>
                    <div className="mb-3">
                      <RatingDisplay rating={profileData?.rating} totalReviews={profileData?.totalReviews} />
                    </div>
                    <StatusBadge status={profileData?.status} />
                  </div>
                </div>
              </CCol>

              {/* Profile Information */}
              <CCol xs={12} lg={9}>
                {/* Personal Information */}
                <div
                  className="mb-3 mb-md-4"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e8eaed',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="px-3 px-md-4 py-2 py-md-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #e8eaed',
                    }}
                  >
                    <h6
                      className="h6 mb-0"
                      style={{
                        color: '#202124',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Personal Information
                    </h6>
                  </div>
                  <div className="px-3 px-md-4">
                    <InfoRow icon="👤" label="First Name" value={profileData?.firstName} />
                    <InfoRow icon="👤" label="Last Name" value={profileData?.lastName} />
                    <InfoRow icon="⚧" label="Gender" value={profileData?.gender} />
                    <InfoRow icon="📧" label="Email" value={profileData?.email} />
                    <InfoRow icon="📞" label="Phone" value={profileData?.phoneNumber} className="border-0" />
                  </div>
                </div>

                {/* Business Information */}
                <div
                  className="mb-3 mb-md-4"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e8eaed',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="px-3 px-md-4 py-2 py-md-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #e8eaed',
                    }}
                  >
                    <h6
                      className="h6 mb-0"
                      style={{
                        color: '#202124',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Business Information
                    </h6>
                  </div>
                  <div className="px-3 px-md-4">
                    <InfoRow icon="🏪" label="Restaurant Name" value={profileData?.restaurantName} />
                    <InfoRow icon="👨‍💼" label="Owner Name" value={profileData?.ownerName} />
                    <InfoRow icon="📝" label="Description" value={profileData?.description} />
                    <InfoRow icon="📍" label="Address" value={profileData?.address} />
                    <InfoRow icon="🏙️" label="City" value={profileData?.city} />
                    <InfoRow icon="📮" label="Pin Code" value={profileData?.pinCode} />
                    <InfoRow icon="🆔" label="Identity Type" value={profileData?.identity} />
                    <InfoRow icon="📄" label="Identity Number" value={profileData?.identityNumber} className="border-0" />
                  </div>
                </div>

                {/* Features & Social Links */}
                <CRow className="g-3">
                  <CCol xs={12} md={6}>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e8eaed',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="px-3 px-md-4 py-2 py-md-3"
                        style={{
                          backgroundColor: '#f8f9fa',
                          borderBottom: '1px solid #e8eaed',
                        }}
                      >
                        <h6
                          className="h6 mb-0"
                          style={{
                            color: '#202124',
                            fontSize: '14px',
                            fontWeight: '500',
                          }}
                        >
                          Features & Amenities
                        </h6>
                      </div>
                      <div className="px-3 px-md-4 py-3">
                        {profileData?.features && profileData.features.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {profileData.features.map((feature, index) => (
                              <CBadge
                                key={index}
                                style={{
                                  fontSize: '12px',
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  fontWeight: '400',
                                  backgroundColor: '#e8f0fe',
                                  color: '#1a73e8',
                                }}
                              >
                                {feature}
                              </CBadge>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#9aa0a6', fontSize: '14px' }}>No features added</p>
                        )}
                      </div>
                    </div>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e8eaed',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="px-3 px-md-4 py-2 py-md-3"
                        style={{
                          backgroundColor: '#f8f9fa',
                          borderBottom: '1px solid #e8eaed',
                        }}
                      >
                        <h6
                          className="h6 mb-0"
                          style={{
                            color: '#202124',
                            fontSize: '14px',
                            fontWeight: '500',
                          }}
                        >
                          Social Media Links
                        </h6>
                      </div>
                      <div className="px-3 px-md-4">
                        <InfoRow icon="📘" label="Facebook" value={profileData?.facebook} />
                        <InfoRow icon="📸" label="Instagram" value={profileData?.instagram} />
                        <InfoRow icon="💬" label="WhatsApp" value={profileData?.whatsapp} className="border-0" />
                      </div>
                    </div>
                  </CCol>
                </CRow>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CContainer>

      {/* Edit Profile Modal */}
      <CModal size="xl" visible={showModal} onClose={handleCloseModal} backdrop="static">
        <CModalHeader className="px-3 px-md-4 py-3">
          <CModalTitle className="h5 h4-md" style={{ color: '#202124', fontSize: '18px', fontWeight: '500' }}>
            Edit Profile Information
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <CNav variant="tabs" className="px-3 px-md-4" style={{ borderBottom: '2px solid #e8eaed' }}>
            <CNavItem>
              <CNavLink
                active={activeTab === 0}
                onClick={() => setActiveTab(0)}
                style={{ cursor: 'pointer', fontWeight: activeTab === 0 ? '500' : '400' }}
              >
                Personal Info
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 1}
                onClick={() => setActiveTab(1)}
                style={{ cursor: 'pointer', fontWeight: activeTab === 1 ? '500' : '400' }}
              >
                Business Details
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 2}
                onClick={() => setActiveTab(2)}
                style={{ cursor: 'pointer', fontWeight: activeTab === 2 ? '500' : '400' }}
              >
                Features & Hours
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 3}
                onClick={() => setActiveTab(3)}
                style={{ cursor: 'pointer', fontWeight: activeTab === 3 ? '500' : '400' }}
              >
                Social Links
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent className="p-3 p-md-4">
            {/* Personal Info Tab */}
            <CTabPane visible={activeTab === 0}>
              <CForm>
                <CRow className="g-3">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      First Name
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        👤
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Last Name
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        👤
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Gender
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        ⚧
                      </CInputGroupText>
                      <CFormSelect
                        value={formData?.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        style={{ border: '1px solid #dadce0' }}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </CFormSelect>
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Phone Number
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📞
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="Enter phone number"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Email Address
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📧
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        value={formData?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        style={{ border: '1px solid #dadce0' }}
                        disabled
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>
              </CForm>
            </CTabPane>

            {/* Business Details Tab */}
            <CTabPane visible={activeTab === 1}>
              <CForm>
                <CRow className="g-3">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Restaurant Name
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        🏪
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.restaurantName || ''}
                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                        placeholder="Enter restaurant name"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Owner Name
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        👨‍💼
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.ownerName || ''}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        placeholder="Enter owner name"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Description
                    </CFormLabel>
                    <CFormTextarea
                      rows={3}
                      value={formData?.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter restaurant description"
                      style={{ border: '1px solid #dadce0' }}
                    />
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Address
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📍
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter complete address"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      City
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        🏙️
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Pin Code
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📮
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.pinCode || ''}
                        onChange={(e) => handleInputChange('pinCode', e.target.value)}
                        placeholder="Enter pin code"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Identity Type
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        🆔
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.identity || ''}
                        onChange={(e) => handleInputChange('identity', e.target.value)}
                        placeholder="Enter identity type (e.g., Aadhar, PAN)"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Identity Number
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📄
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.identityNumber || ''}
                        onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                        placeholder="Enter identity number"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12} md={6}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Status
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📊
                      </CInputGroupText>
                      <CFormSelect
                        value={formData?.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        style={{ border: '1px solid #dadce0' }}
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </CFormSelect>
                    </CInputGroup>
                  </CCol>
                </CRow>
              </CForm>
            </CTabPane>

            {/* Features & Operating Hours Tab */}
            <CTabPane visible={activeTab === 2}>
              <CForm>
                <h6 className="mb-3" style={{ color: '#202124', fontSize: '14px', fontWeight: '500' }}>
                  Restaurant Features
                </h6>
                <CRow className="g-2 mb-4">
                  {availableFeatures.map((feature) => (
                    <CCol xs={6} md={4} lg={3} key={feature}>
                      <CFormCheck
                        id={`feature-${feature}`}
                        label={feature}
                        checked={formData?.features?.includes(feature) || false}
                        onChange={() => handleFeaturesChange(feature)}
                        style={{ fontSize: '14px' }}
                      />
                    </CCol>
                  ))}
                </CRow>

                <h6 className="mb-3 mt-4" style={{ color: '#202124', fontSize: '14px', fontWeight: '500' }}>
                  Operating Hours
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm" style={{ fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ width: '20%', color: '#5f6368', fontWeight: '500' }}>Day</th>
                        <th style={{ width: '15%', textAlign: 'center', color: '#5f6368', fontWeight: '500' }}>Open</th>
                        <th style={{ width: '30%', color: '#5f6368', fontWeight: '500' }}>Opening Time</th>
                        <th style={{ width: '30%', color: '#5f6368', fontWeight: '500' }}>Closing Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map((day) => (
                        <tr key={day}>
                          <td style={{ textTransform: 'capitalize', fontWeight: '500' }}>{day}</td>
                          <td style={{ textAlign: 'center' }}>
                            <CFormCheck
                              checked={formData?.operatingHours?.[day]?.isOpen ?? true}
                              onChange={(e) => handleOperatingHoursChange(day, 'isOpen', e.target.checked)}
                            />
                          </td>
                          <td>
                            <CFormInput
                              type="time"
                              size="sm"
                              value={formData?.operatingHours?.[day]?.open || ''}
                              onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                              disabled={!formData?.operatingHours?.[day]?.isOpen}
                              style={{ border: '1px solid #dadce0' }}
                            />
                          </td>
                          <td>
                            <CFormInput
                              type="time"
                              size="sm"
                              value={formData?.operatingHours?.[day]?.close || ''}
                              onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                              disabled={!formData?.operatingHours?.[day]?.isOpen}
                              style={{ border: '1px solid #dadce0' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CForm>
            </CTabPane>

            {/* Social Links Tab */}
            <CTabPane visible={activeTab === 3}>
              <CForm>
                <CRow className="g-3">
                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Facebook
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📘
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.facebook || ''}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        placeholder="Enter Facebook profile URL"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      Instagram
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        📸
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.instagram || ''}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="Enter Instagram profile URL"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol xs={12}>
                    <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                      WhatsApp
                    </CFormLabel>
                    <CInputGroup size="sm">
                      <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
                        💬
                      </CInputGroupText>
                      <CFormInput
                        value={formData?.whatsapp || ''}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="Enter WhatsApp number"
                        style={{ border: '1px solid #dadce0' }}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>
              </CForm>
            </CTabPane>
          </CTabContent>
        </CModalBody>
        <CModalFooter className="px-3 px-md-4 py-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="d-flex flex-column flex-md-row gap-2 w-100">
            <CButton
              color="secondary"
              variant="outline"
              onClick={handleCloseModal}
              className="w-100 w-md-auto"
              style={{
                borderColor: '#dadce0',
                color: '#5f6368',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Cancel
            </CButton>
            <CButton
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="w-100 w-md-auto"
              style={{
                backgroundColor: '#1a73e8',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: '500',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              {isUpdating ? <CSpinner size="sm" className="me-2" /> : null}
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </CButton>
          </div>
        </CModalFooter>
      </CModal>
    </>
  )
}