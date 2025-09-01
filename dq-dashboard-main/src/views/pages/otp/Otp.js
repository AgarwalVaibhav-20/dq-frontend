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
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { messaging } from '../../../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { updateRestaurantFCM, resetFCMStatus } from '../../../redux/slices/restaurantProfileSlice';

const Otp = () => {
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const { loading, error } = useSelector((state) => state.auth);
  const { restaurantId } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Check if FCM is supported in this browser
        const isFcmSupported = await isSupported();
        if (!isFcmSupported) {
          console.warn('FCM not supported in this browser');
          return;
        }

        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          try {
            const messagingResolved = messaging;
            if (!messagingResolved) {
              throw new Error('Firebase messaging not initialized');
            }

            const currentToken = await getToken(messagingResolved, {
              vapidKey: 'BJoy8gqaZ4uYWH8U1itJbzcYkSy5qe7sa-Uyttgnikj7oGEQtl4LeI_PJipz4RHlBKi9Pq0PZn7ekHnpKbHim1U'
            });

            if (currentToken) {
              if (restaurantId) {
                dispatch(updateRestaurantFCM({
                  id: restaurantId,
                  fcm: { fcm: currentToken }
                }))
                .unwrap()
                .then(() => console.log('FCM token updated successfully'))
                .catch(err => console.error('Failed to update FCM token:', err));
              }
            } else {
              console.warn('No FCM token retrieved.');
            }
          } catch (err) {
            console.error('Error getting FCM token:', err);
          }
        } else {
          console.warn('Notification permission denied.');
        }
      } catch (error) {
        console.error('FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, [dispatch, restaurantId]);

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Email is missing. Please login again.');
      navigate('/login');
      return;
    }
    dispatch(verifyOtp({ otp, email })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xs={12} md={8} lg={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleOtpSubmit}>
                    <h1>Enter OTP</h1>
                    <p className="text-body-secondary">Please check your email for the OTP</p>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        placeholder="OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={12}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {loading ? <CSpinner as="span" size="sm" aria-hidden="true" /> : 'Verify OTP'}
                        </CButton>
                      </CCol>
                    </CRow>
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