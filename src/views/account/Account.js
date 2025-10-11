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

  const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)
  const restaurantId = localStorage.getItem('restaurantId')
  const token  = localStorage.getItem('authToken');
  const id = restaurantProfile?.id

  useEffect(() => {
    dispatch(getRestaurantProfile({ restaurantId , token })).then(({ payload }) => {
      setProfileData(payload || {})
      setFormData(payload || {})
    })
  }, [dispatch, restaurantId , token])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleShowModal = () => {
    setFormData({...profileData})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({...profileData})
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const updateData = {
        ...formData,
        restaurantId
      }

      await dispatch(
        updateRestaurantProfile({ 
          id, 
          profileData: updateData
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

  const InfoRow = ({ icon, label, value, className = "" }) => (
    <div className={`d-flex flex-column flex-md-row align-items-start align-items-md-center py-2 py-md-3 border-bottom ${className}`} style={{ borderColor: '#f1f3f4' }}>
      <div className="d-flex align-items-center mb-2 mb-md-0" style={{ minWidth: '40px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div className="ms-2 ms-md-0" style={{ minWidth: '120px' }}>
          <span className="small" style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#5f6368',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {label}
          </span>
        </div>
      </div>
      <div className="flex-grow-1 ms-0 ms-md-3">
        <span className="small" style={{ 
          fontSize: '14px', 
          color: value ? '#202124' : '#9aa0a6',
          fontWeight: '400',
          wordBreak: 'break-word'
        }}>
          {value || `No ${label.toLowerCase()}`}
        </span>
      </div>
    </div>
  )

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <CSpinner style={{ width: '3rem', height: '3rem', color: '#1a73e8' }} />
          <p className="mt-3" style={{ color: '#5f6368', fontSize: '16px' }}>Loading profile...</p>
        </div>
      </CContainer>
    )
  }

  return (
    <>
      <CContainer fluid className="py-2 py-md-4 px-2 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {updateSuccess && (
          <CAlert color="success" className="mb-3 mb-md-4 mx-auto" style={{ 
            maxWidth: '900px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#e8f5e8',
            borderLeft: '4px solid #34a853',
            color: '#137333',
            fontSize: '14px'
          }}>
            <strong>Success!</strong> Profile updated successfully.
          </CAlert>
        )}
        
        {/* Main Profile Card */}
        <CCard className="w-100" style={{ 
          maxWidth: '900px',
          margin: '0 auto',
          borderRadius: '12px',
          border: '1px solid #dadce0',
          boxShadow: '0 1px 3px rgba(60,64,67,.3)',
          backgroundColor: '#ffffff'
        }}>
          {/* Header */}
          <CCardHeader className="px-3 px-md-4 py-3 py-md-4" style={{ 
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #dadce0'
          }}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div className="mb-3 mb-md-0">
                <CCardTitle className="h4 h5-md" style={{ 
                  color: '#202124',
                  fontSize: '20px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  Restaurant Profile
                </CCardTitle>
                <p className="d-none d-md-block" style={{ 
                  color: '#5f6368',
                  margin: '4px 0 0 0',
                  fontSize: '14px'
                }}>
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
                  minWidth: '120px'
                }}
              >
                Edit Profile
              </CButton>
            </div>
          </CCardHeader>
          
          <CCardBody className="p-3 p-md-4">
            <CRow className="g-3 g-md-4">
              {/* Profile Image Section */}
              <CCol xs={12} md={4} className="text-center">
                <div className="p-3 p-md-4" style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e8eaed'
                }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <CImage
                      rounded
                      src={profileData?.profileImage }
                      alt="Restaurant Profile"
                      width={isMobile ? 100 : 140}
                      height={isMobile ? 100 : 140}
                      style={{
                        border: '4px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(60,64,67,.15)'
                      }}
                    />
                    {imageUploading && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        borderRadius: '50%',
                        padding: '20px'
                      }}>
                        <CSpinner color="light" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 mt-md-4">
                    <h5 className="h6 h5-md" style={{ 
                      color: '#202124',
                      fontSize: '16px',
                      fontWeight: '500',
                      margin: '0 0 4px 0'
                    }}>
                      {profileData?.restName || 'Restaurant Name'}
                    </h5>
                    <p className="small" style={{ 
                      color: '#5f6368',
                      fontSize: '12px',
                      margin: '0 0 16px 0'
                    }}>
                      ID: {profileData?.restaurantId?.toUpperCase() || 'Not assigned'}
                    </p>
                    {/* <CButton
                      variant="outline"
                      onClick={() => document.getElementById('fileInput').click()}
                      disabled={imageUploading}
                      style={{
                        borderColor: '#dadce0',
                        color: '#1a73e8',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      {imageUploading ? 'Uploading...' : 'Change Photo'}
                    </CButton>
                    <CFormInput
                      type="file"
                      id="fileInput"
                      className="d-none"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <p style={{ 
                      marginTop: '8px', 
                      color: '#5f6368', 
                      fontSize: '12px' 
                    }}>
                      Max 5MB • JPG, PNG, GIF */}
                    {/* </p> */}
                  </div>
                </div>
                
                {/* Status Badge */}
                {/* <div className="mt-3">
                  <CBadge 
                    color="success" 
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      backgroundColor: '#e8f5e8',
                      color: '#137333'
                    }}
                  >
                    Active Profile
                  </CBadge>
                </div> */}
              </CCol>

              {/* Profile Information */}
              <CCol xs={12} md={8}>
                <div className="mb-3 mb-md-4" style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8eaed',
                  overflow: 'hidden'
                }}>
                  <div className="px-3 px-md-4 py-2 py-md-3" style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e8eaed'
                  }}>
                    <h6 className="h6 mb-0" style={{ 
                      color: '#202124',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
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

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8eaed',
                  overflow: 'hidden'
                }}>
                  <div className="px-3 px-md-4 py-2 py-md-3" style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e8eaed'
                  }}>
                    <h6 className="h6 mb-0" style={{ 
                      color: '#202124',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Business Information
                    </h6>
                  </div>
                  <div className="px-3 px-md-4">
                    <InfoRow icon="🏪" label="Restaurant Name" value={profileData?.restName} />
                    <InfoRow icon="📍" label="Address" value={profileData?.address} />
                    <InfoRow icon="📮" label="Pin Code" value={profileData?.pinCode} />
                    <InfoRow icon="🆔" label="Identity Type" value={profileData?.identity} />
                    <InfoRow icon="📄" label="Identity Number" value={profileData?.identityNumber} className="border-0" />
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CContainer>

      {/* Edit Profile Modal */}
      <CModal size="lg" visible={showModal} onClose={handleCloseModal} backdrop="static" className="modal-mobile">
        <CModalHeader className="px-3 px-md-4 py-3">
          <CModalTitle className="h5 h4-md" style={{ color: '#202124', fontSize: '18px', fontWeight: '500' }}>
            Edit Profile Information
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-3 p-md-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <CForm>
            <CRow className="g-3">
              <CCol xs={12} md={6}>
                <h6 className="h6 mb-3" style={{ 
                  color: '#202124',
                  fontSize: '14px',
                  fontWeight: '500',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e8eaed'
                }}>
                  Personal Details
                </h6>
                
                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    First Name
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      👤
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Last Name
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      👤
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Gender
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      ⚧
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      placeholder="Enter gender"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Email Address
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      📧
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      value={formData?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Phone Number
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      📞
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Enter phone number"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>
              </CCol>

              <CCol xs={12} md={6}>
                <h6 className="h6 mb-3" style={{ 
                  color: '#202124',
                  fontSize: '14px',
                  fontWeight: '500',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e8eaed'
                }}>
                  Business Details
                </h6>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Restaurant Name
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      🏪
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.restName || ''}
                      onChange={(e) => handleInputChange('restName', e.target.value)}
                      placeholder="Enter restaurant name"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Address
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      📍
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Pin Code
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      📮
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.pinCode || ''}
                      onChange={(e) => handleInputChange('pinCode', e.target.value)}
                      placeholder="Enter pin code"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Identity Type
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      🆔
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.identity || ''}
                      onChange={(e) => handleInputChange('identity', e.target.value)}
                      placeholder="Enter identity type"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>

                <div className="mb-3">
                  <CFormLabel className="small" style={{ fontSize: '12px', fontWeight: '500', color: '#5f6368' }}>
                    Identity Number
                  </CFormLabel>
                  <CInputGroup size="sm">
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', fontSize: '12px' }}>
                      📄
                    </CInputGroupText>
                    <CFormInput
                      value={formData?.identityNumber || ''}
                      onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                      placeholder="Enter identity number"
                      style={{ border: '1px solid #dadce0', fontSize: '14px' }}
                    />
                  </CInputGroup>
                </div>
              </CCol>
            </CRow>
          </CForm>
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
                fontSize: '14px'
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
                fontSize: '14px'
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