import React, { useState } from "react";
import {
  CButton,
  CSpinner,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from '../../../redux/slices/authSlice'
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    dispatch(registerUser({ username, email, password }))
      .unwrap()
      .then(() => {
        navigate("/login"); // ✅ navigate to OTP/verify page
      })
      .catch(() => { });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-2">
      <CContainer fluid>
        <CRow className="justify-content-center">
          <CCol xs={12} sm={10} md={8} lg={6} xl={5}>
            <CCard className="shadow rounded-4 overflow-hidden">
              <CCardBody className="p-4 p-md-5">
                {/* Branding / Logo */}
                <div className="d-flex flex-column align-items-center mb-4">
                  <img
                    src="/favicon.ico"
                    alt="Foodie Logo"
                    className="mb-3 img-fluid"
                    style={{ maxHeight: '100px', width: 'auto' }}
                  />
                  <h3 className="fw-bold">Register</h3>
                  <p className="text-muted small">
                    Create your account to start ordering your favorite meals
                  </p>
                </div>


                <CForm onSubmit={handleSubmit}>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      placeholder="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </CInputGroup>

                  {error && <p className="text-danger small mb-3">{error}</p>}

                  <div className="d-grid mb-3">
                    <CButton color="primary" size="lg" type="submit" disabled={loading}>
                      {loading ? (
                        <span>
                          <CSpinner size="sm" className="me-2" /> Creating...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </CButton>
                  </div>

                  <p className="text-center text-muted small">
                    Already have an account? <a href="/login" className="fw-semibold text-decoration-none">Login</a>
                  </p>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>

    // <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
    //   <CContainer>
    //     <CRow className="justify-content-center">
    //       <CCol md={9} lg={7} xl={6}>
    //         <CCard className="mx-4">
    //           <CCardBody className="p-4">
    //             <CForm onSubmit={handleSubmit}>
    //               <h1>Register</h1>
    //               <p className="text-body-secondary">Create your account</p>

    //               <CInputGroup className="mb-3">
    //                 <CInputGroupText>
    //                   <CIcon icon={cilUser} />
    //                 </CInputGroupText>
    //                 <CFormInput
    //                   placeholder="Username"
    //                   value={username}
    //                   onChange={(e) => setUsername(e.target.value)}
    //                 />
    //               </CInputGroup>

    //               <CInputGroup className="mb-3">
    //                 <CInputGroupText>@</CInputGroupText>
    //                 <CFormInput
    //                   placeholder="Email"
    //                   type="email"
    //                   value={email}
    //                   onChange={(e) => setEmail(e.target.value)}
    //                 />
    //               </CInputGroup>

    //               <CInputGroup className="mb-3">
    //                 <CInputGroupText>
    //                   <CIcon icon={cilLockLocked} />
    //                 </CInputGroupText>
    //                 <CFormInput
    //                   type="password"
    //                   placeholder="Password"
    //                   value={password}
    //                   onChange={(e) => setPassword(e.target.value)}
    //                 />
    //               </CInputGroup>

    //               <CInputGroup className="mb-4">
    //                 <CInputGroupText>
    //                   <CIcon icon={cilLockLocked} />
    //                 </CInputGroupText>
    //                 <CFormInput
    //                   type="password"
    //                   placeholder="Repeat password"
    //                   value={confirmPassword}
    //                   onChange={(e) => setConfirmPassword(e.target.value)}
    //                 />
    //               </CInputGroup>

    //               {error && <p className="text-danger">{error}</p>}

    //               <div className="d-grid">
    //                 <CButton color="success" type="submit" disabled={loading}>
    //                   {loading ? "Creating..." : "Create Account"}
    //                 </CButton>
    //               </div>
    //             </CForm>
    //           </CCardBody>
    //         </CCard>
    //       </CCol>
    //     </CRow>
    //   </CContainer>
    // </div>
  );
};

export default Register;
