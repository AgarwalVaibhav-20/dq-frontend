// ResetPassword.jsx
import React, { useState } from "react";
import {
  CButton, CCard, CCardBody, CCardGroup, CCol,
  CContainer, CForm, CFormInput, CRow, CSpinner
} from "@coreui/react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { BASE_URL } from '../../../utils/constants';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || ""; // email from ForgotPassword

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/reset-password`, {
        email,
        otp,
        newPassword,
      });
      setSuccess(res.data.message);

      // Redirect to login after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xs={12} md={8} lg={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Reset Password</h1>
                    <p className="text-body-secondary">
                      Enter OTP and your new password
                    </p>

                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}

                    <CFormInput
                      type="text"
                      placeholder="OTP"
                      className="mb-3"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <CFormInput
                      type="password"
                      placeholder="New Password"
                      className="mb-3"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />

                    <CRow>
                      <CCol xs={12}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {loading ? <CSpinner as="span" size="sm" /> : "Reset Password"}
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

export default ResetPassword;
