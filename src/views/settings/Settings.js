import React, { useState, useEffect } from 'react'
import { Tag } from 'lucide-react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CContainer,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CInputGroup,        // ADD THIS
  CInputGroupText,
  // cilTag,
} from '@coreui/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  fetchMembers,
  addMember,
  updateMember,
  deleteMember
} from '../../redux/slices/memberSlice';
import { toast } from 'react-toastify'
// import axios from 'axios'
import axiosInstance from '../../utils/axiosConfig'
// import { BASE_URL } from '../../utils/constants'
import { fetchCustomers } from '../../redux/slices/customerSlice';
import CIcon from '@coreui/icons-react'
import { cilSettings, cilPlus, cilTrash, cilPencil, cilSave, cilMoney, cilUser } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux';
import {
  Heart,
  Copy,
  RefreshCw,
  Calendar,
  Save,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  AlertCircle,
  CheckCircle,
  Users,
  Award,
  X
} from 'lucide-react';
const Settings = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('system')
  const [memberForm, setMemberForm] = useState({
    // customerName: '',
    // customerId: '',
    membershipName: '',
    minSpend: '', // <-- ADD THIS
    discountType: 'percentage',
    discount: '',
    startDate: '',
    expirationDate: '',
    status: 'active',
    notes: ''
  });
  const [memberDialog, setMemberDialog] = useState({ open: false, mode: 'create', member: null });
  const [memberDetailDialog, setMemberDetailDialog] = useState({ open: false, member: null });
  const [discountType, setDiscountType] = useState('percentage');
  const { members, loading: memberLoading, error: memberError } = useSelector(state => state.members);
  const token = localStorage.getItem('authToken');
  // System state
  const [systemFormData, setSystemFormData] = useState({
    systemName: '',
    chargeOfSystem: '',
    willOccupy: false,
    color: '#ff0000',
  })
  const [systems, setSystems] = useState([])
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemSaving, setSystemSaving] = useState(false)
  const [systemError, setSystemError] = useState('')
  const [editingSystem, setEditingSystem] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', item: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { customers, loading } = useSelector((state) => state.customers);
  // Tax state
  const [taxFormData, setTaxFormData] = useState({
    taxName: '',
    taxCharge: '',
    taxType: 'percentage',
  })
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const [taxes, setTaxes] = useState([])
  const [taxLoading, setTaxLoading] = useState(false)
  const [taxSaving, setTaxSaving] = useState(false)
  const [taxError, setTaxError] = useState('')
  const [editingTax, setEditingTax] = useState(null)

  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const dispatch = useDispatch();


  // ADD CUSTOMER SETTINGS STATE (after tax state)
  const [customerSettings, setCustomerSettings] = useState({
    lostCustomerDays: 60,      // Lost Customer Period
    highSpenderAmount: 10000,  // High Spender Amount  
    regularCustomerDays: 30,   // Regular Customer Period
  })

  // const [customerLoading, setCustomerLoading] = useState(false)
  // const [customerSaving, setCustomerSaving] = useState(false)
  // const [customerError, setCustomerError] = useState('')



  // ADD CUSTOMER SETTINGS STATE (after tax state)
  // const [customerSettings, setCustomerSettings] = useState({
  //   lostCustomerDays: 60,      // Lost Customer Period
  //   highSpenderAmount: 10000,  // High Spender Amount  
  //   regularCustomerDays: 30,   // Regular Customer Period
  // })

  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerSaving, setCustomerSaving] = useState(false)
  const [customerError, setCustomerError] = useState('')

  // Inventory Stock Settings state
  const [inventoryStockSettings, setInventoryStockSettings] = useState({
    lowStockThreshold: 10
  })
  const [inventoryStockLoading, setInventoryStockLoading] = useState(false)
  const [inventoryStockSaving, setInventoryStockSaving] = useState(false)
  const [inventoryStockError, setInventoryStockError] = useState('')
  const [lowStockItems, setLowStockItems] = useState([])
  const [checkingLowStock, setCheckingLowStock] = useState(false)



  // Fetch all systems and taxes on component mount
  useEffect(() => {
    dispatch(fetchMembers(token));
    fetchSystems()
    fetchTaxes()
    fetchCustomerSettings()
    fetchInventoryStockSettings()
  }, [dispatch, token, restaurantId])

  const validateMemberForm = () => {
    // Updated validation for membership plans
    if (!memberForm.membershipName || !memberForm.minSpend || !memberForm.discount) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return false;
    }
    if (parseFloat(memberForm.discount) < 0) {
      setSnackbar({ open: true, message: 'Discount cannot be negative', severity: 'error' });
      return false;
    }
    if (memberForm.discountType === 'percentage' && parseFloat(memberForm.discount) > 100) {
      setSnackbar({ open: true, message: 'Discount percentage cannot exceed 100', severity: 'error' });
      return false;
    }
    // The expiration date check is for a specific user, so we remove it for a general plan.
    return true;
  };

  const handleDelete = async () => {
    if (deleteDialog.type === 'coupon' && deleteDialog.item) {
      try {
        await dispatch(deleteCoupon(deleteDialog.item._id)).unwrap();
        setDeleteDialog({ open: false, type: '', item: null });
        dispatch(fetchCoupons());
      } catch (error) {
        console.error('Delete error:', error);
      }
    } else if (deleteDialog.type === 'member' && deleteDialog.item) {
      try {
        await dispatch(deleteMember(deleteDialog.item._id)).unwrap();
        setSnackbar({ open: true, message: 'Member deleted successfully', severity: 'success' });
        setDeleteDialog({ open: false, type: '', item: null });
        dispatch(fetchMembers(token));
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };
  const handleMemberSubmit = async () => {
    if (!validateMemberForm()) return;

    const memberData = {
      ...memberForm,
      discount: parseFloat(memberForm.discount),
      discountType: memberForm.discountType, // ✅ include this line
      startDate: memberForm.startDate || new Date().toISOString(),
    };

    try {
      if (memberDialog.mode === 'edit') {
        await dispatch(updateMember({ id: memberDialog.member._id, memberData })).unwrap();
        setSnackbar({
          open: true,
          message: 'Member updated successfully',
          severity: 'success',
        });
      } else {
        await dispatch(addMember(memberData)).unwrap();
        setSnackbar({
          open: true,
          message: 'Member added successfully',
          severity: 'success',
        });
      }

      setMemberDialog({ open: false, mode: 'create', member: null });
      resetMemberForm();
      dispatch(fetchMembers(token));
    } catch (error) {
      console.error('Member submission error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save member',
        severity: 'error',
      });
    }
  };


  const resetMemberForm = () => {
    setMemberForm({
      // customerName: '',
      // customerId: '',
      membershipName: '',
      minSpend: '', // <-- ADD THIS
      discountType: 'percentage',
      discount: '',
      startDate: '',
      expirationDate: '',
      status: 'active',
      notes: ''
    });
  };
  const handleEditMember = (member) => {
    setMemberForm({
      // customerName: member.customerName,
      // customerId: member.customerId._id,
      membershipName: member.membershipName,
      minSpend: member.minSpend?.toString() || '', // <-- ADD THIS
      discountType: member.discountType || 'percentage',
      discount: member.discount.toString(),
      startDate: member.startDate ? new Date(member.startDate).toISOString().split('T')[0] : '',
      expirationDate: member.expirationDate ? new Date(member.expirationDate).toISOString().split('T')[0] : '',
      status: member.status,
      notes: member.notes || ''
    });
    setMemberDialog({ open: true, mode: 'edit', member });
    setAnchorEl(null);
  };

  const getMembershipStatus = (member) => {
    const isExpired = new Date(member.expirationDate) < new Date();
    return {
      isExpired,
      isInactive: member.status === 'inactive',
      statusColor: isExpired ? 'error' : member.status === 'active' ? 'success' : 'warning'
    };
  };
  // System functions
  const fetchSystems = async () => {
    try {
      setSystemLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/settings?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setSystems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
      if (error.response?.status !== 404) {
        setSystemError('Failed to fetch systems')
        toast.error('Failed to fetch systems')
      }
    } finally {
      setSystemLoading(false)
    }
  }

  const handleSystemInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSystemFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'willOccupy' ? value === 'true' : value)
    }))
    setSystemError('')
  }

  const handleSystemSubmit = async (e) => {
    e.preventDefault()

    if (!systemFormData.systemName.trim()) {
      setSystemError('System name is required')
      return
    }

    if (!systemFormData.chargeOfSystem.trim()) {
      setSystemError('Charge of system is required')
      return
    }

    if (systemFormData.willOccupy && systemFormData.color) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(systemFormData.color)) {
        setSystemError('Please enter a valid hex color code (e.g., #FF0000)')
        return
      }
    }

    try {
      setSystemSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      const dataToSend = {
        systemName: systemFormData.systemName.trim(),
        chargeOfSystem: systemFormData.chargeOfSystem,
        willOccupy: systemFormData.willOccupy,
        restaurantId
      };

      if (systemFormData.willOccupy && systemFormData.color) {
        dataToSend.color = systemFormData.color;
      }

      if (editingSystem) {
        const response = await axiosInstance.put(`/api/settings/${editingSystem._id}`, dataToSend)

        if (response.data.success) {
          toast.success('System updated successfully!')
          setEditingSystem(null)
        } else {
          setSystemError(response.data.message || 'Failed to update system')
          toast.error('Failed to update system')
        }
      } else {
        // Create new system
        const response = await axiosInstance.post(`/api/settings`, dataToSend)

        if (response.data.success) {
          toast.success('System added successfully!')
        } else {
          setSystemError(response.data.message || 'Failed to add system')
          toast.error('Failed to add system')
        }
      }

      setSystemError('')
      setSystemFormData({
        systemName: '',
        chargeOfSystem: '',
        willOccupy: false,
        color: '#ff0000', // Reset to default color
      })

      // Refresh the systems list
      fetchSystems()
    } catch (error) {
      console.error('Error saving system:', error)
      setSystemError('Failed to save system')
      toast.error('Failed to save system')
    } finally {
      setSystemSaving(false)
    }
  }

  const handleSystemEdit = (system) => {
    setEditingSystem(system)
    setSystemFormData({
      systemName: system.systemName,
      chargeOfSystem: system.chargeOfSystem,
      willOccupy: system.willOccupy,
      color: system.color || '#ff0000', // Default if color not present
    })
  }

  const handleSystemDelete = async (systemId) => {
    if (window.confirm('Are you sure you want to delete this system?')) {
      try {
        const response = await axiosInstance.delete(`/api/settings/${systemId}`)

        if (response.data.success) {
          toast.success('System deleted successfully!')
          fetchSystems()
        } else {
          toast.error('Failed to delete system')
        }
      } catch (error) {
        console.error('Error deleting system:', error)
        toast.error('Failed to delete system')
      }
    }
  }
  const handleMenuClick = (event, item, type) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ item, type });
  };

  const handleSystemCancel = () => {
    setEditingSystem(null)
    setSystemFormData({
      systemName: '',
      chargeOfSystem: '',
      willOccupy: false,
      color: '#ff0000', // Add default color
    })
    setSystemError('')
  }

  // Tax functions
  const fetchTaxes = async () => {
    try {
      setTaxLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/tax?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setTaxes(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching taxes:', error)
      if (error.response?.status !== 404) {
        setTaxError('Failed to fetch taxes')
        toast.error('Failed to fetch taxes')
      }
    } finally {
      setTaxLoading(false)
    }
  }

  const handleTaxInputChange = (e) => {
    const { name, value } = e.target
    setTaxFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setTaxError('')
  }

  const handleTaxSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!taxFormData.taxName.trim()) {
      setTaxError('Tax name is required')
      return
    }

    if (!taxFormData.taxCharge.trim()) {
      setTaxError('Tax charge is required')
      return
    }

    // Validate tax charge based on type
    const chargeValue = parseFloat(taxFormData.taxCharge)
    if (isNaN(chargeValue) || chargeValue < 0) {
      setTaxError('Tax charge must be a valid positive number')
      return
    }

    if (taxFormData.taxType === 'percentage' && chargeValue > 100) {
      setTaxError('Percentage tax cannot exceed 100%')
      return
    }

    try {
      setTaxSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      if (editingTax) {
        // Update existing tax
        const response = await axiosInstance.put(`/api/tax/${editingTax._id}`, {
          ...taxFormData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('Tax updated successfully!')
          setEditingTax(null)
        } else {
          setTaxError(response.data.message || 'Failed to update tax')
          toast.error('Failed to update tax')
        }
      } else {
        // Create new tax
        const response = await axiosInstance.post(`/api/tax`, {
          ...taxFormData,
          restaurantId
        })

        if (response.data.success) {
          toast.success('Tax added successfully!')
        } else {
          setTaxError(response.data.message || 'Failed to add tax')
          toast.error('Failed to add tax')
        }
      }

      setTaxError('')
      setTaxFormData({
        taxName: '',
        taxCharge: '',
        taxType: 'percentage',
      })
      // Refresh the taxes list
      fetchTaxes()
    } catch (error) {
      console.error('Error saving tax:', error)
      setTaxError('Failed to save tax')
      toast.error('Failed to save tax')
    } finally {
      setTaxSaving(false)
    }
  }

  const handleTaxEdit = (tax) => {
    setEditingTax(tax)
    setTaxFormData({
      taxName: tax.taxName,
      taxCharge: tax.taxCharge,
      taxType: tax.taxType,
    })
  }

  const handleTaxDelete = async (taxId) => {
    if (window.confirm('Are you sure you want to delete this tax?')) {
      try {
        const response = await axiosInstance.delete(`/api/tax/${taxId}`)

        if (response.data.success) {
          toast.success('Tax deleted successfully!')
          fetchTaxes()
        } else {
          toast.error('Failed to delete tax')
        }
      } catch (error) {
        console.error('Error deleting tax:', error)
        toast.error('Failed to delete tax')
      }
    }
  }

  const handleTaxCancel = () => {
    setEditingTax(null)
    setTaxFormData({
      taxName: '',
      taxCharge: '',
      taxType: 'percentage',
    })
    setTaxError('')
  }

  const formatTaxCharge = (charge, type) => {
    if (type === 'percentage') {
      return `${charge}%`
    } else {
      return `₹${charge}`
    }
  }

  // CUSTOMER FUNCTIONS (add after tax functions)
  const fetchCustomerSettings = async () => {
    try {
      setCustomerLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/customer-settings?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setCustomerSettings(prev => ({
          ...prev,
          ...response.data.data
        }))
      }
    } catch (error) {
      console.error('Error fetching customer settings:', error)
      if (error.response?.status !== 404) {
        setCustomerError('Failed to fetch customer settings')
        toast.error('Failed to fetch customer settings')
      }
    } finally {
      setCustomerLoading(false)
    }
  }

  const handleCustomerInputChange = (e) => {
    const { name, value } = e.target
    setCustomerSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }))
    setCustomerError('')
  }

  const handleCustomerSettingsSubmit = async (e) => {
    e.preventDefault()

    // Simple validation
    if (customerSettings.lostCustomerDays < 1 || customerSettings.lostCustomerDays > 365) {
      setCustomerError('Lost customer days must be between 1 and 365')
      return
    }

    if (customerSettings.regularCustomerDays < 1 || customerSettings.regularCustomerDays > 365) {
      setCustomerError('Regular customer days must be between 1 and 365')
      return
    }

    if (customerSettings.highSpenderAmount < 100) {
      setCustomerError('High spender amount must be at least ₹100')
      return
    }

    try {
      setCustomerSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      const response = await axiosInstance.post(`/api/customer-settings`, {
        ...customerSettings,
        restaurantId
      })

      if (response.data.success) {
        toast.success('Customer settings saved successfully!')
      } else {
        setCustomerError(response.data.message || 'Failed to save customer settings')
        toast.error('Failed to save customer settings')
      }

      setCustomerError('')
    } catch (error) {
      console.error('Error saving customer settings:', error)
      setCustomerError('Failed to save customer settings')
      toast.error('Failed to save customer settings')
    } finally {
      setCustomerSaving(false)
    }
  }

  // INVENTORY STOCK SETTINGS FUNCTIONS
  const fetchInventoryStockSettings = async () => {
    try {
      setInventoryStockLoading(true)
      const restaurantId = localStorage.getItem('restaurantId')
      const response = await axiosInstance.get(`/api/inventory-stock-settings?restaurantId=${restaurantId}`)

      if (response.data.success) {
        setInventoryStockSettings(prev => ({
          ...prev,
          ...response.data.data
        }))
      }
    } catch (error) {
      console.error('Error fetching inventory stock settings:', error)
      if (error.response?.status !== 404) {
        setInventoryStockError('Failed to fetch inventory stock settings')
        toast.error('Failed to fetch inventory stock settings')
      }
    } finally {
      setInventoryStockLoading(false)
    }
  }

  const handleInventoryStockInputChange = (e) => {
    const { name, value } = e.target
    setInventoryStockSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }))
    setInventoryStockError('')
  }

  const handleInventoryStockSettingsSubmit = async (e) => {
    e.preventDefault()

    // Simple validation
    if (inventoryStockSettings.lowStockThreshold < 1 || inventoryStockSettings.lowStockThreshold > 1000) {
      setInventoryStockError('Low stock threshold must be between 1 and 1000')
      return
    }

    try {
      setInventoryStockSaving(true)
      const restaurantId = localStorage.getItem('restaurantId')

      const response = await axiosInstance.post(`/api/inventory-stock-settings`, {
        ...inventoryStockSettings,
        restaurantId
      })

      if (response.data.success) {
        toast.success('Inventory stock settings saved successfully!')
      } else {
        setInventoryStockError(response.data.message || 'Failed to save inventory stock settings')
        toast.error('Failed to save inventory stock settings')
      }

      setInventoryStockError('')
    } catch (error) {
      console.error('Error saving inventory stock settings:', error)
      setInventoryStockError('Failed to save inventory stock settings')
      toast.error('Failed to save inventory stock settings')
    } finally {
      setInventoryStockSaving(false)
    }
  }

  // Check low stock items and trigger auto email
  const checkLowStockItems = async () => {
    try {
      setCheckingLowStock(true)
      const restaurantId = localStorage.getItem('restaurantId')
      
      // First check low stock items
      const itemsResponse = await axiosInstance.get(`/api/low-stock/items?restaurantId=${restaurantId}`)
      
      if (itemsResponse.data.success) {
        setLowStockItems(itemsResponse.data.data.items || [])
        
        // Then trigger auto email check
        try {
          const emailResponse = await axiosInstance.post(`/api/low-stock/auto-check?restaurantId=${restaurantId}`)
          if (emailResponse.data.success) {
            console.log('Auto email check completed')
          }
        } catch (emailError) {
          console.error('Auto email check failed:', emailError)
          // Don't show error to user, just log it
        }
        
        if (itemsResponse.data.data.items.length > 0) {
          toast.warning(`Found ${itemsResponse.data.data.items.length} low stock items! Email sent if needed.`)
        } else {
          toast.success('No low stock items found!')
        }
      }
    } catch (error) {
      console.error('Error checking low stock items:', error)
      toast.error('Failed to check low stock items')
    } finally {
      setCheckingLowStock(false)
    }
  }

  // Test immediate email for all restaurants
  const testImmediateEmail = async () => {
    try {
      setTestingEmail(true)
      const response = await axiosInstance.post('/api/low-stock/immediate-test')

      if (response.data.success) {
        toast.success('Immediate email test completed! Check console for details.')
        console.log('Email test result:', response.data.data)
      } else {
        toast.error('Failed to test immediate email')
      }
    } catch (error) {
      console.error('Error testing immediate email:', error)
      toast.error('Failed to test immediate email')
    } finally {
      setTestingEmail(false)
    }
  }



  return (
    <CContainer>
      {/* Tab Navigation */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <CCardTitle>
                <CIcon icon={cilSettings} className="me-2" />
                Settings Management
              </CCardTitle>
            </CCardHeader>
            <CCardBody>
              <CNav variant="tabs" role="tablist">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'system'}
                    onClick={() => setActiveTab('system')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilSettings} className="me-2" />
                    System Settings
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'tax'}
                    onClick={() => setActiveTab('tax')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilMoney} className="me-2" />
                    Tax Settings
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'customer'}
                    onClick={() => setActiveTab('customer')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilUser} className="me-2" />
                    Customer Settings
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'membership'}
                    onClick={() => setActiveTab('membership')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilMoney} className="me-2" />
                    Membership Settings
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'inventory'}
                    onClick={() => setActiveTab('inventory')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CIcon icon={cilSettings} className="me-2" />
                    Inventory Stock Settings
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CTabContent>
        {/* System Tab */}
        <CTabPane role="tabpanel" aria-labelledby="system-tab" visible={activeTab === 'system'}>
          {/* Add/Edit System Form */}
          <CRow className="mb-4">
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle>
                    <CIcon icon={cilSettings} className="me-2" />
                    {editingSystem ? 'Edit System' : 'Add New System'}
                  </CCardTitle>
                </CCardHeader>
                <CCardBody>
                  {systemError && (
                    <CAlert color="danger" className="mb-3">
                      {systemError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleSystemSubmit}>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="systemName">System Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="systemName"
                          name="systemName"
                          value={systemFormData.systemName}
                          onChange={handleSystemInputChange}
                          placeholder="Enter system name"
                          required
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel htmlFor="chargeOfSystem">Charge of System</CFormLabel>
                        <CFormInput
                          type="text"
                          id="chargeOfSystem"
                          name="chargeOfSystem"
                          value={systemFormData.chargeOfSystem}
                          onChange={handleSystemInputChange}
                          placeholder="Enter charge of system"
                          required
                        />
                      </CCol>
                    </CRow>

                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="willOccupy">Will Occupy</CFormLabel>
                        <CFormSelect
                          id="willOccupy"
                          name="willOccupy"
                          value={systemFormData.willOccupy.toString()}
                          onChange={handleSystemInputChange}
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </CFormSelect>
                      </CCol>

                      {/* Conditional Color Picker - Show only when willOccupy is true */}
                      {systemFormData.willOccupy && (
                        <CCol md={6}>
                          <CFormLabel htmlFor="color">Choose Table Color</CFormLabel>
                          <div className="d-flex align-items-center gap-2">
                            <CFormInput
                              type="color"
                              id="color"
                              name="color"
                              value={systemFormData.color}
                              onChange={handleSystemInputChange}
                              className="form-control-color"
                              style={{
                                width: '60px',
                                height: '38px',
                                padding: '4px',
                                cursor: 'pointer'
                              }}
                              title="Choose table color"
                            />
                            <CFormInput
                              type="text"
                              name="color"
                              value={systemFormData.color}
                              onChange={(e) => {
                                const value = e.target.value
                                if (/^#[0-9A-F]{0,6}$/i.test(value) || value === '') {
                                  handleSystemInputChange(e)
                                }
                              }}
                              placeholder="#FF0000"
                              maxLength={7}
                              className="flex-grow-1"
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                          <small className="text-muted">
                            Selected color will be used to highlight occupied tables
                          </small>
                        </CCol>
                      )}
                    </CRow>

                    <CRow>
                      <CCol>
                        <CButton
                          type="submit"
                          color="primary"
                          disabled={systemSaving}
                          className="me-2"
                        >
                          {systemSaving ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              {editingSystem ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilSave} className="me-2" />
                              {editingSystem ? 'Update System' : 'Add System'}
                            </>
                          )}
                        </CButton>
                        {editingSystem && (
                          <CButton
                            color="secondary"
                            onClick={handleSystemCancel}
                          >
                            Cancel
                          </CButton>
                        )}
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Systems List */}
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <CCardTitle>System Settings</CCardTitle>
                  <div>
                    <CButton
                      color="success"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setEditingSystem(null)
                        setSystemFormData({
                          systemName: '',
                          chargeOfSystem: '',
                          willOccupy: false,
                          color: '#ff0000', // Add default color
                        })
                        setSystemError('')
                      }}
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add New
                    </CButton>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={fetchSystems}
                      disabled={systemLoading}
                    >
                      {systemLoading ? <CSpinner size="sm" /> : 'Refresh'}
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {systemLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading systems...</p>
                    </div>
                  ) : systems.length === 0 ? (
                    <div className="text-center py-4">
                      <CIcon icon={cilSettings} size="3xl" className="text-muted" />
                      <p className="mt-2 text-muted">No systems found. Add your first system above.</p>
                    </div>
                  ) : (
                    <CTable responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>System Name</CTableHeaderCell>
                          <CTableHeaderCell>Charge</CTableHeaderCell>
                          <CTableHeaderCell>Will Occupy</CTableHeaderCell>
                          <CTableHeaderCell>Color</CTableHeaderCell>
                          <CTableHeaderCell>Created</CTableHeaderCell>
                          <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {systems.map((system) => (
                          <CTableRow key={system._id}>
                            <CTableDataCell>
                              <div className="d-flex align-items-center">
                                <CIcon icon={cilSettings} className="me-2" />
                                {system.systemName}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="info">₹{system.chargeOfSystem}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={system.willOccupy ? 'success' : 'secondary'}>
                                {system.willOccupy ? 'Yes' : 'No'}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {system.willOccupy && system.color ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      backgroundColor: system.color,
                                      borderRadius: '4px',
                                      border: '2px solid #ffffff',
                                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                    }}
                                    title={`Color: ${system.color}`}
                                  />
                                  <small className="text-muted" style={{ fontFamily: 'monospace' }}>
                                    {system.color}
                                  </small>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {new Date(system.createdAt).toLocaleDateString()}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleSystemEdit(system)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleSystemDelete(system._id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>

        {/* Tax Tab */}
        <CTabPane role="tabpanel" aria-labelledby="tax-tab" visible={activeTab === 'tax'}>
          {/* Add/Edit Tax Form */}
          <CRow className="mb-4">
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle>
                    <CIcon icon={cilMoney} className="me-2" />
                    {editingTax ? 'Edit Tax' : 'Add New Tax'}
                  </CCardTitle>
                </CCardHeader>
                <CCardBody>
                  {taxError && (
                    <CAlert color="danger" className="mb-3">
                      {taxError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleTaxSubmit}>
                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxName">Tax Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="taxName"
                          name="taxName"
                          value={taxFormData.taxName}
                          onChange={handleTaxInputChange}
                          placeholder="Enter tax name (e.g., GST, VAT)"
                          required
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxCharge">Tax Charge</CFormLabel>
                        <CFormInput
                          type="number"
                          id="taxCharge"
                          name="taxCharge"
                          value={taxFormData.taxCharge}
                          onChange={handleTaxInputChange}
                          placeholder="Enter tax charge"
                          min="0"
                          step="0.01"
                          required
                        />
                      </CCol>
                    </CRow>

                    <CRow className="mb-3">
                      <CCol md={6}>
                        <CFormLabel htmlFor="taxType">Tax Type</CFormLabel>
                        <CFormSelect
                          id="taxType"
                          name="taxType"
                          value={taxFormData.taxType}
                          onChange={handleTaxInputChange}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </CFormSelect>
                      </CCol>
                    </CRow>

                    <CRow>
                      <CCol>
                        <CButton
                          type="submit"
                          color="primary"
                          disabled={taxSaving}
                          className="me-2"
                        >
                          {taxSaving ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              {editingTax ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilSave} className="me-2" />
                              {editingTax ? 'Update Tax' : 'Add Tax'}
                            </>
                          )}
                        </CButton>
                        {editingTax && (
                          <CButton
                            color="secondary"
                            onClick={handleTaxCancel}
                          >
                            Cancel
                          </CButton>
                        )}
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Taxes List */}
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <CCardTitle>Tax Settings</CCardTitle>
                  <div>
                    <CButton
                      color="success"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setEditingTax(null)
                        setTaxFormData({
                          taxName: '',
                          taxCharge: '',
                          taxType: 'percentage',
                        })
                        setTaxError('')
                      }}
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Add New
                    </CButton>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={fetchTaxes}
                      disabled={taxLoading}
                    >
                      {taxLoading ? <CSpinner size="sm" /> : 'Refresh'}
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {taxLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading taxes...</p>
                    </div>
                  ) : taxes.length === 0 ? (
                    <div className="text-center py-4">
                      <CIcon icon={cilMoney} size="3xl" className="text-muted" />
                      <p className="mt-2 text-muted">No taxes found. Add your first tax above.</p>
                    </div>
                  ) : (
                    <CTable responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Tax Name</CTableHeaderCell>
                          <CTableHeaderCell>Charge</CTableHeaderCell>
                          <CTableHeaderCell>Type</CTableHeaderCell>
                          <CTableHeaderCell>Created</CTableHeaderCell>
                          <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {taxes.map((tax) => (
                          <CTableRow key={tax._id}>
                            <CTableDataCell>
                              <div className="d-flex align-items-center">
                                <CIcon icon={cilMoney} className="me-2" />
                                {tax.taxName}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color="info">
                                {formatTaxCharge(tax.taxCharge, tax.taxType)}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={tax.taxType === 'percentage' ? 'success' : 'warning'}>
                                {tax.taxType === 'percentage' ? 'Percentage' : 'Fixed'}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {new Date(tax.createdAt).toLocaleDateString()}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleTaxEdit(tax)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleTaxDelete(tax._id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>

        {/*Customer tab*/}
        <CTabPane role="tabpanel" aria-labelledby="customer-tab" visible={activeTab === 'customer'}>
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle>
                    <CIcon icon={cilUser} className="me-2" />
                    Customer Settings
                  </CCardTitle>
                </CCardHeader>
                <CCardBody>
                  {customerError && (
                    <CAlert color="danger" className="mb-3">
                      {customerError}
                    </CAlert>
                  )}

                  {customerLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading customer settings...</p>
                    </div>
                  ) : (
                    <CForm onSubmit={handleCustomerSettingsSubmit}>
                      <CRow className="mb-4">
                        {/* Lost Customer Period */}
                        <CCol md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="lostCustomerDays">
                              Lost Customer Period
                            </CFormLabel>
                            <CInputGroup>
                              <CFormInput
                                type="number"
                                id="lostCustomerDays"
                                name="lostCustomerDays"
                                value={customerSettings.lostCustomerDays}
                                onChange={handleCustomerInputChange}
                                placeholder="60"
                                min="1"
                                max="365"
                                required
                              />
                              <CInputGroupText>days</CInputGroupText>
                            </CInputGroup>
                          </div>
                        </CCol>

                        {/* High Spender Amount */}
                        <CCol md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="highSpenderAmount">
                              High Spender Amount
                            </CFormLabel>
                            <CInputGroup>
                              <CInputGroupText>₹</CInputGroupText>
                              <CFormInput
                                type="number"
                                id="highSpenderAmount"
                                name="highSpenderAmount"
                                value={customerSettings.highSpenderAmount}
                                onChange={handleCustomerInputChange}
                                placeholder="10000"
                                min="100"
                                step="100"
                                required
                              />
                            </CInputGroup>
                          </div>
                        </CCol>

                        {/* Regular Customer Period */}
                        <CCol md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="regularCustomerDays">
                              Regular Customer Period
                            </CFormLabel>
                            <CInputGroup>
                              <CFormInput
                                type="number"
                                id="regularCustomerDays"
                                name="regularCustomerDays"
                                value={customerSettings.regularCustomerDays}
                                onChange={handleCustomerInputChange}
                                placeholder="30"
                                min="1"
                                max="365"
                                required
                              />
                              <CInputGroupText>days</CInputGroupText>
                            </CInputGroup>
                          </div>
                        </CCol>
                      </CRow>

                      {/* Save Button */}
                      <CRow>
                        <CCol>
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={customerSaving}
                          >
                            {customerSaving ? (
                              <>
                                <CSpinner size="sm" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CIcon icon={cilSave} className="me-2" />
                                Save Settings
                              </>
                            )}
                          </CButton>
                        </CCol>
                      </CRow>
                    </CForm>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>


        {/* Membership tab */}
        <CTabPane role="tabpanel" aria-labelledby="membership-tab" visible={activeTab === 'membership'}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      All Membership Plans ({members?.length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        size="small"
                        onClick={() => dispatch(fetchMembers(token))}
                        startIcon={<RefreshCw size={16} />}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => {
                          resetMemberForm();
                          setMemberDialog({ open: true, mode: 'create', member: null });
                        }}
                        startIcon={<Plus size={20} />}
                      >
                        Add Plan
                      </Button>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {memberLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : members?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Users size={48} style={{ color: '#ccc' }} />
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                        No membership plans found
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {(members ?? []).map((member) => (
                        <Grid item xs={12} sm={6} md={4} key={member._id}>
                          <Paper
                            elevation={2}
                            sx={{ p: 2, '&:hover': { elevation: 4 } }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {member.membershipName}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuClick(e, member, 'member');
                                }}
                              >
                                <MoreVertical size={16} />
                              </IconButton>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {member.notes || 'No description.'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              <Chip
                                icon={<CIcon icon={cilMoney} />}
                                label={`Min Spend: ₹${member.minSpend}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                icon={<Tag size={20} />}
                                label={
                                  member.discountType === 'fixed'
                                    ? `₹${member.discount} OFF`
                                    : `${member.discount}% OFF`
                                }
                                size="small"
                                color="success"
                              />
                            </Box>

                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DIALOG FOR ADD/EDIT MEMBER */}
          <Dialog open={memberDialog.open} onClose={() => setMemberDialog({ open: false, mode: 'create', member: null })} maxWidth="sm" fullWidth>
            <DialogTitle>
              {memberDialog.mode === 'edit' ? 'Edit Membership Plan' : 'Add New Membership Plan'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Customer</InputLabel>
                    <Select
                      value={memberForm.customerId}
                      label="Select Customer"
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      native
                    >
                      <option value=""></option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid> */}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Membership Name"
                    value={memberForm.membershipName}
                    onChange={(e) => setMemberForm({ ...memberForm, membershipName: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Minimum Spend (₹)"
                    type="number"
                    value={memberForm.minSpend}
                    onChange={(e) => setMemberForm({ ...memberForm, minSpend: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={memberForm.discountType}
                      label="Discount Type"
                      onChange={(e) => setMemberForm({ ...memberForm, discountType: e.target.value })}
                      native
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label={`Discount ${memberForm.discountType === 'percentage' ? '%' : 'Amount'}`}
                    type="number"
                    value={memberForm.discount}
                    onChange={(e) => setMemberForm({ ...memberForm, discount: e.target.value })}
                  />
                </Grid>

                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={memberForm.startDate}
                    onChange={(e) => setMemberForm({ ...memberForm, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Expiration Date"
                    type="date"
                    value={memberForm.expirationDate}
                    onChange={(e) => setMemberForm({ ...memberForm, expirationDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={memberForm.status}
                      label="Status"
                      onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                      native
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={memberForm.notes}
                    onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  />
                </Grid> */}
              </Grid> 
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMemberDialog({ open: false, mode: 'create', member: null })}>
                Cancel
              </Button>
              <Button onClick={handleMemberSubmit} variant="contained" disabled={memberLoading}>
                {memberDialog.mode === 'edit' ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Your other dialogs (Delete, Details, etc.) and Menu components go here... */}
          {/* Make sure to adjust the handleDelete function if you have one for members */}
          <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: '', item: null })}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this {deleteDialog.type}?
                {deleteDialog.type === 'member' && deleteDialog.item && ` (${deleteDialog.item.membershipName})`}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog({ open: false, type: '', item: null })}>Cancel</Button>
              <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
            </DialogActions>
          </Dialog>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => {
              if (selectedItem?.type === 'member') {
                handleEditMember(selectedItem.item);
              }
            }}>
              <ListItemIcon><Edit size={16} /></ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              setDeleteDialog({ open: true, type: selectedItem?.type, item: selectedItem?.item });
              handleMenuClose();
            }}>
              <ListItemIcon><Trash2 size={16} /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              icon={snackbar.severity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </CTabPane>

        {/* Inventory Stock Settings Tab */}
        <CTabPane role="tabpanel" aria-labelledby="inventory-tab" visible={activeTab === 'inventory'}>
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle>
                    <CIcon icon={cilSettings} className="me-2" />
                    Inventory Stock Settings
                  </CCardTitle>
                </CCardHeader>
                <CCardBody>
                  {inventoryStockError && (
                    <CAlert color="danger" className="mb-3">
                      {inventoryStockError}
                    </CAlert>
                  )}

                  {inventoryStockLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading inventory stock settings...</p>
                    </div>
                  ) : (
                    <CForm onSubmit={handleInventoryStockSettingsSubmit}>
                      <CRow className="mb-4">
                        {/* Low Stock Threshold */}
                        <CCol md={6}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="lowStockThreshold">
                              Low Stock Threshold
                            </CFormLabel>
                            <CInputGroup>
                              <CFormInput
                                type="number"
                                id="lowStockThreshold"
                                name="lowStockThreshold"
                                value={inventoryStockSettings.lowStockThreshold}
                                onChange={handleInventoryStockInputChange}
                                placeholder="10"
                                min="1"
                                max="1000"
                                required
                              />
                              <CInputGroupText>units</CInputGroupText>
                            </CInputGroup>
                            <small className="text-muted">
                              Set the minimum quantity threshold for low stock alerts
                            </small>
                          </div>
                        </CCol>
                      </CRow>

                      {/* Action Buttons */}
                      <CRow className="mb-3">
                        <CCol>
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={inventoryStockSaving}
                            className="me-2"
                          >
                            {inventoryStockSaving ? (
                              <>
                                <CSpinner size="sm" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CIcon icon={cilSave} className="me-2" />
                                Save Settings
                              </>
                            )}
                          </CButton>
                          
                          <CButton
                            color="info"
                            onClick={checkLowStockItems}
                            disabled={checkingLowStock}
                            className="me-2"
                          >
                            {checkingLowStock ? (
                              <>
                                <CSpinner size="sm" className="me-2" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <CIcon icon={cilSettings} className="me-2" />
                                Check Low Stock
                              </>
                            )}
                          </CButton>




                        </CCol>
                      </CRow>




                      {/* Low Stock Items Display */}
                      {lowStockItems.length > 0 && (
                        <CRow>
                          <CCol>
                            <CCard>
                              <CCardHeader>
                                <CCardTitle>
                                  <CIcon icon={cilSettings} className="me-2" />
                                  Low Stock Items ({lowStockItems.length})
                                </CCardTitle>
                              </CCardHeader>
                              <CCardBody>
                                <CTable responsive>
                                  <CTableHead>
                                    <CTableRow>
                                      <CTableHeaderCell>Item Name</CTableHeaderCell>
                                      <CTableHeaderCell>Current Stock</CTableHeaderCell>
                                      <CTableHeaderCell>Status</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {lowStockItems.map((item, index) => {
                                      // Use the currentQuantity that was calculated in backend
                                      const currentQuantity = item.currentQuantity || item.usedQuantity || 0;

                                      return (
                                        <CTableRow key={index}>
                                          <CTableDataCell>
                                            {item.itemName || 'Unknown Item'}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            <CBadge color="danger">{currentQuantity}</CBadge>
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            <CBadge color="warning">LOW STOCK</CBadge>
                                          </CTableDataCell>
                                        </CTableRow>
                                      );
                                    })}
                                  </CTableBody>
                                </CTable>
                              </CCardBody>
                            </CCard>
                          </CCol>
                        </CRow>
                      )}
                    </CForm>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>

      </CTabContent>
    </CContainer >
  )
}

export default Settings

