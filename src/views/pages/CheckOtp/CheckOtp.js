// src/components/Otp.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp } from '../../../redux/slices/authSlice';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked } from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { updateRestaurantFCM } from '../../../redux/slices/restaurantProfileSlice';

const Otp = () => {
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const { loading, error } = useSelector((state) => state.auth);

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Email is missing. Please login again.');
      navigate('/login');
      return;
    }
    dispatch(verifyOtp({ otp, email })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        navigate('/login-activity');
      }
    });
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xs={12} md={8} lg={5}>
            <CCardGroup>
              <CCard className="p-4 shadow-lg border-0 rounded-4">
                <CCardBody>
                  <CForm onSubmit={handleOtpSubmit} className="text-center">
                    <h2 className="fw-bold mb-3">OTP Verification</h2>
                    <p className="text-body-secondary mb-4">
                      Enter the 6-digit code sent to your email
                      <br />
                      <span className="fw-semibold text-dark">{email}</span>
                    </p>

                    {error && (
                      <p className="text-danger fw-semibold mb-3">{error}</p>
                    )}

                    <CInputGroup className="mb-4 justify-content-center">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                        className="text-center fw-bold fs-5"
                      />
                    </CInputGroup>

                    <CRow className="mb-3">
                      <CCol xs={12}>
                        <CButton
                          type="submit"
                          color="primary"
                          className="px-5 w-100 fw-semibold"
                          disabled={loading}
                        >
                          {loading ? (
                            <CSpinner as="span" size="sm" aria-hidden="true" />
                          ) : (
                            'Verify OTP'
                          )}
                        </CButton>
                      </CCol>
                    </CRow>

                    <p className="small text-muted mt-3">
                      Didn’t receive the code? <a href="#">Resend OTP</a>
                    </p>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Otp;
