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
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import { toast } from 'react-toastify'
import axios from 'axios'
import axiosInstance from '../../utils/axiosConfig'
import { BASE_URL } from '../../utils/constants'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilPlus, cilTrash, cilPencil, cilSave, cilMoney } from '@coreui/icons'

const Settings = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('system')

  // System state
  const [systemFormData, setSystemFormData] = useState({
    systemName: '',
    chargeOfSystem: '',
    willOccupy: false,
    color: '#ff0000',
  })
  const [systems, setSystems] = useState([])
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemSaving, setSystemSaving] = useState(false)
  const [systemError, setSystemError] = useState('')
  const [editingSystem, setEditingSystem] = useState(null)

  // Tax state
  const [taxFormData, setTaxFormData] = useState({
    taxName: '',
    taxCharge: '',
    taxType: 'percentage',
  })
  const [taxes, setTaxes] = useState([])
  const [taxLoading, setTaxLoading] = useState(false)
  const [taxSaving, setTaxSaving] = useState(false)
  const [taxError, setTaxError] = useState('')
  const [editingTax, setEditingTax] = useState(null)

  // Fetch all systems and taxes on component mount
  useEffect(() => {
    fetchSystems()
    fetchTaxes()
  }, [])

  // System functions
  const fetchSystems = async () => {
    try {
      setSystemLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/settings?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setSystems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
      if (error.response?.status !== 404) {
        setSystemError('Failed to fetch systems')
        toast.error('Failed to fetch systems')
      }
    } finally {
      setSystemLoading(false)
    }
  }

  const handleSystemInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSystemFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'willOccupy' ? value === 'true' : value)
    }))
    setSystemError('')
  }

  const handleSystemSubmit = async (e) => {
    e.preventDefault()

    if (!systemFormData.systemName.trim()) {
      setSystemError('System name is required')
      return
    }

    if (!systemFormData.chargeOfSystem.trim()) {
      setSystemError('Charge of system is required')
      return
    }

    if (systemFormData.willOccupy && systemFormData.color) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(systemFormData.color)) {
        setSystemError('Please enter a valid hex color code (e.g., #FF0000)')
        return
      }
    }

    try {
      setSystemSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      const dataToSend = {
        systemName: systemFormData.systemName.trim(),
        chargeOfSystem: systemFormData.chargeOfSystem,
        willOccupy: systemFormData.willOccupy,
        restaurantId
      };
 
      if (systemFormData.willOccupy && systemFormData.color) {
        dataToSend.color = systemFormData.color;
      }

      if (editingSystem) {
        const response = await axiosInstance.put(`/api/settings/${editingSystem._id}`, dataToSend)

        if (response.data.success) {
          toast.success('System updated successfully!')
          setEditingSystem(null)
        } else {
          setSystemError(response.data.message || 'Failed to update system')
          toast.error('Failed to update system')
        }
      } else {
        // Create new system
        const response = await axiosInstance.post(`/api/settings`, dataToSend)

        if (response.data.success) {
          toast.success('System added successfully!')
        } else {
          setSystemError(response.data.message || 'Failed to add system')
          toast.error('Failed to add system')
        }
      }

      setSystemError('')
      setSystemFormData({
        systemName: '',
        chargeOfSystem: '',
        willOccupy: false,
        color: '#ff0000', // Reset to default color
      })
      
      // Refresh the systems list
      fetchSystems()
    } catch (error) {
      console.error('Error saving system:', error)
      setSystemError('Failed to save system')
      toast.error('Failed to save system')
    } finally {
      setSystemSaving(false)
    }
  }

  const handleSystemEdit = (system) => {
    setEditingSystem(system)
    setSystemFormData({
      systemName: system.systemName,
      chargeOfSystem: system.chargeOfSystem,
      willOccupy: system.willOccupy,
      color: system.color || '#ff0000', // Default if color not present
    })
  }

  const handleSystemDelete = async (systemId) => {
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

  const handleSystemCancel = () => {
    setEditingSystem(null)
    setSystemFormData({
      systemName: '',
      chargeOfSystem: '',
      willOccupy: false,
      color: '#ff0000', // Add default color
    })
    setSystemError('')
  }

  // Tax functions
  const fetchTaxes = async () => {
    try {
      setTaxLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/tax?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setTaxes(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching taxes:', error)
      if (error.response?.status !== 404) {
        setTaxError('Failed to fetch taxes')
        toast.error('Failed to fetch taxes')
      }
    } finally {
      setTaxLoading(false)
    }
  }

  const handleTaxInputChange = (e) => {
    const { name, value } = e.target
    setTaxFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setTaxError('')
  }

  const handleTaxSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!taxFormData.taxName.trim()) {
      setTaxError('Tax name is required')
      return
    }

    if (!taxFormData.taxCharge.trim()) {
      setTaxError('Tax charge is required')
      return
    }

    // Validate tax charge based on type
    const chargeValue = parseFloat(taxFormData.taxCharge)
    if (isNaN(chargeValue) || chargeValue < 0) {
      setTaxError('Tax charge must be a valid positive number')
      return
    }

    if (taxFormData.taxType === 'percentage' && chargeValue > 100) {
      setTaxError('Percentage tax cannot exceed 100%')
      return
    }

    try {
      setTaxSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      if (editingTax) {
        // Update existing tax
        const response = await axiosInstance.put(`/api/tax/${editingTax._id}`, {
          ...taxFormData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('Tax updated successfully!')
          setEditingTax(null)
        } else {
          setTaxError(response.data.message || 'Failed to update tax')
          toast.error('Failed to update tax')
        }
      } else {
        // Create new tax
        const response = await axiosInstance.post(`/api/tax`, {
          ...taxFormData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('Tax added successfully!')
        } else {
          setTaxError(response.data.message || 'Failed to add tax')
          toast.error('Failed to add tax')
        }
      }

      setTaxError('')
      setTaxFormData({
        taxName: '',
        taxCharge: '',
        taxType: 'percentage',
      })
      // Refresh the taxes list
      fetchTaxes()
    } catch (error) {
      console.error('Error saving tax:', error)
      setTaxError('Failed to save tax')
      toast.error('Failed to save tax')
    } finally {
      setTaxSaving(false)
    }
  }

  const handleTaxEdit = (tax) => {
    setEditingTax(tax)
    setTaxFormData({
      taxName: tax.taxName,
      taxCharge: tax.taxCharge,
      taxType: tax.taxType,
    })
  }

  const handleTaxDelete = async (taxId) => {
    if (window.confirm('Are you sure you want to delete this tax?')) {
      try {
        const response = await axiosInstance.delete(`/api/tax/${taxId}`)

        if (response.data.success) {
          toast.success('Tax deleted successfully!')
          fetchTaxes()
        } else {
          toast.error('Failed to delete tax')
        }
      } catch (error) {
        console.error('Error deleting tax:', error)
        toast.error('Failed to delete tax')
      }
    }
  }

  const handleTaxCancel = () => {
    setEditingTax(null)
    setTaxFormData({
      taxName: '',
      taxCharge: '',
      taxType: 'percentage',
    })
    setTaxError('')
  }

  const formatTaxCharge = (charge, type) => {
    if (type === 'percentage') {
      return `${charge}%`
    } else {
      return `₹${charge}`
    }
  }

  return (
    <CContainer>
      {/* Tab Navigation */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <CCardTitle>
                <CIcon icon={cilSettings} className="me-2" />
                Settings Management
              </CCardTitle>
            </CCardHeader>
            <CCardBody>
              <CNav variant="tabs" role="tablist">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'system'}
                    onClick={() => setActiveTab('system')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilSettings} className="me-2" />
                    System Settings
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'tax'}
                    onClick={() => setActiveTab('tax')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilMoney} className="me-2" />
                    Tax Settings
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CTabContent>
        {/* System Tab */}
        <CTabPane role="tabpanel" aria-labelledby="system-tab" visible={activeTab === 'system'}>
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
                  {systemError && (
                    <CAlert color="danger" className="mb-3">
                      {systemError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleSystemSubmit}>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="systemName">System Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="systemName"
                          name="systemName"
                          value={systemFormData.systemName}
                          onChange={handleSystemInputChange}
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
                          value={systemFormData.chargeOfSystem}
                          onChange={handleSystemInputChange}
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
                          value={systemFormData.willOccupy.toString()}
                          onChange={handleSystemInputChange}
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </CFormSelect>
                      </CCol>

                      {/* Conditional Color Picker - Show only when willOccupy is true */}
                      {systemFormData.willOccupy && (
                        <CCol md={6}>
                          <CFormLabel htmlFor="color">Choose Table Color</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <CFormInput
                              type="color"
                              id="color"
                              name="color"
                              value={systemFormData.color}
                              onChange={handleSystemInputChange}
                              className="form-control-color"
                              style={{
                                width: '60px',
                                height: '38px',
                                padding: '4px',
                                cursor: 'pointer'
                              }}
                              title="Choose table color"
                            />
                            <CFormInput
                              type="text"
                              name="color"
                              value={systemFormData.color}
                              onChange={(e) => {
                                const value = e.target.value
                                if (/^#[0-9A-F]{0,6}$/i.test(value) || value === '') {
                                  handleSystemInputChange(e)
                                }
                              }}
                              placeholder="#FF0000"
                              maxLength={7}
                              className="flex-grow-1"
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                          <small className="text-muted">
                            Selected color will be used to highlight occupied tables
                          </small>
                        </CCol>
                      )}
                    </CRow>

                    <CRow>
                      <CCol>
                        <CButton
                          type="submit"
                          color="primary"
                          disabled={systemSaving}
                          className="me-2"
                        >
                          {systemSaving ? (
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
                            onClick={handleSystemCancel}
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
                        setSystemFormData({
                          systemName: '',
                          chargeOfSystem: '',
                          willOccupy: false,
                          color: '#ff0000', // Add default color
                        })
                        setSystemError('')
                      }}
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add New
                    </CButton>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={fetchSystems}
                      disabled={systemLoading}
                    >
                      {systemLoading ? <CSpinner size="sm" /> : 'Refresh'}
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {systemLoading ? (
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
                          <CTableHeaderCell>Color</CTableHeaderCell>
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
                              {system.willOccupy && system.color ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      backgroundColor: system.color,
                                      borderRadius: '4px',
                                      border: '2px solid #ffffff',
                                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                    }}
                                    title={`Color: ${system.color}`}
                                  />
                                  <small className="text-muted" style={{ fontFamily: 'monospace' }}>
                                    {system.color}
                                  </small>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {new Date(system.createdAt).toLocaleDateString()}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleSystemEdit(system)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleSystemDelete(system._id)}
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
        </CTabPane>

        {/* Tax Tab */}
        <CTabPane role="tabpanel" aria-labelledby="tax-tab" visible={activeTab === 'tax'}>
          {/* Add/Edit Tax Form */}
          <CRow className="mb-4">
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle>
                    <CIcon icon={cilMoney} className="me-2" />
                    {editingTax ? 'Edit Tax' : 'Add New Tax'}
                  </CCardTitle>
                </CCardHeader>
                <CCardBody>
                  {taxError && (
                    <CAlert color="danger" className="mb-3">
                      {taxError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleTaxSubmit}>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxName">Tax Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="taxName"
                          name="taxName"
                          value={taxFormData.taxName}
                          onChange={handleTaxInputChange}
                          placeholder="Enter tax name (e.g., GST, VAT)"
                          required
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxCharge">Tax Charge</CFormLabel>
                        <CFormInput
                          type="number"
                          id="taxCharge"
                          name="taxCharge"
                          value={taxFormData.taxCharge}
                          onChange={handleTaxInputChange}
                          placeholder="Enter tax charge"
                          min="0"
                          step="0.01"
                          required
                        />
                      </CCol>
                    </CRow>

                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxType">Tax Type</CFormLabel>
                        <CFormSelect
                          id="taxType"
                          name="taxType"
                          value={taxFormData.taxType}
                          onChange={handleTaxInputChange}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </CFormSelect>
                      </CCol>
                    </CRow>

                    <CRow>
                      <CCol>
                        <CButton
                          type="submit"
                          color="primary"
                          disabled={taxSaving}
                          className="me-2"
                        >
                          {taxSaving ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              {editingTax ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilSave} className="me-2" />
                              {editingTax ? 'Update Tax' : 'Add Tax'}
                            </>
                          )}
                        </CButton>
                        {editingTax && (
                          <CButton
                            color="secondary"
                            onClick={handleTaxCancel}
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

          {/* Taxes List */}
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <CCardTitle>Tax Settings</CCardTitle>
                  <div>
                    <CButton
                      color="success"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setEditingTax(null)
                        setTaxFormData({
                          taxName: '',
                          taxCharge: '',
                          taxType: 'percentage',
                        })
                        setTaxError('')
                      }}
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add New
                    </CButton>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={fetchTaxes}
                      disabled={taxLoading}
                    >
                      {taxLoading ? <CSpinner size="sm" /> : 'Refresh'}
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {taxLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading taxes...</p>
                    </div>
                  ) : taxes.length === 0 ? (
                    <div className="text-center py-4">
                      <CIcon icon={cilMoney} size="3xl" className="text-muted" />
                      <p className="mt-2 text-muted">No taxes found. Add your first tax above.</p>
                    </div>
                  ) : (
                    <CTable responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Tax Name</CTableHeaderCell>
                          <CTableHeaderCell>Charge</CTableHeaderCell>
                          <CTableHeaderCell>Type</CTableHeaderCell>
                          <CTableHeaderCell>Created</CTableHeaderCell>
                          <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {taxes.map((tax) => (
                          <CTableRow key={tax._id}>
                            <CTableDataCell>
                              <div className="d-flex align-items-center">
                                <CIcon icon={cilMoney} className="me-2" />
                                {tax.taxName}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="info">
                                {formatTaxCharge(tax.taxCharge, tax.taxType)}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={tax.taxType === 'percentage' ? 'success' : 'warning'}>
                                {tax.taxType === 'percentage' ? 'Percentage' : 'Fixed'}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {new Date(tax.createdAt).toLocaleDateString()}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleTaxEdit(tax)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleTaxDelete(tax._id)}
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
        </CTabPane>
      </CTabContent>
    </CContainer>
  )
}

export default Settings
