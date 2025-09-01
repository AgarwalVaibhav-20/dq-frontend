import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser } from '../../../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
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
  CSpinner,
  CImage
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import logo from '../../../assets/brand/logo-dark.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loading, error } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const data = await dispatch(loginUser({ email, password })).unwrap()
      console.log("Login response:", data)

      if (data.message === 'Login successful') {
        navigate('/otp', { state: { email } })
      }
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  // const handleLogin = async (e) => {
  //   e.preventDefault()
  //   // Dispatch the login action
  //   dispatch(loginUser({ email, password })).then((res) => {
  //     if (res.meta.requestStatus === 'fulfilled' && res.payload?.message === 'OTP sent to your email') {
  //       navigate('/otp', { state: { email } })
  //     }
  //   })
  // }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup className="flex-column flex-md-row">
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton type="submit" color="primary" className="px-4" disabled={loading}>
                          {loading ? <CSpinner as="span" size="sm" aria-hidden="true" /> : 'Login'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0">
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                  <p className="mt-3 text-center">
                    New user? <Link to="/register" className="text-primary fw-bold">Register</Link>
                  </p>

                </CCardBody>
              </CCard>
              <CCard className="text-white bg-white py-5 d-none d-md-block" style={{ width: '44%' }}>
                {/* Hide the image on small screens */}
                <CCardBody className="text-center">
                  <CImage fluid src={logo} />
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
