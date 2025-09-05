import React from 'react'
import { CContainer, CRow, CCol, CCard, CCardBody, CCardHeader } from '@coreui/react'

const Help = () => {
  return (
    <CContainer className="mt-5">
      <CRow className="justify-content-center">
        <CCol md={6}>
          <CCard className="shadow-lg">
            <CCardHeader className="bg-primary text-white text-center">
              <h3>Help & Support</h3>
            </CCardHeader>
            <CCardBody className="text-center">
              <p className="fs-5">Need assistance? We're here to help!</p>
              <p className="fw-bold">For support, please reach us at:</p>
              <p className="text-primary fw-semibold">info@letsdq.com</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Help
