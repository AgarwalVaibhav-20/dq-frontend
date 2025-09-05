'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from "react-router-dom"
import { useDispatch, useSelector } from 'react-redux'
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  uploadRestaurantImage,
  checkRestaurantPermission,
} from '../../redux/slices/restaurantProfileSlice'

export default function Account() {
  const dispatch = useDispatch()
  const { userId } = useParams()
  const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)

  const [profileData, setProfileData] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [tempData, setTempData] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(!userId) 

  useEffect(() => {
    if (userId) {
      dispatch(getRestaurantProfile({ userId }))
        .then(({ payload }) => {
          console.log("Fetched profile payload:", payload)
          setProfileData(payload.user ?? payload)
          setTempData(payload.user ?? payload)
          dispatch(checkRestaurantPermission({ userId }))
        })
    } else {
      // ✅ If no userId → creating new profile
      setIsCreateMode(true)
      setEditMode(true)
      setTempData({})
    }
  }, [dispatch, userId])

  const handleEdit = () => {
    setTempData(profileData)
    setEditMode(true)
  }

  const handleCancel = () => {
    if (isCreateMode) {
      setTempData({})
    }
    setEditMode(false)
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      if (isCreateMode) {
        // ✅ Create new profile
        await dispatch(createRestaurantProfile(tempData))
        setIsCreateMode(false)
      } else {
        // ✅ Update existing
        await dispatch(updateRestaurantProfile(tempData))
      }
      setProfileData(tempData)
      setEditMode(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChange = (e) => {
    setTempData({ ...tempData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file && userId) {
      await dispatch(uploadRestaurantImage({ id: userId, imageFile: file }))
      const { payload } = await dispatch(getRestaurantProfile({ userId }))
      setProfileData(payload)
      setTempData(payload)
    }
  }

  const renderField = (field, label, type = "text") => (
    <div className="mb-3">
      <label className="fw-bold d-block mb-1">{label}</label>
      {editMode ? (
        <input
          type={type}
          name={field}
          value={tempData[field] || ''}
          onChange={handleChange}
          className="form-control"
        />
      ) : (
        <p className="mb-0">{profileData[field] || "data"}</p>
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
          {editMode && !isCreateMode && (
            <input
              type="file"
              className="form-control w-auto"
              onChange={handleImageUpload}
              accept="image/*"
            />
          )}
          <h5 className="mb-0 fw-bold">
            {profileData?.firstName} {profileData?.lastName}
          </h5>
          <p className="text-white-50 small">{profileData?.email}</p>
        </div>
      </div>

      {/* Body */}
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
              {renderField('firstName', 'First Name')}
              {renderField('lastName', 'Last Name')}
              {renderField('gender', 'Gender')}
              {renderField('phoneNumber', 'Phone Number')}
              {renderField('address', 'Address')}
              {renderField('pinCode', 'Pin Code')}
            </div>

            {/* Right Section */}
            <div className="col-md-6">
              <h6 className="fw-bold text-primary mb-3">Restaurant & Identity</h6>
              {renderField('restName', 'Restaurant Name')}
              {renderField('restaurantId', 'Restaurant ID')}
              {renderField('identity', 'Identity Type')}
              {renderField('identityNumber', 'Identity Number')}
              {renderField('email', 'Email', 'email')}
              {isCreateMode && renderField('password', 'Password', 'password')}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="card-footer text-center bg-light">
        {editMode ? (
          <>
            <button
              className="btn btn-success me-2"
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating
                ? "Saving..."
                : isCreateMode
                  ? "Create Profile"
                  : "Save"}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={handleEdit}>
            Edit Profile
          </button>
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
