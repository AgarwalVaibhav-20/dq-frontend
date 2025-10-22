import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  CButton,
  CSpinner,
  CCard,
  CCardBody,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CImage,
  CRow,
  CCol,
  CContainer,
} from '@coreui/react'
import { Eye } from 'lucide-react';
import { toast } from 'react-toastify'
import axios from 'axios'
import { BASE_URL } from '../../utils/constants'

const Restaurants = () => {
  const dispatch = useDispatch()
  const token = localStorage.getItem('authToken')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [allRestaurants, setAllRestaurants] = useState([])
  const [filteredRestaurants, setFilteredRestaurants] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch all restaurant profiles on component mount
  useEffect(() => {
    fetchAllRestaurants()
  }, [])

  const fetchAllRestaurants = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${BASE_URL}/all/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log('API Response:', response.data)
      
      // Handle different response structures
      let restaurants = []
      if (response.data.success && response.data.data) {
        restaurants = response.data.data
      } else if (Array.isArray(response.data)) {
        restaurants = response.data
      } else if (response.data.users) {
        restaurants = response.data.users
      }

      setAllRestaurants(restaurants)
      setFilteredRestaurants(restaurants)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      toast.error('Failed to fetch restaurants')
    } finally {
      setLoading(false)
    }
  }

  // Filter restaurants based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRestaurants(allRestaurants)
    } else {
      const filtered = allRestaurants.filter((restaurant) => {
        const search = searchTerm.toLowerCase()
        return (
          restaurant.restaurantName?.toLowerCase().includes(search) ||
          restaurant.ownerName?.toLowerCase().includes(search) ||
          restaurant.firstName?.toLowerCase().includes(search) ||
          restaurant.lastName?.toLowerCase().includes(search) ||
          restaurant.city?.toLowerCase().includes(search) ||
          restaurant.email?.toLowerCase().includes(search) ||
          restaurant.phoneNumber?.includes(search)
        )
      })
      setFilteredRestaurants(filtered)
    }
  }, [searchTerm, allRestaurants])

  const handleViewDetails = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setShowDetailModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedRestaurant(null)
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'danger'
      case 'pending':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const RatingDisplay = ({ rating, totalReviews }) => (
    <div className="d-flex align-items-center gap-1">
      <span style={{ color: '#fbbc04', fontSize: '16px' }}>⭐</span>
      <span style={{ fontSize: '14px', fontWeight: '500' }}>
        {rating?.toFixed(1) || '0.0'}
      </span>
      <span style={{ fontSize: '12px', color: '#5f6368' }}>
        ({totalReviews || 0})
      </span>
    </div>
  )

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <CSpinner style={{ width: '3rem', height: '3rem', color: '#1a73e8' }} />
          <p className="mt-3" style={{ color: '#5f6368', fontSize: '16px' }}>
            Loading restaurants...
          </p>
        </div>
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="px-2 px-md-4 py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="fw-bold mb-1" style={{ color: '#202124', fontSize: '24px' }}>
            🏪 Restaurants Directory
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            Browse and manage all registered restaurants
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <CInputGroup>
            <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0' }}>
              🔍
            </CInputGroupText>
            <CFormInput
              placeholder="Search by name, city, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: '1px solid #dadce0' }}
            />
          </CInputGroup>
        </div>
      </div>

      {/* Statistics Cards */}
      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} md={3}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    Total Restaurants
                  </p>
                  <h3 className="fw-bold mb-0" style={{ color: '#1a73e8' }}>
                    {allRestaurants.length}
                  </h3>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e8f0fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🏪
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} md={3}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    Active
                  </p>
                  <h3 className="fw-bold mb-0" style={{ color: '#34a853' }}>
                    {allRestaurants.filter((r) => r.status === 'active').length}
                  </h3>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e8f5e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ✅
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} md={3}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    Inactive
                  </p>
                  <h3 className="fw-bold mb-0" style={{ color: '#ea4335' }}>
                    {allRestaurants.filter((r) => r.status === 'inactive').length}
                  </h3>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fce8e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ❌
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} md={3}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    Search Results
                  </p>
                  <h3 className="fw-bold mb-0" style={{ color: '#fbbc04' }}>
                    {filteredRestaurants.length}
                  </h3>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fef7e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🔍
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Restaurants Table */}
      <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover className="mb-0" style={{ fontSize: '14px' }}>
              <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                <CTableRow>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Restaurant
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Owner
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Contact
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Location
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Rating
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px' }}>
                    Status
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: '500', color: '#5f6368', padding: '16px', textAlign: 'center' }}>
                    Actions
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredRestaurants.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="7" className="text-center py-5">
                      <div style={{ color: '#9aa0a6' }}>
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
                        <p style={{ fontSize: '16px', marginBottom: '8px' }}>No restaurants found</p>
                        <p style={{ fontSize: '14px' }}>
                          {searchTerm ? 'Try adjusting your search terms' : 'No restaurants registered yet'}
                        </p>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <CTableRow key={restaurant._id} style={{ cursor: 'pointer' }}>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <div className="d-flex align-items-center gap-3">
                          <CImage
                            src={restaurant.restaurantImage || restaurant.profileImage || 'https://via.placeholder.com/50'}
                            alt={restaurant.restaurantName || 'Restaurant'}
                            rounded
                            width={50}
                            height={50}
                            style={{ objectFit: 'cover', border: '2px solid #e8eaed' }}
                          />
                          <div>
                            <div style={{ fontWeight: '500', color: '#202124' }}>
                              {restaurant.restaurantName || 'N/A'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#5f6368' }}>
                              ID: {restaurant.userId?.toString().slice(-8).toUpperCase() || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '400', color: '#202124' }}>
                          {restaurant.ownerName || `${restaurant.firstName} ${restaurant.lastName}`}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#202124' }}>{restaurant.email || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: '#5f6368' }}>{restaurant.phoneNumber || 'N/A'}</div>
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#202124' }}>
                          {restaurant.city || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#5f6368' }}>
                          {restaurant.pinCode || 'N/A'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <RatingDisplay rating={restaurant.rating} totalReviews={restaurant.totalReviews} />
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px' }}>
                        <CBadge
                          color={getStatusColor(restaurant.status)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                          }}
                        >
                          {restaurant.status || 'Unknown'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell style={{ padding: '16px', textAlign: 'center' }}>
                        <CButton
                          color="primary"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(restaurant)}
                          style={{ padding: '4px 12px' }}
                        >
                          <Eye size={20} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* Detail Modal */}
      <CModal
        size="xl"
        visible={showDetailModal}
        onClose={handleCloseModal}
        backdrop="static"
        scrollable
      >
        <CModalHeader style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
          <CModalTitle style={{ color: '#202124', fontSize: '20px', fontWeight: '500' }}>
            Restaurant Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          {selectedRestaurant && (
            <CRow className="g-4">
              {/* Left Column - Images and Basic Info */}
              <CCol xs={12} lg={4}>
                <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <CCardBody className="text-center p-4">
                    <CImage
                      src={selectedRestaurant.restaurantImage}
                      alt={selectedRestaurant.restaurantName}
                      rounded
                      className="mb-3"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        border: '4px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(60,64,67,.15)',
                      }}
                    />
                    <h4 className="fw-bold mb-2" style={{ color: '#202124' }}>
                      {selectedRestaurant.restaurantName || 'N/A'}
                    </h4>
                    <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                      {selectedRestaurant.ownerName || `${selectedRestaurant.firstName} ${selectedRestaurant.lastName}`}
                    </p>
                    <div className="mb-3 d-flex justify-content-center">
                      <RatingDisplay
                        rating={selectedRestaurant.rating}
                        totalReviews={selectedRestaurant.totalReviews}
                      />
                    </div>
                    <CBadge
                      color={getStatusColor(selectedRestaurant.status)}
                      style={{
                        fontSize: '12px',
                        padding: '6px 16px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedRestaurant.status || 'Unknown'}
                    </CBadge>
                  </CCardBody>
                </CCard>

                {/* Profile Image */}
                {selectedRestaurant.profileImage && selectedRestaurant.profileImage !== selectedRestaurant.restaurantImage && (
                  <CCard className="border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
                    <CCardBody className="text-center p-3">
                      <p className="text-muted mb-2" style={{ fontSize: '12px', fontWeight: '500' }}>
                        Owner Profile
                      </p>
                      <CImage
                        src={selectedRestaurant.profileImage}
                        alt="Owner"
                        rounded
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          border: '3px solid #e8eaed',
                        }}
                      />
                    </CCardBody>
                  </CCard>
                )}
              </CCol>

              {/* Right Column - Detailed Information */}
              <CCol xs={12} lg={8}>
                {/* Personal Information */}
                <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                  <CCardBody className="p-0">
                    <div
                      className="px-4 py-3"
                      style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}
                    >
                      <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                        👤 Personal Information
                      </h6>
                    </div>
                    <div className="p-4">
                      <CRow className="g-3">
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            First Name
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.firstName || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Last Name
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.lastName || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Gender
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500', textTransform: 'capitalize' }}>
                            {selectedRestaurant.gender || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Email
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500', wordBreak: 'break-all' }}>
                            {selectedRestaurant.email || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Phone Number
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.phoneNumber || 'N/A'}
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  </CCardBody>
                </CCard>

                {/* Business Information */}
                <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                  <CCardBody className="p-0">
                    <div
                      className="px-4 py-3"
                      style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}
                    >
                      <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                        🏪 Business Information
                      </h6>
                    </div>
                    <div className="p-4">
                      <CRow className="g-3">
                        <CCol xs={12}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Description
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124' }}>
                            {selectedRestaurant.description || 'No description provided'}
                          </div>
                        </CCol>
                        <CCol xs={12}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Address
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.address || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            City
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.city || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Pin Code
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.pinCode || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Identity Type
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.identity || 'N/A'}
                          </div>
                        </CCol>
                        <CCol xs={12} md={6}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            Identity Number
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', fontWeight: '500' }}>
                            {selectedRestaurant.identityNumber || 'N/A'}
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  </CCardBody>
                </CCard>

                {/* Features */}
                {selectedRestaurant.features && selectedRestaurant.features.length > 0 && (
                  <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                    <CCardBody className="p-0">
                      <div
                        className="px-4 py-3"
                        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}
                      >
                        <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                          ✨ Features & Amenities
                        </h6>
                      </div>
                      <div className="p-4">
                        <div className="d-flex flex-wrap gap-2">
                          {selectedRestaurant.features.map((feature, index) => (
                            <CBadge
                              key={index}
                              style={{
                                fontSize: '13px',
                                padding: '6px 14px',
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
                      </div>
                    </CCardBody>
                  </CCard>
                )}

                {/* Operating Hours */}
                {selectedRestaurant.operatingHours && (
                  <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                    <CCardBody className="p-0">
                      <div
                        className="px-4 py-3"
                        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}
                      >
                        <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                          🕒 Operating Hours
                        </h6>
                      </div>
                      <div className="p-4">
                        <div className="table-responsive">
                          <table className="table table-sm mb-0" style={{ fontSize: '13px' }}>
                            <tbody>
                              {Object.entries(selectedRestaurant.operatingHours).map(([day, hours]) => (
                                <tr key={day}>
                                  <td
                                    style={{
                                      textTransform: 'capitalize',
                                      fontWeight: '500',
                                      color: '#202124',
                                      width: '120px',
                                      padding: '8px 0',
                                    }}
                                  >
                                    {day}
                                  </td>
                                  <td style={{ color: '#5f6368', padding: '8px 0' }}>
                                    {hours.isOpen ? (
                                      <span>
                                        {hours.open} - {hours.close}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#ea4335' }}>Closed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                )}

                {/* Social Links */}
                <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <CCardBody className="p-0">
                    <div
                      className="px-4 py-3"
                      style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}
                    >
                      <h6 className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                        🌐 Social Media
                      </h6>
                    </div>
                    <div className="p-4">
                      <CRow className="g-3">
                        <CCol xs={12} md={4}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            📘 Facebook
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', wordBreak: 'break-all' }}>
                            {selectedRestaurant.facebook && selectedRestaurant.facebook !== 'Not provided' ? (
                              <a href={selectedRestaurant.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                                {selectedRestaurant.facebook}
                              </a>
                            ) : (
                              <span style={{ color: '#9aa0a6' }}>N/A</span>
                            )}
                          </div>
                        </CCol>
                        <CCol xs={12} md={4}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            📸 Instagram
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', wordBreak: 'break-all' }}>
                            {selectedRestaurant.instagram && selectedRestaurant.instagram !== 'Not provided' ? (
                              <a href={selectedRestaurant.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                                {selectedRestaurant.instagram}
                              </a>
                            ) : (
                              <span style={{ color: '#9aa0a6' }}>N/A</span>
                            )}
                          </div>
                        </CCol>
                        <CCol xs={12} md={4}>
                          <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>
                            💬 WhatsApp
                          </div>
                          <div style={{ fontSize: '14px', color: '#202124', wordBreak: 'break-all' }}>
                            {selectedRestaurant.whatsapp && selectedRestaurant.whatsapp !== 'Not provided' ? (
                              <a 
                                href={`https://wa.me/${selectedRestaurant.whatsapp.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: '#1a73e8', textDecoration: 'none' }}
                              >
                                {selectedRestaurant.whatsapp}
                              </a>
                            ) : (
                              <span style={{ color: '#9aa0a6' }}>N/A</span>
                            )}
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dadce0' }}>
          <CButton
            color="secondary"
            onClick={handleCloseModal}
            style={{
              borderRadius: '6px',
              padding: '8px 24px',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}

export default Restaurants

// import React, { useState, useEffect } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { CButton, CSpinner, CCard, CCardBody, CBadge } from '@coreui/react'
// import { toast } from 'react-toastify'

// import {
//   createRestaurant,
//   deleteRestaurant,
//   fetchRestaurants,
//   updateRestaurant,
//   updateRestaurantStatus,
// } from '../../redux/slices/restaurantSlice'

// import CommonModal from '../../components/CommonModal'
// import RestaurantList from '../../components/RestaurantList'

// // ---------------- Constants ----------------
// const defaultOperatingHours = {
//   monday: { open: '09:00', close: '22:00', isOpen: true },
//   tuesday: { open: '09:00', close: '22:00', isOpen: true },
//   wednesday: { open: '09:00', close: '22:00', isOpen: true },
//   thursday: { open: '09:00', close: '22:00', isOpen: true },
//   friday: { open: '09:00', close: '22:00', isOpen: true },
//   saturday: { open: '09:00', close: '22:00', isOpen: true },
//   sunday: { open: '09:00', close: '22:00', isOpen: true },
// }

// const availableFeatures = [
//   'Free WiFi', 'Parking Available', 'Outdoor Seating', 'Home Delivery',
//   'Takeaway', 'Credit Card Accepted', 'Air Conditioning', 'Family Friendly',
//   'Pet Friendly', 'Live Music', 'Private Dining', 'Catering Services'
// ]

// const defaultFormData = {
//   // restaurantId: '',
//   restaurantName: '',
//   ownerName: '',
//   email: '',
//   phone: '',
//   address: '',
//   city: '',
//   state: '',
//   zipCode: '',
//   country: '',
//   cuisine: '',
//   description: '',
//   website: '',
//   restaurantImage: null,
//   features: [],
//   operatingHours: defaultOperatingHours,
// }

// // ---------------- Helper ----------------
// const buildFormData = (data) => {
//   const formDataObj = new FormData()
//   Object.keys(data).forEach((key) => {
//     if (key === 'restaurantId') return
//     if (key === 'restaurantImage' && data[key]) {
//       formDataObj.append(key, data[key])
//     } else if (key === 'features' || key === 'operatingHours') {
//       formDataObj.append(key, JSON.stringify(data[key]))
//     } else if (data[key] !== null && data[key] !== '') {
//       formDataObj.append(key, data[key])
//     }
//   })
//   return formDataObj
// }

// // ---------------- Main Component ----------------
// const Restaurants = () => {
//   const dispatch = useDispatch()
//   const { restaurants, loading: restaurantsLoading } = useSelector((state) => state.restaurants)
//   const token = localStorage.getItem('authToken')

//   const [modalState, setModalState] = useState({ type: '', visible: false }) // 'add' | 'edit' | 'delete' | 'detail'
//   const [selectedRestaurant, setSelectedRestaurant] = useState(null)
//   const [activeTab, setActiveTab] = useState('basic')
//   const [formData, setFormData] = useState(defaultFormData)
//   const [previewImage, setPreviewImage] = useState(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const restaurantId = localStorage.getItem('restaurantId');

//   // ---------------- Fetch Restaurants ----------------
//   useEffect(() => {
//     if (restaurantId && token) {
//       dispatch(fetchRestaurants({ token, restaurantId })).catch(() => toast.error('Failed to fetch restaurants'))
//     }
//   }, [dispatch, restaurantId, token])

//   // ---------------- Update Form for Edit ----------------
//   useEffect(() => {
//     if (selectedRestaurant && modalState.type === 'edit') {
//       setFormData({
//         ...defaultFormData,
//         ...selectedRestaurant,
//         restaurantImage: null, // reset image input
//       })
//       setPreviewImage(selectedRestaurant.restaurantImage)
//     }
//   }, [selectedRestaurant, modalState.type])

//   // ---------------- Handlers ----------------
//   const resetForm = () => {
//     setFormData(defaultFormData)
//     setPreviewImage(null)
//     setActiveTab('basic')
//     setSelectedRestaurant(null)
//     setModalState({ type: '', visible: false })
//   }

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleImageChange = (e) => {
//     const file = e.target.files[0]
//     setFormData((prev) => ({ ...prev, restaurantImage: file }))
//     setPreviewImage(URL.createObjectURL(file))
//   }

//   const handleFeatureToggle = (feature) => {
//     setFormData((prev) => ({
//       ...prev,
//       features: prev.features.includes(feature)
//         ? prev.features.filter((f) => f !== feature)
//         : [...prev.features, feature],
//     }))
//   }

//   const handleOperatingHoursChange = (day, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       operatingHours: {
//         ...prev.operatingHours,
//         [day]: { ...prev.operatingHours[day], [field]: value },
//       },
//     }))
//   }

//   const handleSubmit = async () => {
//     setIsSubmitting(true)
//     try {
//       const dataToSend = buildFormData(formData)

//       if (modalState.type === 'add') {
//         await dispatch(createRestaurant({ formData: dataToSend, token })).unwrap()
//         toast.success('Restaurant added successfully!')
//       } else if (modalState.type === 'edit' && selectedRestaurant) {
//         await dispatch(
//           updateRestaurant({ id: selectedRestaurant._id, formData: dataToSend, token })
//         ).unwrap()
//         toast.success('Restaurant updated successfully!')
//       } else if (modalState.type === 'delete' && selectedRestaurant) {
//         await dispatch(deleteRestaurant({ id: selectedRestaurant._id, token })).unwrap()
//         toast.success('Restaurant deleted successfully!')
//       }

//       await dispatch(fetchRestaurants({ token , restaurantId }))
//       resetForm()
//     } catch (error) {
//       toast.error(error.message || 'Operation failed')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleUpdateStatus = async (id, currentStatus) => {
//     const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
//     try {
//       await dispatch(updateRestaurantStatus({ token, id, status: newStatus })).unwrap()
//       await dispatch(fetchRestaurants({ token }))
//       toast.success(`Restaurant marked as ${newStatus}`)
//     } catch {
//       toast.error('Failed to update status')
//     }
//   }

//   // ---------------- UI ----------------
//   return (
//     <div className="container-fluid px-2 px-md-4">
//       <div className="d-flex justify-content-between align-items-center my-3 my-md-4">
//         <h2 className="fw-bold mb-0 text-black">🏪 Restaurants</h2>
//         <CButton
//           color="primary"
//           className="fw-semibold"
//           size="sm"
//           style={{ fontSize: '0.85rem', padding: '6px 16px', minHeight: '32px' }}
//           onClick={() => setModalState({ type: 'add', visible: true })}
//         >
//           + Add Restaurant
//         </CButton>
//       </div>

//       <CCard className="border-0 shadow-sm rounded-4">
//         <CCardBody className="h-100">
//           <RestaurantList
//             restaurants={restaurants}
//             restaurantsLoading={restaurantsLoading}
//             setSelectedRestaurant={setSelectedRestaurant}
//             setModalState={setModalState}
//             onUpdateStatus={handleUpdateStatus}
//           />
//         </CCardBody>
//       </CCard>

//       {/* ---------------- Common Modal for Add/Edit/Delete/Detail ---------------- */}
//       <CommonModal
//         visible={modalState.visible}
//         onClose={resetForm}
//         title={
//           modalState.type === 'add'
//             ? 'Add Restaurant'
//             : modalState.type === 'edit'
//               ? 'Edit Restaurant'
//               : modalState.type === 'delete'
//                 ? 'Delete Restaurant'
//                 : 'Restaurant Details'
//         }
//         onConfirm={modalState.type !== 'detail' ? handleSubmit : undefined}
//         confirmButtonText={
//           modalState.type === 'add'
//             ? 'Add Restaurant'
//             : modalState.type === 'edit'
//               ? 'Update'
//               : modalState.type === 'delete'
//                 ? 'Delete'
//                 : ''  //binduu confirm button text to empty for detail view
//         }
//         confirmButtonColor={modalState.type === 'delete' ? 'danger' : 'primary'}
//         isLoading={isSubmitting}
//         showFooter={true}
//         size="lg"
//       >
//         {/* Delete confirmation */}
//         {modalState.type === 'delete' && (
//           <p className="text-muted">
//             Are you sure you want to delete "{selectedRestaurant?.restaurantName}"? This action
//             cannot be undone.
//           </p>
//         )}

//         {/* Add/Edit form */}
//         {(modalState.type === 'add' || modalState.type === 'edit') && (
//           <>
//             {/* Tabs */}
//             <ul className="nav nav-tabs mb-3">
//               {['basic', 'contact', 'features'].map((tab, idx) => (
//                 <li className="nav-item" key={idx}>
//                   <button
//                     className={`nav-link ${activeTab === tab ? 'active' : ''}`}
//                     onClick={() => setActiveTab(tab)}
//                   >
//                     {tab === 'basic'
//                       ? 'Basic Info'
//                       : tab === 'contact'
//                         ? 'Contact & Address'
//                         : 'Features & Hours'}
//                   </button>
//                 </li>
//               ))}
//             </ul>

//             {/* Tabs Content */}
//             {/* Basic Tab */}
//             {activeTab === 'basic' && (
//               <div className="row">
//                 {['restaurantName', 'ownerName', 'cuisine'].map((field, i) => (
//                   <div className="col-12 col-md-6 mb-3" key={i}>
//                     <label className="form-label text-capitalize">
//                       {field.replace(/([A-Z])/g, ' $1')}
//                     </label>
//                     <input
//                       type="text"
//                       className="form-control"
//                       name={field}
//                       value={formData[field]}
//                       onChange={handleInputChange}
//                       required={field !== 'cuisine'}
//                     />
//                   </div>
//                 ))}
//                 <div className="col-12 mb-3">
//                   <label className="form-label">Description</label>
//                   <textarea
//                     className="form-control"
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                     rows="3"
//                     placeholder="Brief description..."
//                   />
//                 </div>
//                 <div className="col-12 mb-3">
//                   <label className="form-label">Restaurant Image</label>
//                   <input
//                     type="file"
//                     className="form-control"
//                     onChange={handleImageChange}
//                     accept="image/*"
//                   />
//                   {previewImage && (
//                     <div className="d-flex justify-content-center justify-content-md-start mt-2">
//                       <img
//                         src={previewImage}
//                         alt="Preview"
//                         className="img-thumbnail"
//                         style={{ width: '150px', height: '100px', objectFit: 'cover' }}
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Contact Tab */}
//             {activeTab === 'contact' && (
//               <div className="row">
//                 {['email', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'website'].map(
//                   (field, indx) => (
//                     <div
//                       className={`col-12 col-md-${field === 'address' || field === 'website' ? '12' : '6'} mb-3`}
//                       key={indx}
//                     >
//                       <label className="form-label text-capitalize">
//                         {field.replace(/([A-Z])/g, ' $1')}
//                       </label>
//                       <input
//                         type={field === 'email' ? 'email' : field === 'website' ? 'url' : 'text'}
//                         className="form-control"
//                         name={field}
//                         value={formData[field]}
//                         onChange={handleInputChange}
//                       />
//                     </div>
//                   )
//                 )}
//               </div>
//             )}

//             {/* Features Tab */}
//             {activeTab === 'features' && (
//               <div>
//                 {/* Features */}
//                 <div className="mb-4">
//                   <label className="form-label fw-bold">Restaurant Features</label>
//                   <div className="row">
//                     {availableFeatures.map((feature, index) => (
//                       <div key={index} className="col-12 col-sm-6 col-lg-4 mb-2">
//                         <div className="form-check">
//                           <input
//                             className="form-check-input"
//                             type="checkbox"
//                             checked={formData.features.includes(feature)}
//                             onChange={() => handleFeatureToggle(feature)}
//                             id={feature.replace(/\s+/g, '')}
//                           />
//                           <label
//                             className="form-check-label"
//                             htmlFor={feature.replace(/\s+/g, '')}
//                           >
//                             {feature}
//                           </label>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Operating Hours */}
//                 <div className="mb-3">
//                   <label className="form-label fw-bold">Operating Hours</label>
//                   {Object.keys(formData.operatingHours).map((day, index) => (
//                     <div key={index} className="row align-items-center mb-3 p-2 border rounded">
//                       <div className="col-12 col-md-2 text-capitalize fw-semibold mb-2 mb-md-0">{day}</div>
//                       <div className="col-12 col-md-2 mb-2 mb-md-0">
//                         <div className="form-check">
//                           <input
//                             type="checkbox"
//                             className="form-check-input"
//                             checked={formData.operatingHours[day].isOpen}
//                             onChange={(e) =>
//                               handleOperatingHoursChange(day, 'isOpen', e.target.checked)
//                             }
//                           />
//                           <label className="form-check-label">Open</label>
//                         </div>
//                       </div>
//                       <div className="col-6 col-md-4">
//                         <label className="form-label small">Open Time</label>
//                         <input
//                           type="time"
//                           className="form-control form-control-sm"
//                           value={formData.operatingHours[day].open}
//                           onChange={(e) =>
//                             handleOperatingHoursChange(day, 'open', e.target.value)
//                           }
//                           disabled={!formData.operatingHours[day].isOpen}
//                         />
//                       </div>
//                       <div className="col-6 col-md-4">
//                         <label className="form-label small">Close Time</label>
//                         <input
//                           type="time"
//                           className="form-control form-control-sm"
//                           value={formData.operatingHours[day].close}
//                           onChange={(e) =>
//                             handleOperatingHoursChange(day, 'close', e.target.value)
//                           }
//                           disabled={!formData.operatingHours[day].isOpen}
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {/* Details View */}
//         {modalState.type === 'detail' && selectedRestaurant && (
//           <div className="row">
//             <div className="col-12 col-md-5 mb-3 mb-md-0">
//               <img
//                 src={selectedRestaurant.restaurantImage || '/api/placeholder/300/200'}
//                 alt={selectedRestaurant.restaurantName}
//                 className="img-fluid rounded-3 shadow-sm"
//                 style={{ width: '100%', height: '250px', objectFit: 'cover' }}
//               />
//             </div>
//             <div className="col-12 col-md-7">
//               <h4 className="fw-bold text-primary mb-3">{selectedRestaurant.restaurantName}</h4>
//               <div className="row">
//                 <div className="col-12 col-sm-6 mb-2">
//                   <strong>Owner:</strong> {selectedRestaurant.ownerName}
//                 </div>
//                 <div className="col-12 col-sm-6 mb-2">
//                   <strong>Email:</strong> 
//                   <div className="small text-break">{selectedRestaurant.email}</div>
//                 </div>
//                 <div className="col-12 col-sm-6 mb-2">
//                   <strong>Phone:</strong> {selectedRestaurant.phone}
//                 </div>
//                 <div className="col-12 col-sm-6 mb-2">
//                   <strong>Cuisine:</strong> {selectedRestaurant.cuisine}
//                 </div>
//               </div>
//               <div className="mb-3">
//                 <strong>Address:</strong> 
//                 <div className="small">{selectedRestaurant.address}, {selectedRestaurant.city}, {selectedRestaurant.state} {selectedRestaurant.zipCode}</div>
//               </div>
//               <div className="mb-3">
//                 <strong>Features:</strong>
//                 <div className="mt-2">
//                   {selectedRestaurant.features?.map((feature, i) => (
//                     <CBadge key={i} color="info" className="me-1 mb-1">
//                       {feature}
//                     </CBadge>
//                   ))}
//                 </div>
//               </div>
//               <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
//                 <CButton
//                   color="primary"
//                   size="sm"
//                   className="w-100 w-sm-auto"
//                   onClick={() => setModalState({ type: 'edit', visible: true })}
//                 >
//                   Edit
//                 </CButton>
//                 <CButton
//                   color="danger"
//                   size="sm"
//                   className="w-100 w-sm-auto"
//                   onClick={() => setModalState({ type: 'delete', visible: true })}
//                 >
//                   Delete
//                 </CButton>
//               </div>
//             </div>
//             <div className="col-12 mt-3">
//               <strong>Description:</strong>
//               <p className="text-muted mt-2">{selectedRestaurant.description}</p>
//             </div>
//           </div>
//         )}
//       </CommonModal>
//     </div>
//   )
// }

// export default Restaurants
