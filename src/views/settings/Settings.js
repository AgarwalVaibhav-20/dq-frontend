import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CContainer,
} from '@coreui/react'
import { toast } from 'react-toastify'
import axios from 'axios'
import axiosInstance from '../../utils/axiosConfig'
import { BASE_URL } from '../../utils/constants'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilPlus, cilTrash, cilPencil, cilSave } from '@coreui/icons'

const Settings = () => {
  const [formData, setFormData] = useState({
    systemName: '',
    chargeOfSystem: '',
    willOccupy: false,
  })
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingSystem, setEditingSystem] = useState(null)

  // Fetch all systems on component mount
  useEffect(() => {
    fetchSystems()
  }, [])

  const fetchSystems = async () => {
    try {
      setLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/settings?restaurantId=${restaurantId}`)
      
      if (response.data.success) {
        setSystems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
      if (error.response?.status !== 404) {
        setError('Failed to fetch systems')
        toast.error('Failed to fetch systems')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'willOccupy' ? value === 'true' : value)
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.systemName.trim()) {
      setError('System name is required')
      return
    }
    
    if (!formData.chargeOfSystem.trim()) {
      setError('Charge of system is required')
      return
    }

    try {
      setSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')
      
      if (editingSystem) {
        // Update existing system
        const response = await axiosInstance.put(`/api/settings/${editingSystem._id}`, {
          ...formData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('System updated successfully!')
          setEditingSystem(null)
        } else {
          setError(response.data.message || 'Failed to update system')
          toast.error('Failed to update system')
        }
      } else {
        // Create new system
        console.log('Sending data:', {
          ...formData,
          restaurantId
        })
        
        const response = await axiosInstance.post(`/api/settings`, {
          ...formData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('System added successfully!')
        } else {
          setError(response.data.message || 'Failed to add system')
          toast.error('Failed to add system')
        }
      }

      setError('')
      setFormData({
        systemName: '',
        chargeOfSystem: '',
        willOccupy: false,
      })
      // Refresh the systems list
      fetchSystems()
    } catch (error) {
      console.error('Error saving system:', error)
      setError('Failed to save system')
      toast.error('Failed to save system')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (system) => {
    setEditingSystem(system)
    setFormData({
      systemName: system.systemName,
      chargeOfSystem: system.chargeOfSystem,
      willOccupy: system.willOccupy,
    })
  }

  const handleDelete = async (systemId) => {
    if (window.confirm('Are you sure you want to delete this system?')) {
      try {
        const response = await axiosInstance.delete(`/api/settings/${systemId}`)

        if (response.data.success) {
          toast.success('System deleted successfully!')
          fetchSystems()
        } else {
          toast.error('Failed to delete system')
        }
      } catch (error) {
        console.error('Error deleting system:', error)
        toast.error('Failed to delete system')
      }
    }
  }

  const handleCancel = () => {
    setEditingSystem(null)
    setFormData({
      systemName: '',
      chargeOfSystem: '',
      willOccupy: false,
    })
    setError('')
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <CSpinner color="primary" variant="grow" />
        <span className="ms-2">Loading settings...</span>
      </div>
    )
  }

  return (
    <CContainer>
      {/* Add/Edit System Form */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <CCardTitle>
                <CIcon icon={cilSettings} className="me-2" />
                {editingSystem ? 'Edit System' : 'Add New System'}
              </CCardTitle>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}
              
              <CForm onSubmit={handleSubmit}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="systemName">System Name</CFormLabel>
                    <CFormInput
                      type="text"
                      id="systemName"
                      name="systemName"
                      value={formData.systemName}
                      onChange={handleInputChange}
                      placeholder="Enter system name"
                      required
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="chargeOfSystem">Charge of System</CFormLabel>
                    <CFormInput
                      type="text"
                      id="chargeOfSystem"
                      name="chargeOfSystem"
                      value={formData.chargeOfSystem}
                      onChange={handleInputChange}
                      placeholder="Enter charge of system"
                      required
                    />
                  </CCol>
                </CRow>
                
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="willOccupy">Will Occupy</CFormLabel>
                    <CFormSelect
                      id="willOccupy"
                      name="willOccupy"
                      value={formData.willOccupy.toString()}
                      onChange={handleInputChange}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </CFormSelect>
                  </CCol>
                </CRow>
                
                <CRow>
                  <CCol>
                    <CButton 
                      type="submit" 
                      color="primary" 
                      disabled={saving}
                      className="me-2"
                    >
                      {saving ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          {editingSystem ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilSave} className="me-2" />
                          {editingSystem ? 'Update System' : 'Add System'}
                        </>
                      )}
                    </CButton>
                    {editingSystem && (
                      <CButton 
                        color="secondary" 
                        onClick={handleCancel}
                      >
                        Cancel
                      </CButton>
                    )}
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Systems List */}
      <CRow>
        <CCol>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <CCardTitle>System Settings</CCardTitle>
              <div>
                <CButton 
                  color="success" 
                  size="sm" 
                  className="me-2"
                  onClick={() => {
                    setEditingSystem(null)
                    setFormData({
                      systemName: '',
                      chargeOfSystem: '',
                      willOccupy: false,
                    })
                    setError('')
                  }}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add New
                </CButton>
                <CButton 
                  color="primary" 
                  size="sm" 
                  onClick={fetchSystems}
                  disabled={loading}
                >
                  {loading ? <CSpinner size="sm" /> : 'Refresh'}
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center py-4">
                  <CSpinner />
                  <p className="mt-2">Loading systems...</p>
                </div>
              ) : systems.length === 0 ? (
                <div className="text-center py-4">
                  <CIcon icon={cilSettings} size="3xl" className="text-muted" />
                  <p className="mt-2 text-muted">No systems found. Add your first system above.</p>
                </div>
              ) : (
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>System Name</CTableHeaderCell>
                      <CTableHeaderCell>Charge</CTableHeaderCell>
                      <CTableHeaderCell>Will Occupy</CTableHeaderCell>
                      <CTableHeaderCell>Created</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {systems.map((system) => (
                      <CTableRow key={system._id}>
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon icon={cilSettings} className="me-2" />
                            {system.systemName}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">₹{system.chargeOfSystem}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={system.willOccupy ? 'success' : 'secondary'}>
                            {system.willOccupy ? 'Yes' : 'No'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(system.createdAt).toLocaleDateString()}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(system)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(system._id)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Settings