import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CAlert,
  CSpinner,
} from '@coreui/react'
import axios from 'axios'
import { BASE_URL } from '../utils/constants'

const SystemSelectionModal = React.forwardRef(({
  showSystemModal,
  setShowSystemModal,
  onSystemSelect,
  selectedSystem,
}, ref) => {
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch systems when modal opens
  useEffect(() => {
    if (showSystemModal) {
      fetchSystems()
    }
  }, [showSystemModal])

  const fetchSystems = async () => {
    try {
      setLoading(true)
      setError('')
      const restaurantId = localStorage.getItem('restaurantId')
      const token = localStorage.getItem('authToken')

      if (!restaurantId || !token) {
        setError('Authentication required')
        return
      }

      console.log('Fetching settings for restaurantId:', restaurantId)

      // Fetch settings from your backend API
      const response = await axios.get(`${BASE_URL}/api/settings?restaurantId=${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Settings API response:', response.data)

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Transform the data to match expected format and filter by willOccupy
        const transformedSystems = response.data.data
          .filter(setting => setting.willOccupy === true) // Only show systems with willOccupy: true
          .map(setting => ({
            _id: setting._id,
            systemName: setting.systemName,
            chargeOfSystem: parseInt(setting.chargeOfSystem) || 0,
            willOccupy: setting.willOccupy,
            color: setting.color
          }))

        console.log('Filtered systems for modal (willOccupy: true):', transformedSystems)
        setSystems(transformedSystems)

        // If there's only one system, auto-select it
        if (!selectedSystem && transformedSystems.length === 1) {
          onSystemSelect(transformedSystems[0])
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
      onSystemSelect(system)
    }
  }

  const handleConfirm = () => {
    if (selectedSystem) {
      setShowSystemModal(false)
    }
  }

  return (
    <CModal visible={showSystemModal} onClose={() => setShowSystemModal(false)}>
      <CModalHeader>
        <CModalTitle>Select System</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center">
            <CSpinner color="primary" />
            <div className="mt-2">Loading systems...</div>
          </div>
        ) : error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : (
          <div>
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

            {selectedSystem && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6>Selected System Details:</h6>
                <p><strong>System Name:</strong> {selectedSystem.systemName}</p>
                <p><strong>System Charge:</strong> ₹{selectedSystem.chargeOfSystem}</p>
                <p><strong>Will Occupy:</strong> {selectedSystem.willOccupy ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setShowSystemModal(false)}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={handleConfirm}
          disabled={!selectedSystem}
        >
          Confirm
        </CButton>
      </CModalFooter>
    </CModal>
  )
})

SystemSelectionModal.displayName = 'SystemSelectionModal'

export default SystemSelectionModal