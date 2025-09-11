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
import { fetchUserProfile } from '../../redux/slices/authSlice'

export default function Account() {
  const dispatch = useDispatch()
  const userId = localStorage.getItem('userId')
  const { restaurantProfile, loading } = useSelector((state) => state.restaurantProfile)

  const [profileData, setProfileData] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [tempData, setTempData] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(!userId)
  const token = localStorage.getItem('authToken')

  useEffect(() => {
    if (userId && token) {
      // ✅ Fetch user profile first
      dispatch(fetchUserProfile({ userId, token }))
        .then(({ payload }) => {
          console.log("Fetched user profile payload:", payload)
          // Handle user profile data structure
          const userData = payload.user || {}
          const userProfileData = payload.profile || {}

          // Combine user and profile data
          const combinedData = {
            ...userData,
            ...userProfileData,
          }

          setProfileData(combinedData)
          setTempData(combinedData)
        })
        .catch((error) => {
          console.log("User profile fetch failed:", error)
        })

      // ✅ Fetch restaurant details if restaurantId exists
      // You might need to get restaurantId from user profile or use userId if that's your setup
      dispatch(getRestaurantProfile({ restaurantId: userId, token }))
        .then(({ payload }) => {
          console.log("Fetched restaurant payload:", payload)
          // Handle restaurant data structure
          const restaurantData = payload.restaurant || {}

          // Merge with existing profile data
          setProfileData(prevData => ({
            ...prevData,
            ...restaurantData,
          }))
          setTempData(prevData => ({
            ...prevData,
            ...restaurantData,
          }))
        })
        .catch((error) => {
          console.log("Restaurant profile fetch failed:", error)
          // This is OK if no restaurant profile exists yet
        })

      // Check permissions separately
      dispatch(checkRestaurantPermission({ userId, token }))
        .then((result) => {
          console.log("Permission check result:", result)
        })
        .catch((error) => {
          console.log("Permission check failed:", error)
        })
    } else {
      setIsCreateMode(true)
      setEditMode(true)
      setTempData({})
    }
  }, [dispatch, userId, token])

  const handleEdit = () => {
    setTempData(profileData)
    setEditMode(true)
  }

  const handleCancel = () => {
    if (isCreateMode) {
      setTempData({})
    } else {
      setTempData(profileData) // ✅ Reset to original data
    }
    setEditMode(false)
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      if (isCreateMode) {
        // ✅ Create new profile - make sure this action exists
        await dispatch(createRestaurantProfile(tempData))
        setIsCreateMode(false)
      } else {
        // ✅ Update existing
        await dispatch(updateRestaurantProfile({ ...tempData, userId, token }))
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
      try {
        await dispatch(uploadRestaurantImage({ id: userId, imageFile: file }))
        // Refresh the profile data after image upload
        const { payload } = await dispatch(fetchUserProfile({ userId, token }))
        const userData = payload.user || {}
        const userProfileData = payload.profile || {}
        const combinedData = { ...userData, ...userProfileData }

        setProfileData(combinedData)
        setTempData(combinedData)
      } catch (error) {
        console.error('Image upload failed:', error)
      }
    }
  }

  const renderField = (field, label, type = "text", toUpper = false) => (
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
        <p className="mb-0">
          {toUpper
            ? (profileData[field]?.toUpperCase() || "DATA")
            : (profileData[field] || "data")}
        </p>
      )}
    </div>
  )

  // ✅ Add debugging info
  console.log("Current profileData:", profileData)
  console.log("Current tempData:", tempData)
  console.log("Loading state:", loading)

  return (
    <div className="card w-75 mx-auto my-5 shadow-lg border-0 rounded-4 overflow-hidden">
      {/* Header */}
      <div
        className="card-header text-white text-center py-4"
        style={{ background: "linear-gradient(90deg, #007bff, #0056d2)" }}
      >
        <div className="d-flex flex-column align-items-center">
          <img
            src={profileData?.profileImage || profileData?.image || '/default.png'}
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
              {renderField('restaurantId', 'Restaurant ID', 'text', true)}
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