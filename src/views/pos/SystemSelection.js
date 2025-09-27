import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormSelect,
  CAlert,
  CSpinner,
} from '@coreui/react'
import axios from 'axios'
import { BASE_URL } from '../../utils/constants'

const SystemSelection = () => {
  const navigate = useNavigate()
  const { tableNumber } = useParams()
  const [systems, setSystems] = useState([])
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch systems when component mounts
  useEffect(() => {
    fetchSystems()
  }, [])

  const fetchSystems = async () => {
    try {
      setLoading(true)
      setError('')
      const restaurantId = localStorage.getItem('restaurantId') || '68cae19c377caa90e86f84a4' // Fallback for testing
      
      console.log('SystemSelection - restaurantId:', restaurantId)
      console.log('SystemSelection - localStorage restaurantId:', localStorage.getItem('restaurantId'))
      
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setError('Authentication required')
        return
      }

      console.log('SystemSelection - Fetching settings for restaurantId:', restaurantId)
      
      // Fetch settings from your backend API
      const response = await axios.get(`${BASE_URL}/api/settings?restaurantId=${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('SystemSelection - Settings API response:', response.data)

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Transform the data to match expected format
        const transformedSystems = response.data.data.map(setting => ({
          _id: setting._id,
          systemName: setting.systemName,
          chargeOfSystem: parseInt(setting.chargeOfSystem) || 0,
          willOccupy: setting.willOccupy
        }))
        
        setSystems(transformedSystems)
        // Auto-select if only one system
        if (!selectedSystem && transformedSystems.length === 1) {
          setSelectedSystem(transformedSystems[0])
        }
      } else {
        setError('No system settings found. Please configure system settings first.')
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
      setError('Failed to fetch system settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSystemChange = (e) => {
    const systemId = e.target.value
    const system = systems.find(s => s._id === systemId)
    if (system) {
      setSelectedSystem(system)
    }
  }

  const handleProceed = () => {
    if (selectedSystem) {
      // Save selected system to localStorage
      localStorage.setItem(`selectedSystem_${tableNumber}`, JSON.stringify(selectedSystem))
      // Navigate to the table-specific POS page with system context
      navigate(`/pos/system/tableNumber/${tableNumber}`)
    }
  }

  const handleBack = () => {
    navigate('/pos')
  }

  return (
    <CContainer className="mt-5">
      <CRow className="justify-content-center">
        <CCol md={6}>
          <CCard>
            <CCardHeader className="text-center">
              <h4>Select System for Table {tableNumber}</h4>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                  <div className="mt-2">Loading systems...</div>
                </div>
              ) : error ? (
                <CAlert color="danger">{error}</CAlert>
              ) : (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Select System:</label>
                    <CFormSelect
                      value={selectedSystem?._id || ''}
                      onChange={handleSystemChange}
                    >
                      <option value="">Choose a system...</option>
                      {systems.map((system) => (
                        <option key={system._id} value={system._id}>
                          {system.systemName} - ₹{system.chargeOfSystem}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                  
                  {selectedSystem && (
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6>Selected System Details:</h6>
                      <p><strong>System Name:</strong> {selectedSystem.systemName}</p>
                      <p><strong>System Charge:</strong> ₹{selectedSystem.chargeOfSystem}</p>
                      <p><strong>Will Occupy:</strong> {selectedSystem.willOccupy ? 'Yes' : 'No'}</p>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <CButton color="secondary" onClick={handleBack} className="flex-fill">
                      Back to Tables
                    </CButton>
                    <CButton 
                      color="primary" 
                      onClick={handleProceed}
                      disabled={!selectedSystem}
                      className="flex-fill"
                    >
                      Proceed to POS
                    </CButton>
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default SystemSelection
