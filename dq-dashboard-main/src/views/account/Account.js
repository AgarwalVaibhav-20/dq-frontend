'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux'
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  uploadRestaurantImage,
  checkRestaurantPermission
} from '../../redux/slices/restaurantProfileSlice'

export default function Account() {
  const dispatch = useDispatch()
  const { userId } = useParams()
  // const userId = useSelector((state) => state.auth.userId)
  const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)

  const [profileData, setProfileData] = useState({})
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)


  useEffect(() => {
    if (userId) {
      dispatch(getRestaurantProfile({ userId }))
        .then(({ payload }) => {
          setProfileData(payload);
          dispatch(checkRestaurantPermission({ userId }))
          console.log("Payload received:", payload); // <-- logs correctly
        })
    }
    console.log(userId)
  }, [dispatch, userId]);
  // useEffect(() => {
  //   if (userId) {
  //     dispatch(getRestaurantProfile({ userId }))
  //       .then(({ payload }) => setProfileData(payload))
  //   }
  //   console.log("Profile data fetched:", profileData);
  // }, [dispatch, userId])

  const handleEdit = (field) => {
    setEditingField(field)
    // setEditValue(restaurantProfile[field] || '')
    setEditValue(profileData[field] || '')
  }

  const handleUpdate = async (field) => {
    setIsUpdating(true)
    try {
      const updateData = { [field]: editValue }
      await dispatch(updateRestaurantProfile({ userId: localStorage.getItem("userId"), profileData: updateData }));

      setProfileData((prev) => ({ ...prev, [field]: editValue }))
      setEditingField(null)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file && userId) {
      await dispatch(uploadRestaurantImage({ id: userId, imageFile: file }))
      await dispatch(getRestaurantProfile({ userId }))
    }
  }

  const renderField = (field, label) => (
    <div className="mb-4">
      <label htmlFor={field} className="fw-bold d-block mb-1">{label}</label>
      {editingField === field ? (
        <div className="d-flex align-items-center mt-1">
          <input
            id={field}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="form-control me-2"
          />
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleUpdate(field)}
            disabled={isUpdating}
          >
            {isUpdating ? <span className="spinner-border spinner-border-sm"></span> : 'Update'}
          </button>
        </div>
      ) : (
        <div className="d-flex align-items-center mt-1">
          <span className="me-auto">{profileData[field] || '-'}</span>
          <button className="btn btn-primary btn-sm ms-2" onClick={() => handleEdit(field)}>
            Edit
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="card w-75 mx-auto my-5 shadow-lg border-0 rounded-4 overflow-hidden">
      {/* Header */}
      <div
        className="card-header text-white text-center py-4"
        style={{ background: "linear-gradient(90deg, #007bff, #0056d2)" }}
      >
        <div className="d-flex flex-column align-items-center">
          <img
            src={profileData?.profilePhoto || profileData?.image || '/default.png'}
            alt="Profile"
            width={120}
            height={120}
            className="rounded-circle border border-3 border-white shadow-sm mb-3"
          />
          <h5 className="mb-0 fw-bold">
            {profileData?.firstName} {profileData?.lastName}
          </h5>
          <p className="text-white-50 small">{profileData?.email}</p>
          <button
            className="btn btn-light btn-sm rounded-pill px-3 fw-semibold"
            onClick={() => document.getElementById('fileInput').click()}
          >
            Change Photo
          </button>
          <input
            type="file"
            id="fileInput"
            className="d-none"
            onChange={handleImageUpload}
            accept="image/*"
          />
        </div>
      </div>

      <div className="card-body p-4">
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="row gy-4">
            {/* Left Section */}
            <div className="col-md-6">
              <h6 className="fw-bold text-primary mb-3">Personal Information</h6>
              <div className="d-grid gap-3">
                {renderField('firstName', 'First Name')}
                {renderField('lastName', 'Last Name')}
                {renderField('gender', 'Gender')}
                {renderField('phoneNumber', 'Phone Number')}
                {renderField('address', 'Address')}
                {renderField('pinCode', 'Pin Code')}
              </div>
            </div>

            {/* Right Section */}
            <div className="col-md-6">
              <h6 className="fw-bold text-primary mb-3">Restaurant & Identity</h6>
              <div className="d-grid gap-3">
                {renderField('restName', 'Restaurant Name')}
                {renderField('restaurantId', 'Restaurant ID')}
                {renderField('identity', 'Identity Type')}
                {renderField('identityNumber', 'Identity Number')}
                {renderField('email', 'Email')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



// 'use client'
// import React, { useState, useEffect } from 'react'
// import {
//   CCard,
//   CCardHeader,
//   CCardBody,
//   CCardTitle,
//   CRow,
//   CCol,
//   CButton,
//   CFormInput,
//   CFormLabel,
//   CImage,
//   CSpinner,
// } from '@coreui/react'
// import { useDispatch, useSelector } from 'react-redux'
// import {
//   getRestaurantProfile,
//   updateRestaurantProfile,
//   uploadRestaurantImage,
// } from '../../redux/slices/restaurantProfileSlice'

// export default function Account() {
//   const dispatch = useDispatch()
//   const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)

//   // ✅ Initialize userId from Redux auth state
//   const authUserId = useSelector((state) => state.auth.userId)
//   const [userId, setUserId] = useState(authUserId || null)

//   const [profileData, setProfileData] = useState({})
//   const [editingField, setEditingField] = useState(null)
//   const [editValue, setEditValue] = useState('')
//   const [isUpdating, setIsUpdating] = useState(false)
//   useEffect(() => {
//     if (userId) {
//       dispatch(getRestaurantProfile({ userId }))
//         .then(({ payload }) => setProfileData(payload))
//     }
//   }, [dispatch, userId])

//   const handleEdit = (field) => {
//     setEditingField(field)
//     setEditValue(profileData[field] || '')
//   }

//   const handleUpdate = async (field) => {
//     setIsUpdating(true)
//     try {
//       const updateData = {
//         [field]: editValue,
//         userId
//       }

//       await dispatch(updateRestaurantProfile({
//         userId,
//         profileData: updateData
//       }))

//       setProfileData((prev) => ({ ...prev, [field]: editValue }))
//       setEditingField(null)
//     } catch (error) {
//       console.error('Error updating profile:', error)
//     } finally {
//       setIsUpdating(false)
//     }
//   }

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0]
//     if (file && userId) {
//       await dispatch(uploadRestaurantImage({ id: userId, imageFile: file }))
//       await dispatch(getRestaurantProfile({ userId }))
//     }
//   }

//   const renderField = (field, label) => (
//     <div className="mb-4">
//       <CFormLabel htmlFor={field} className="fw-bold">
//         {label}
//       </CFormLabel>
//       {editingField === field ? (
//         <div className="d-flex align-items-center mt-1">
//           <CFormInput
//             id={field}
//             value={editValue}
//             onChange={(e) => setEditValue(e.target.value)}
//             className="me-2"
//           />
//           <CButton
//             color="success"
//             size="sm"
//             onClick={() => handleUpdate(field)}
//             disabled={isUpdating}
//           >
//             {isUpdating ? <CSpinner size="sm" /> : 'Update'}
//           </CButton>
//         </div>
//       ) : (
//         <div className="d-flex align-items-center mt-1">
//           <span className="me-auto">{profileData[field] || '-'}</span>
//           <CButton color="primary" size="sm" className="ms-2" onClick={() => handleEdit(field)}>
//             Edit
//           </CButton>
//         </div>
//       )}
//     </div>
//   )

//   return (
//     <CCard className="w-75 mx-auto my-5 shadow-lg border-0 rounded-4 overflow-hidden">
//       {/* Header */}
//       <CCardHeader className="bg-gradient text-white text-center py-4" style={{ background: "linear-gradient(90deg, #007bff, #0056d2)" }}>
//         <div className="d-flex flex-column align-items-center">
//           <CImage
//             roundedCircle
//             src={profileData?.profilePhoto}
//             alt="Profile"
//             width={120}
//             height={120}
//             className="border border-3 border-white shadow-sm mb-3"
//           />
//           <CCardTitle className="mb-0 fs-4 fw-bold">
//             {profileData?.firstName} {profileData?.lastName}
//           </CCardTitle>
//           <p className="text-white-50 small">{profileData?.email}</p>
//           <CButton
//             color="light"
//             size="sm"
//             className="rounded-pill px-3 fw-semibold"
//             onClick={() => document.getElementById('fileInput').click()}
//           >
//             Change Photo
//           </CButton>
//           <CFormInput
//             type="file"
//             id="fileInput"
//             className="d-none"
//             onChange={handleImageUpload}
//             accept="image/*"
//           />
//         </div>
//       </CCardHeader>

//       <CCardBody className="p-4">
//         {loading ? (
//           <div className="text-center my-5">
//             <CSpinner color="primary" />
//           </div>
//         ) : (
//           <CRow className="gy-4">
//             {/* Left Section - Personal Info */}
//             <CCol md={6}>
//               <h6 className="fw-bold text-primary mb-3">Personal Information</h6>
//               <div className="d-grid gap-3">
//                 {renderField('firstName', 'First Name')}
//                 {renderField('lastName', 'Last Name')}
//                 {renderField('gender', 'Gender')}
//                 {renderField('phoneNumber', 'Phone Number')}
//                 {renderField('address', 'Address')}
//                 {renderField('pinCode', 'Pin Code')}
//               </div>
//             </CCol>

//             {/* Right Section - Restaurant Info */}
//             <CCol md={6}>
//               <h6 className="fw-bold text-primary mb-3">Restaurant & Identity</h6>
//               <div className="d-grid gap-3">
//                 {renderField('restName', 'Restaurant Name')}
//                 {renderField('restaurantId', 'Restaurant ID')}
//                 {renderField('identity', 'Identity Type')}
//                 {renderField('identityNumber', 'Identity Number')}
//                 {renderField('email', 'Email')}
//               </div>
//             </CCol>
//           </CRow>
//         )}
//       </CCardBody>
//     </CCard>
//   )
// }
