import React from 'react'
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader } from '@coreui/react'

const License = () => {
  return (
    <CContainer className="mt-5">
      <CRow className="justify-content-center">
        <CCol md={6}>
          <CCard className="shadow-lg">
            <CCardHeader className="bg-primary text-white text-center">
              <h3>Restaurant License Management</h3>
            </CCardHeader>
            <CCardBody className="text-center">
              <p className="fs-5">
                This section will allow restaurants to upload and manage their licenses in the future.
              </p>
              <p className="text-muted">
                Stay tuned for upcoming updates on license verification and compliance tracking.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default License
