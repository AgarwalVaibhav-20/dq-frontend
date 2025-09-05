// ForgotPassword.jsx
import React, { useState } from "react";
import {
  CButton, CCard, CCardBody, CCardGroup, CCol,
  CContainer, CForm, CFormInput, CRow, CSpinner
} from "@coreui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/forgot-password", { email });
      setSuccess(res.data.message);

      // Navigate to ResetPassword and pass email
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
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
                    <h1>Forgot Password</h1>
                    <p className="text-body-secondary">
                      Enter your email to receive an OTP
                    </p>

                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}

                    <CFormInput
                      type="email"
                      placeholder="Email"
                      className="mb-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <CRow>
                      <CCol xs={12}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {loading ? <CSpinner as="span" size="sm" /> : "Send OTP"}
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

export default ForgotPassword;
