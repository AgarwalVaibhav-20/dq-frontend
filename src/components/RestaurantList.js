import React, { useState } from 'react'
import { Eye } from 'lucide-react';
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
  CSpinner,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CCard,
  CCardBody,
  CRow,
  CCol
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilFilter, cilPencil, cilTrash, cilToggleOn, cilToggleOff } from '@coreui/icons'

const RestaurantList = ({
  restaurants,
  restaurantsLoading,
  setSelectedRestaurant,
  setModalState, // This should be the function to set modal state
  onUpdateStatus
}) => {
  // Local state for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')

  // Filter and search logic
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = !searchTerm ||
      restaurant.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter
    const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisine === cuisineFilter

    return matchesSearch && matchesStatus && matchesCuisine
  })

  // Sort logic
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    // Handle different data types
    if (sortField === 'createdAt') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Pagination logic
  const totalItems = sortedRestaurants.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRestaurants = sortedRestaurants.slice(startIndex, startIndex + itemsPerPage)

  // Get unique cuisines for filter
  const uniqueCuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))]

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Format status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'success', text: 'Active' },
      inactive: { color: 'secondary', text: 'Inactive' },
      pending: { color: 'warning', text: 'Pending' },
      suspended: { color: 'danger', text: 'Suspended' }
    }
    const config = statusConfig[status] || { color: 'secondary', text: 'Unknown' }
    return <CBadge color={config.color}>{config.text}</CBadge>
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCuisineFilter('all')
    setCurrentPage(1)
  }

  if (restaurantsLoading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" className="mb-3" />
        <p className="text-muted">Loading restaurants...</p>
      </div>
    )
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <CIcon icon={cilSearch} size="xl" className="text-muted mb-3" />
          <h5 className="text-muted">No restaurants found</h5>
          <p className="text-muted">Start by adding your first restaurant to the system.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filters and Search */}
      <CRow className="mb-4">
        <CCol md={4}>
          <CInputGroup>
            <span className="input-group-text">
              <CIcon icon={cilSearch} />
            </span>
            <CFormInput
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          >
            <option value="all">All Cuisines</option>
            {uniqueCuisines.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CButton
            color="secondary"
            variant="outline"
            onClick={resetFilters}
            className="w-100"
          >
            <CIcon icon={cilFilter} className="me-1" />
            Reset
          </CButton>
        </CCol>
      </CRow>

      {/* Results Summary */}
      <div className="mb-3">
        <small className="text-muted">
          Showing {paginatedRestaurants.length} of {totalItems} restaurants
        </small>
      </div>

      {/* Restaurant Table */}
      <div className="table-responsive">
        <CTable hover striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell
                onClick={() => handleSort('restaurantName')}
                style={{ cursor: 'pointer' }}
              >
                Restaurant Name
                {sortField === 'restaurantName' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell
                onClick={() => handleSort('ownerName')}
                style={{ cursor: 'pointer' }}
              >
                Owner
                {sortField === 'ownerName' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell>Contact</CTableHeaderCell>
              <CTableHeaderCell
                onClick={() => handleSort('cuisine')}
                style={{ cursor: 'pointer' }}
              >
                Cuisine
                {sortField === 'cuisine' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell
                onClick={() => handleSort('city')}
                style={{ cursor: 'pointer' }}
              >
                Location
                {sortField === 'city' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer' }}
              >
                Status
                {sortField === 'status' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell
                onClick={() => handleSort('createdAt')}
                style={{ cursor: 'pointer' }}
              >
                Created
                {sortField === 'createdAt' && (
                  <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paginatedRestaurants.map((restaurant) => (
              <CTableRow key={restaurant._id}>
                <CTableDataCell>
                  <div className="d-flex align-items-center">
                    {restaurant.restaurantImage && (
                      <img
                        src={restaurant.restaurantImage}
                        alt={restaurant.restaurantName}
                        className="rounded me-2"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <div>
                      <div className="fw-semibold">{restaurant.restaurantName}</div>
                      <small className="text-muted">ID: {restaurant.restaurantId}</small>
                    </div>
                  </div>
                </CTableDataCell>
                <CTableDataCell>{restaurant.ownerName}</CTableDataCell>
                <CTableDataCell>
                  <div>
                    <small className="d-block">{restaurant.email}</small>
                    <small className="text-muted">{restaurant.phone}</small>
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  {restaurant.cuisine || <span className="text-muted">Not specified</span>}
                </CTableDataCell>
                <CTableDataCell>
                  <div>
                    <div>{restaurant.city}, {restaurant.state}</div>
                    <small className="text-muted">{restaurant.country}</small>
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  {getStatusBadge(restaurant.status)}
                </CTableDataCell>
                <CTableDataCell>
                  <small className="text-muted">
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </small>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex gap-1">
                    <CButton
                      size="sm"
                      color="info"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setModalState({ type: 'detail', visible: true })
                      }}
                      title="View Details"
                    >
                      <Eye />
                    </CButton>
                    <CButton
                      size="sm"
                      color="primary"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setModalState({ type: 'edit', visible: true })
                      }}
                      title="Edit Restaurant"
                    >
                      <CIcon icon={cilPencil} />
                    </CButton>
                    <CButton
                      size="sm"
                      color={restaurant.status === 'active' ? 'warning' : 'success'}
                      variant="ghost"
                      onClick={() => onUpdateStatus(restaurant._id, restaurant.status)}
                      title={`Mark as ${restaurant.status === 'active' ? 'Inactive' : 'Active'}`}
                    >
                      <CIcon icon={restaurant.status === 'active' ? cilToggleOff : cilToggleOn} />
                    </CButton>
                    <CButton
                      size="sm"
                      color="danger"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setModalState({ type: 'delete', visible: true })
                      }}
                      title="Delete Restaurant"
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </div>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div>
            <small className="text-muted">
              Page {currentPage} of {totalPages}
            </small>
          </div>
          <CPagination>
            <CPaginationItem
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </CPaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <CPaginationItem
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </CPaginationItem>
              )
            })}

            <CPaginationItem
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  )
}

export default RestaurantList