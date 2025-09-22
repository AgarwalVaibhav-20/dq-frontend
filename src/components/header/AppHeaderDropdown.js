import React, { useEffect, useRef, useState } from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilLockLocked, cilSettings, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { localLogout, fetchRestaurantDetails } from '../../redux/slices/authSlice'
import { fetchNotificationOrders } from '../../redux/slices/orderSlice'
import { toast } from 'react-toastify'
import useSound from 'use-sound'
import notificationSound from '../../assets/notification.mp3'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'
import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const dispatch = useDispatch()
  const { userId, restaurantId, token, auth } = useSelector(
    (state) => ({
      userId: state.auth.userId,
      restaurantId: state.auth.restaurantId,
      token: state.auth.token,
      auth: state.auth.auth,
    }),
    shallowEqual,
  )
    // 🔄 Poll for new orders
  // useEffect(() => {
  //   if (!restaurantId) return

  //   const POLLING_INTERVAL = 10000

  //   const fetchOrders = async () => {
  //     dispatch(fetchNotificationOrders({ restaurantId }))
  //   }

  //   const interval = setInterval(fetchOrders, POLLING_INTERVAL)
  //   fetchOrders() // run once immediately

  //   return () => clearInterval(interval)
  // }, [dispatch, restaurantId])
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)
  const { notificationOrders = [] } = useSelector((state) => state.orders)

  const [play] = useSound(notificationSound)
  const previousOrdersRef = useRef([]) // to track previous orders
  const [hasInitialized, setHasInitialized] = useState(false)

  // 🔔 Detect new orders
  useEffect(() => {
    if (!Array.isArray(notificationOrders)) return

    if (!hasInitialized) {
      previousOrdersRef.current = notificationOrders
      setHasInitialized(true)
      return
    }

    const prevOrders = previousOrdersRef.current
    if (notificationOrders.length > prevOrders.length) {
      toast.success('New Order Received! 🎉')
      play()
    }

    previousOrdersRef.current = notificationOrders
  }, [notificationOrders, play, hasInitialized])

  // 📌 Fetch restaurant details
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchRestaurantDetails({ restaurantId, token }))
      dispatch(getRestaurantProfile({  token })) // fetch profile
    }
  }, [dispatch, restaurantId, token])

  const handleLogout = () => {
    dispatch(localLogout())
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar
          src={restaurantProfile?.profileImage || auth?.image || avatar8}
          size="sm"
        />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>

        <CDropdownItem style={{ cursor: 'pointer' }}>
          <Link to={`/account/${userId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CIcon icon={cilUser} className="me-2" />
            Profile
          </Link>
        </CDropdownItem>

        <CDropdownItem style={{ cursor: 'pointer' }}>
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem style={{ cursor: 'pointer' }} onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default React.memo(AppHeaderDropdown)
