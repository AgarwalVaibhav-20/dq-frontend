import React from 'react'
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader } from '@coreui/react'

const Downloads = () => {
  return (
    <CContainer className="mt-5">
      <CRow className="justify-content-center">
        <CCol md={6}>
          <CCard className="shadow-lg">
            <CCardHeader className="bg-primary text-white text-center">
              <h3>Downloads</h3>
            </CCardHeader>
            <CCardBody className="text-center">
              <p className="fs-5">
                This section will provide downloadable resources for restaurant management, including reports, invoices, and guidelines.
              </p>
              <p className="text-muted">
                Stay tuned for future updates on downloading important documents.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Downloads
