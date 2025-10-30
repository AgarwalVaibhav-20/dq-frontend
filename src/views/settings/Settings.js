import React, { useState, useEffect } from 'react'
import { AVAILABLE_SHORTCUTS, getShortcutsByCategory } from '../../utils/avaliableShortcuts';
import { Search } from 'lucide-react'
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
  CInputGroup,
  CInputGroupText,
  CFormCheck, // <-- IMPORT THIS
} from '@coreui/react'
import { Keyboard } from 'lucide-react';
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
import {
  fetchShortcuts,
  createShortcut,
  updateShortcut,
  deleteShortcut,
} from '../../redux/slices/keyboardShortcutSlice';
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
  const { shortcuts = [], loading: shortcutLoading, error: shortcutError } = useSelector(
    state => state.shortcuts || { shortcuts: [], loading: false, error: null }
  );
  const [shortcutFormData, setShortcutFormData] = useState({
    action: '',
    keys: [{ combination: [], description: '' }]
  });
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [recordingKey, setRecordingKey] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState(null);
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
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [selectedPredefinedShortcut, setSelectedPredefinedShortcut] = useState(null);
  const [customKeyRecording, setCustomKeyRecording] = useState(false);
  const [customKeyCombination, setCustomKeyCombination] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    dispatch(fetchShortcuts(restaurantId, token));
    dispatch(fetchMembers(token, restaurantId));
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

  // Handler to open modal
  const handleSelectFromPredefined = () => {
    setShowShortcutModal(true);
    setSelectedPredefinedShortcut(null);
    setCustomKeyCombination([]);
    setSearchQuery('');
  };

  // Handler for key recording in modal
  const handleModalKeyDown = (e) => {
    if (!customKeyRecording) return;

    e.preventDefault();
    const modifiers = [];

    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');
    if (e.metaKey) modifiers.push('Meta');

    const key = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      const displayKey = key.length === 1 ? key.toUpperCase() : key;
      if (!modifiers.includes(displayKey)) {
        modifiers.push(displayKey);
      }
    }

    setCustomKeyCombination(modifiers);
    setCustomKeyRecording(false);
  };

  // Handler to save selected shortcut
  const handleSaveSelectedShortcut = async () => {
    if (!selectedPredefinedShortcut) {
      toast.error('Please select a shortcut');
      return;
    }

    if (customKeyCombination.length === 0) {
      toast.error('Please record a key combination');
      return;
    }

    try {
      const shortcutData = {
        restaurantId,
        action: selectedPredefinedShortcut.action,
        keys: [{
          combination: customKeyCombination,
          description: selectedPredefinedShortcut.description
        }],
        isActive: true
      };

      await dispatch(createShortcut(shortcutData)).unwrap();
      toast.success('Shortcut added successfully!');

      // Reset and close modal
      setShowShortcutModal(false);
      setSelectedPredefinedShortcut(null);
      setCustomKeyCombination([]);
      setSearchQuery('');
    } catch (error) {
      toast.error(error || 'Failed to save shortcut');
    }
  };

  // Filter shortcuts based on search
  const getFilteredShortcuts = () => {
    if (!searchQuery.trim()) {
      return getShortcutsByCategory();
    }

    const query = searchQuery.toLowerCase();
    const filtered = AVAILABLE_SHORTCUTS.filter(s =>
      s.action.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    );

    return filtered.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {});
  };
  const handleKeyDown = (e, keyIndex) => {
    if (recordingIndex !== keyIndex) return;

    e.preventDefault();
    const key = e.key;
    const modifiers = [];

    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');
    if (e.metaKey) modifiers.push('Meta');

    // Add the actual key if it's not a modifier
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      const displayKey = key.length === 1 ? key.toUpperCase() : key;
      if (!modifiers.includes(displayKey)) {
        modifiers.push(displayKey);
      }
    }

    const newKeys = [...shortcutFormData.keys];
    newKeys[keyIndex].combination = modifiers;
    setShortcutFormData({ ...shortcutFormData, keys: newKeys });
    setRecordingIndex(null);
  };

  const handleShortcutSubmit = async (e) => {
    e.preventDefault();

    if (!shortcutFormData.action.trim()) {
      toast.error('Action name is required');
      return;
    }

    if (shortcutFormData.keys[0].combination.length === 0) {
      toast.error('Please record a key combination');
      return;
    }

    try {
      const shortcutData = {
        restaurantId,
        action: shortcutFormData.action.trim(),
        keys: shortcutFormData.keys
        // 'isActive' will be defaulted to true by the backend
      };

      if (editingShortcut) {
        await dispatch(updateShortcut({
          id: editingShortcut._id,
          data: shortcutData
        })).unwrap();
        toast.success('Shortcut updated successfully!');
      } else {
        await dispatch(createShortcut(shortcutData)).unwrap();
        toast.success('Shortcut added successfully!');
      }

      // Reset form
      setShortcutFormData({
        action: '',
        keys: [{ combination: [], description: '' }]
      });
      setEditingShortcut(null);
      // No need to dispatch fetchShortcuts, slice should be updated
    } catch (error) {
      toast.error(error || 'Failed to save shortcut');
    }
  };

  // NEW HANDLER for toggling shortcut status
  const handleShortcutToggle = (shortcut, newStatus) => {
    dispatch(updateShortcut({
      id: shortcut._id,
      data: { isActive: newStatus } // Only send the field we want to change
    })).unwrap()
      .then(() => {
        toast.success(`Shortcut ${newStatus ? 'activated' : 'deactivated'}`);
      })
      .catch((error) => {
        toast.error(`Failed to update status: ${error}`);
      });
  };

  const handleShortcutEdit = (shortcut) => {
    setEditingShortcut(shortcut);
    setShortcutFormData({
      action: shortcut.action,
      keys: shortcut.keys || [{ combination: [], description: '' }]
    });
    setActiveTab('shortcuts'); // Switch to shortcuts tab
  };
  const handleShortcutDelete = async (shortcutId) => {
    if (window.confirm('Are you sure you want to delete this shortcut?')) {
      try {
        await dispatch(deleteShortcut(shortcutId)).unwrap();
        toast.success('Shortcut deleted successfully!');
        // No need to dispatch fetchShortcuts
      } catch (error) {
        toast.error('Failed to delete shortcut');
      }
    }
  };
  const handleShortcutCancel = () => {
    setEditingShortcut(null);
    setShortcutFormData({
      action: '',
      keys: [{ combination: [], description: '' }]
    });
    setRecordingIndex(null);
  };

  const addKeySlot = () => {
    setShortcutFormData({
      ...shortcutFormData,
      keys: [...shortcutFormData.keys, { combination: [], description: '' }]
    });
  };

  const removeKeySlot = (index) => {
    const newKeys = shortcutFormData.keys.filter((_, i) => i !== index);
    setShortcutFormData({ ...shortcutFormData, keys: newKeys });
  };
  const handleDelete = async () => {
    if (deleteDialog.type === 'member' && deleteDialog.item) {
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
    <CContainer fluid className="px-2 px-md-3">
      {/* Tab Navigation - Mobile Responsive */}
      <CRow className="mb-3 mb-md-4">
        <CCol>
          <CCard>
            <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
              <CCardTitle className="h5 h6-md mb-0 text-center">
                <CIcon icon={cilSettings} className="me-1 me-md-2" />
                <span className="d-none d-sm-inline">Settings Management</span>
                <span className="d-inline d-sm-none">Settings</span>
              </CCardTitle>
            </CCardHeader>
            <CCardBody className="px-2 px-md-3 py-2 py-md-3">
              {/* Mobile: Scrollable tabs, Desktop: Normal tabs */}
              <div className="d-block d-md-none">
                <div className="nav nav-pills nav-fill" role="tablist" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <button
                    className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilSettings} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">System</span>
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'tax' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tax')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilMoney} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">Tax</span>
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'customer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('customer')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilUser} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">Customer</span>
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'membership' ? 'active' : ''}`}
                    onClick={() => setActiveTab('membership')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilMoney} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">Membership</span>
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilSettings} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">Inventory</span>
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'shortcuts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shortcuts')}
                    style={{ minWidth: '120px', fontSize: '0.8rem' }}
                  >
                    <CIcon icon={cilSettings} className="d-block mx-auto mb-1" size="sm" />
                    <span className="d-block">Shortcuts</span>
                  </button>
                </div>
              </div>

              {/* Desktop: Normal tabs */}
              <div className="d-none d-md-block">
                <CNav
                  variant="tabs"
                  role="tablist"
                //className="bg-light border-bottom rounded-top px-2 shadow-sm"
                >
                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'system'}
                      onClick={() => setActiveTab('system')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilSettings} className="me-2 text-primary" />
                      System Settings
                    </CNavLink>
                  </CNavItem>

                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'tax'}
                      onClick={() => setActiveTab('tax')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilMoney} className="me-2 text-success" />
                      Tax Settings
                    </CNavLink>
                  </CNavItem>

                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'customer'}
                      onClick={() => setActiveTab('customer')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilUser} className="me-2 text-warning" />
                      Customer Settings
                    </CNavLink>
                  </CNavItem>

                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'membership'}
                      onClick={() => setActiveTab('membership')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilMoney} className="me-2 text-danger" />
                      Membership Settings
                    </CNavLink>
                  </CNavItem>

                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'inventory'}
                      onClick={() => setActiveTab('inventory')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilSettings} className="me-2 text-info" />
                      Inventory Stock Settings
                    </CNavLink>
                  </CNavItem>

                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'shortcuts'}
                      onClick={() => setActiveTab('shortcuts')}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Keyboard size={17} className="text-dark" />
                      <span>Keyboard Shortcuts</span>
                    </CNavLink>
                  </CNavItem>
                </CNav>
              </div>


            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CTabContent>
        {/* System Tab */}
        <CTabPane role="tabpanel" aria-labelledby="system-tab" visible={activeTab === 'system'}>
          {/* Add/Edit System Form */}
          <CRow className="mb-3 mb-md-4">
            <CCol>
              <CCard>
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <CCardTitle className="h6 mb-0">
                    <CIcon icon={cilSettings} className="me-1 me-md-2" />
                    {editingSystem ? 'Edit System' : 'Add New System'}
                  </CCardTitle>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
                  {systemError && (
                    <CAlert color="danger" className="mb-3">
                      {systemError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleSystemSubmit}>
                    <CRow className="mb-3">
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="systemName">System Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="systemName"
                          name="systemName"
                          value={systemFormData.systemName}
                          onChange={handleSystemInputChange}
                          placeholder="Enter system name"
                          required
                          className="form-control-sm"
                        />
                      </CCol>
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="chargeOfSystem">Charge of System</CFormLabel>
                        <CFormInput
                          type="text"
                          id="chargeOfSystem"
                          name="chargeOfSystem"
                          value={systemFormData.chargeOfSystem}
                          onChange={handleSystemInputChange}
                          placeholder="Enter charge of system"
                          required
                          className="form-control-sm"
                        />
                      </CCol>
                    </CRow>

                    <CRow className="mb-3">
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="willOccupy">Will Occupy</CFormLabel>
                        <CFormSelect
                          id="willOccupy"
                          name="willOccupy"
                          value={systemFormData.willOccupy.toString()}
                          onChange={handleSystemInputChange}
                          className="form-select-sm"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </CFormSelect>
                      </CCol>

                      {/* Conditional Color Picker - Show only when willOccupy is true */}
                      {systemFormData.willOccupy && (
                        <CCol xs={12} md={6}>
                          <CFormLabel htmlFor="color">Choose Table Color</CFormLabel>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <CFormInput
                              type="color"
                              id="color"
                              name="color"
                              value={systemFormData.color}
                              onChange={handleSystemInputChange}
                              className="form-control-color"
                              style={{
                                width: '50px',
                                height: '38px',
                                padding: '4px',
                                cursor: 'pointer',
                                minWidth: '50px'
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
                              className="form-control-sm "
                              style={{ fontFamily: 'monospace', minWidth: '120px' }}
                            />
                          </div>
                          <small className="text-muted d-block mt-1">
                            Selected color will be used to highlight occupied tables
                          </small>
                        </CCol>
                      )}
                    </CRow>

                    <CRow>
                      <CCol>
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={systemSaving}
                            className="btn-sm"
                            size="sm"
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
                              className="btn-sm"
                              size="sm"
                            >
                              Cancel
                            </CButton>
                          )}
                        </div>
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
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <CCardTitle className="h6 mb-0">System Settings</CCardTitle>
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                      <CButton
                        color="success"
                        size="sm"
                        className="btn-sm"
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
                        <span className="d-none d-sm-inline">Add New</span>
                        <span className="d-inline d-sm-none">Add</span>
                      </CButton>
                      <CButton
                        color="primary"
                        size="sm"
                        className="btn-sm"
                        onClick={fetchSystems}
                        disabled={systemLoading}
                      >
                        {systemLoading ? <CSpinner size="sm" /> : 'Refresh'}
                      </CButton>
                    </div>
                  </div>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
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
                    <>
                      {/* Desktop Table */}
                      <div className="d-none d-lg-block">
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
                      </div>

                      {/* Mobile Cards */}
                      <div className="d-lg-none">
                        {systems.map((system) => (
                          <div key={system._id} className="card mb-3">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title mb-0 d-flex align-items-center">
                                  <CIcon icon={cilSettings} className="me-2" />
                                  {system.systemName}
                                </h6>
                                <div className="d-flex gap-1">
                                  <CButton
                                    color="warning"
                                    size="sm"
                                    className="btn-sm"
                                    onClick={() => handleSystemEdit(system)}
                                  >
                                    <CIcon icon={cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    size="sm"
                                    className="btn-sm"
                                    onClick={() => handleSystemDelete(system._id)}
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </div>
                              </div>

                              <div className="row g-2">
                                <div className="col-6">
                                  <small className="text-muted">Charge:</small>
                                  <div><CBadge color="info">₹{system.chargeOfSystem}</CBadge></div>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted">Will Occupy:</small>
                                  <div>
                                    <CBadge color={system.willOccupy ? 'success' : 'secondary'}>
                                      {system.willOccupy ? 'Yes' : 'No'}
                                    </CBadge>
                                  </div>
                                </div>
                                {system.willOccupy && system.color && (
                                  <div className="col-12">
                                    <small className="text-muted">Color:</small>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                      <div
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                          backgroundColor: system.color,
                                          borderRadius: '4px',
                                          border: '1px solid #dee2e6'
                                        }}
                                        title={`Color: ${system.color}`}
                                      />
                                      <small className="text-muted" style={{ fontFamily: 'monospace' }}>
                                        {system.color}
                                      </small>
                                    </div>
                                  </div>
                                )}
                                <div className="col-12">
                                  <small className="text-muted">Created:</small>
                                  <div className="small">{new Date(system.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>

        {/* Tax Tab */}
        <CTabPane role="tabpanel" aria-labelledby="tax-tab" visible={activeTab === 'tax'}>
          {/* Add/Edit Tax Form */}
          <CRow className="mb-3 mb-md-4">
            <CCol>
              <CCard>
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <CCardTitle className="h6 mb-0">
                    <CIcon icon={cilMoney} className="me-1 me-md-2" />
                    {editingTax ? 'Edit Tax' : 'Add New Tax'}
                  </CCardTitle>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
                  {taxError && (
                    <CAlert color="danger" className="mb-3">
                      {taxError}
                    </CAlert>
                  )}

                  <CForm onSubmit={handleTaxSubmit}>
                    <CRow className="mb-3">
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="taxName">Tax Name</CFormLabel>
                        <CFormInput
                          type="text"
                          id="taxName"
                          name="taxName"
                          value={taxFormData.taxName}
                          onChange={handleTaxInputChange}
                          placeholder="Enter tax name (e.g., GST, VAT)"
                          required
                          className="form-control-sm"
                        />
                      </CCol>
                      <CCol xs={12} md={6}>
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
                          className="form-control-sm"
                        />
                      </CCol>
                    </CRow>

                    <CRow className="mb-3">
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="taxType">Tax Type</CFormLabel>
                        <CFormSelect
                          id="taxType"
                          name="taxType"
                          value={taxFormData.taxType}
                          onChange={handleTaxInputChange}
                          className="form-select-sm"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </CFormSelect>
                      </CCol>
                    </CRow>

                    <CRow>
                      <CCol>
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={taxSaving}
                            className="btn-sm"
                            size="sm"
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
                              className="btn-sm"
                              size="sm"
                            >
                              Cancel
                            </CButton>
                          )}
                        </div>
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
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <CCardTitle className="h6 mb-0">Tax Settings</CCardTitle>
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                      <CButton
                        color="success"
                        size="sm"
                        className="btn-sm"
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
                        <span className="d-none d-sm-inline">Add New</span>
                        <span className="d-inline d-sm-none">Add</span>
                      </CButton>
                      <CButton
                        color="primary"
                        size="sm"
                        className="btn-sm"
                        onClick={fetchTaxes}
                        disabled={taxLoading}
                      >
                        {taxLoading ? <CSpinner size="sm" /> : 'Refresh'}
                      </CButton>
                    </div>
                  </div>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
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
                    <>
                      {/* Desktop Table */}
                      <div className="d-none d-lg-block">
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
                      </div>

                      {/* Mobile Cards */}
                      <div className="d-lg-none">
                        {taxes.map((tax) => (
                          <div key={tax._id} className="card mb-3">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title mb-0 d-flex align-items-center">
                                  <CIcon icon={cilMoney} className="me-2" />
                                  {tax.taxName}
                                </h6>
                                <div className="d-flex gap-1">
                                  <CButton
                                    color="warning"
                                    size="sm"
                                    className="btn-sm"
                                    onClick={() => handleTaxEdit(tax)}
                                  >
                                    <CIcon icon={cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    size="sm"
                                    className="btn-sm"
                                    onClick={() => handleTaxDelete(tax._id)}
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                </div>
                              </div>

                              <div className="row g-2">
                                <div className="col-6">
                                  <small className="text-muted">Charge:</small>
                                  <div><CBadge color="info">{formatTaxCharge(tax.taxCharge, tax.taxType)}</CBadge></div>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted">Type:</small>
                                  <div>
                                    <CBadge color={tax.taxType === 'percentage' ? 'success' : 'warning'}>
                                      {tax.taxType === 'percentage' ? 'Percentage' : 'Fixed'}
                                    </CBadge>
                                  </div>
                                </div>
                                <div className="col-12">
                                  <small className="text-muted">Created:</small>
                                  <div className="small">{new Date(tax.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <CCardTitle className="h6 mb-0">
                    <CIcon icon={cilUser} className="me-1 me-md-2" />
                    Customer Settings
                  </CCardTitle>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
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
                        <CCol xs={12} md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="lostCustomerDays">
                              Lost Customer Period
                            </CFormLabel>
                            <CInputGroup size="sm">
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
                                className="form-control-sm"
                              />
                              <CInputGroupText className="small">days</CInputGroupText>
                            </CInputGroup>
                            <small className="text-muted">Days after which a customer is considered lost</small>
                          </div>
                        </CCol>

                        {/* High Spender Amount */}
                        <CCol xs={12} md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="highSpenderAmount">
                              High Spender Amount
                            </CFormLabel>
                            <CInputGroup size="sm">
                              <CInputGroupText className="small">₹</CInputGroupText>
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
                                className="form-control-sm"
                              />
                            </CInputGroup>
                            <small className="text-muted">Minimum amount to be considered a high spender</small>
                          </div>
                        </CCol>

                        {/* Regular Customer Period */}
                        <CCol xs={12} md={4}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="regularCustomerDays">
                              Regular Customer Period
                            </CFormLabel>
                            <CInputGroup size="sm">
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
                                className="form-control-sm"
                              />
                              <CInputGroupText className="small">days</CInputGroupText>
                            </CInputGroup>
                            <small className="text-muted">Days to consider a customer as regular</small>
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
                            className="btn-sm"
                            size="sm"
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
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <CCardTitle className="h6 mb-0">
                      <CIcon icon={cilMoney} className="me-1 me-md-2" />
                      All Membership Plans ({members?.length || 0})
                    </CCardTitle>
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                      <CButton
                        color="primary"
                        size="sm"
                        className="btn-sm"
                        onClick={() => dispatch(fetchMembers(token))}
                      >
                        <CIcon icon={cilSettings} className="me-1" />
                        Refresh
                      </CButton>
                      <CButton
                        color="success"
                        size="sm"
                        className="btn-sm"
                        onClick={() => {
                          resetMemberForm();
                          setMemberDialog({ open: true, mode: 'create', member: null });
                        }}
                      >
                        <CIcon icon={cilPlus} className="me-1" />
                        <span className="d-none d-sm-inline">Add Plan</span>
                        <span className="d-inline d-sm-none">Add</span>
                      </CButton>
                    </div>
                  </div>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
                  {memberLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading membership plans...</p>
                    </div>
                  ) : members?.length === 0 ? (
                    <div className="text-center py-4">
                      <CIcon icon={cilUser} size="3xl" className="text-muted" />
                      <p className="mt-2 text-muted">No membership plans found</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {(members ?? []).map((member) => (
                        <div key={member._id} className="col-12 col-sm-6 col-lg-4">
                          <div className="card h-100">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title mb-0 fw-bold">
                                  {member.membershipName}
                                </h6>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMenuClick(e, member, 'member');
                                    }}
                                  >
                                    <CIcon icon={cilSettings} />
                                  </button>
                                </div>
                              </div>

                              <p className="card-text text-muted small mb-3">
                                {member.notes || 'No description.'}
                              </p>

                              <div className="d-flex flex-wrap gap-2">
                                <span className="badge bg-primary text-white">
                                  <CIcon icon={cilMoney} className="me-1" />
                                  Min: ₹{member.minSpend}
                                </span>
                                <span className="badge bg-success text-white">
                                  <CIcon icon={cilMoney} className="me-1" />
                                  {member.discountType === 'fixed'
                                    ? `₹${member.discount} OFF`
                                    : `${member.discount}% OFF`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* DIALOG FOR ADD/EDIT MEMBER */}
          <Dialog
            open={memberDialog.open}
            onClose={() => setMemberDialog({ open: false, mode: 'create', member: null })}
            maxWidth="sm"
            fullWidth
            fullScreen={window.innerWidth < 600}
          >
            <DialogTitle className="px-2 px-md-3 py-2 py-md-3">
              <div className="d-flex align-items-center">
                <CIcon icon={cilMoney} className="me-2" />
                {memberDialog.mode === 'edit' ? 'Edit Membership Plan' : 'Add New Membership Plan'}
              </div>
            </DialogTitle>
            <DialogContent className="px-2 px-md-3 py-2 py-md-3">
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <CFormLabel htmlFor="membershipName">Membership Name *</CFormLabel>
                  <CFormInput
                    id="membershipName"
                    value={memberForm.membershipName}
                    onChange={(e) => setMemberForm({ ...memberForm, membershipName: e.target.value })}
                    placeholder="Enter membership name"
                    required
                    className="form-control-sm"
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <CFormLabel htmlFor="minSpend">Minimum Spend (₹) *</CFormLabel>
                  <CFormInput
                    id="minSpend"
                    type="number"
                    value={memberForm.minSpend}
                    onChange={(e) => setMemberForm({ ...memberForm, minSpend: e.target.value })}
                    placeholder="Enter minimum spend"
                    required
                    className="form-control-sm"
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <CFormLabel htmlFor="discountType">Discount Type *</CFormLabel>
                  <CFormSelect
                    id="discountType"
                    value={memberForm.discountType}
                    onChange={(e) => setMemberForm({ ...memberForm, discountType: e.target.value })}
                    className="form-select-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </CFormSelect>
                </div>

                <div className="col-12 col-sm-6">
                  <CFormLabel htmlFor="discount">
                    Discount {memberForm.discountType === 'percentage' ? '%' : 'Amount'} *
                  </CFormLabel>
                  {/* <CFormInput
                    id="discount"
                    type="number"
                    value={memberForm.discount}
                    onChange={(e) => setMemberForm({ ...memberForm, discount: e.target.value })}
                    placeholder={`Enter discount ${memberForm.discountType === 'percentage' ? '%' : 'amount'}`}
                    required
                    label="Expiration Date"
                    type="date"
                    value={memberForm.expirationDate}
                    onChange={(e) => setMemberForm({ ...memberForm, expirationDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  /> */}
                  {/* Discount Input */}
                  <CFormInput
                    id="discount"
                    type="number"
                    value={memberForm.discount}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, discount: e.target.value })
                    }
                    placeholder={`Enter discount ${memberForm.discountType === 'percentage' ? '%' : 'amount'
                      }`}
                    required
                  />

                  {/* Expiration Date Input */}
                  <CFormInput
                    id="expirationDate"
                    type="date"
                    value={memberForm.expirationDate}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, expirationDate: e.target.value })
                    }
                    label="Expiration Date"
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </div>

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
                </Grid>
              </div>
            </DialogContent>
            <DialogActions className="px-2 px-md-3 py-2 py-md-3">
              <div className="d-flex flex-column flex-sm-row gap-2 w-100">
                <CButton
                  color="secondary"
                  onClick={() => setMemberDialog({ open: false, mode: 'create', member: null })}
                  className="btn-sm flex-fill flex-sm-grow-0"
                >
                  Cancel
                </CButton>
                <CButton
                  color="primary"
                  onClick={handleMemberSubmit}
                  disabled={memberLoading}
                  className="btn-sm flex-fill flex-sm-grow-0"
                >
                  {memberLoading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {memberDialog.mode === 'edit' ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilSave} className="me-2" />
                      {memberDialog.mode === 'edit' ? 'Update Plan' : 'Create Plan'}
                    </>
                  )}
                </CButton>
              </div>
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
                <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                  <CCardTitle className="h6 mb-0">
                    <CIcon icon={cilSettings} className="me-1 me-md-2" />
                    Inventory Stock Settings
                  </CCardTitle>
                </CCardHeader>
                <CCardBody className="px-2 px-md-3 py-2 py-md-3">
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
                        <CCol xs={12} md={6}>
                          <div className="mb-3">
                            <CFormLabel htmlFor="lowStockThreshold">
                              Low Stock Threshold
                            </CFormLabel>
                            <CInputGroup size="sm">
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
                                className="form-control-sm"
                              />
                              <CInputGroupText className="small">units</CInputGroupText>
                            </CInputGroup>
                            <small className="text-muted d-block mt-1">
                              Set the minimum quantity threshold for low stock alerts
                            </small>
                          </div>
                        </CCol>
                      </CRow>

                      {/* Action Buttons */}
                      <CRow className="mb-3">
                        <CCol>
                          <div className="d-flex flex-column flex-sm-row gap-2">
                            <CButton
                              type="submit"
                              color="primary"
                              disabled={inventoryStockSaving}
                              className="btn-sm"
                              size="sm"
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
                              className="btn-sm"
                              size="sm"
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
                          </div>
                        </CCol>
                      </CRow>

                      {/* Low Stock Items Display */}
                      {lowStockItems.length > 0 && (
                        <CRow>
                          <CCol>
                            <CCard>
                              <CCardHeader className="px-2 px-md-3 py-2 py-md-3">
                                <CCardTitle className="h6 mb-0">
                                  <CIcon icon={cilSettings} className="me-1 me-md-2" />
                                  Low Stock Items ({lowStockItems.length})
                                </CCardTitle>
                              </CCardHeader>
                              <CCardBody className="px-2 px-md-3 py-2 py-md-3">
                                {/* Desktop Table */}
                                <div className="d-none d-lg-block">
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
                                </div>

                                {/* Mobile Cards */}
                                <div className="d-lg-none">
                                  {lowStockItems.map((item, index) => {
                                    const currentQuantity = item.currentQuantity || item.usedQuantity || 0;
                                    return (
                                      <div key={index} className="card mb-3">
                                        <div className="card-body p-3">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="card-title mb-0">
                                              {item.itemName || 'Unknown Item'}
                                            </h6>
                                            <CBadge color="warning">LOW STOCK</CBadge>
                                          </div>
                                          <div className="row g-2">
                                            <div className="col-6">
                                              <small className="text-muted">Current Stock:</small>
                                              <div><CBadge color="danger">{currentQuantity}</CBadge></div>
                                            </div>
                                            <div className="col-6">
                                              <small className="text-muted">Threshold:</small>
                                              <div className="small">{inventoryStockSettings.lowStockThreshold}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
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
        {/* Shortcuts Tab */}
        <CTabPane visible={activeTab === "shortcuts"}>
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader>
                  <CCardTitle className="h6 mb-0">
                    <Keyboard className="me-2" /> Keyboard Shortcuts
                  </CCardTitle>
                </CCardHeader>

                {/* Inside the Shortcuts CTabPane, BEFORE the form */}

                <CCardBody>
                  <CRow className="mb-3">
                    <CCol>
                      <div className="d-flex gap-2">
                        <CButton
                          color="info"
                          size="sm"
                          onClick={handleSelectFromPredefined}
                        >
                          <CIcon icon={cilPlus} className="me-2" />
                          Browse Available Shortcuts
                        </CButton>

                        <div className="ms-auto">
                          <CBadge color="secondary" className="p-2">
                            {shortcuts.length} / {AVAILABLE_SHORTCUTS.length} shortcuts configured
                          </CBadge>
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                  {/* <CForm onSubmit={handleShortcutSubmit}>
                    <CRow className="mb-3">
                      <CCol xs={12} md={6}>
                        <CFormLabel>Action Name</CFormLabel>
                        <CFormInput
                          type="text"
                          value={shortcutFormData.action}
                          onChange={(e) =>
                            setShortcutFormData({
                              ...shortcutFormData,
                              action: e.target.value,
                            })
                          }
                          placeholder="e.g., Open Orders"
                          required
                        />
                      </CCol>
                    </CRow>

                    {shortcutFormData.keys.map((key, index) => (
                      <CRow key={index} className="mb-3 align-items-center">
                        <CCol xs={12} md={5}>
                          <CFormLabel>Key Combination</CFormLabel>
                          <CFormInput
                            type="text"
                            readOnly
                            value={key.combination.join(" + ")}
                            onFocus={() => setRecordingIndex(index)}
                            placeholder="Press keys..."
                            onKeyDown={(e) => handleKeyDown(e, index)}
                          />
                        </CCol>
                        <CCol xs={12} md={5}>
                          <CFormLabel>Description</CFormLabel>
                          <CFormInput
                            type="text"
                            value={key.description}
                            onChange={(e) => {
                              const newKeys = [...shortcutFormData.keys];
                              newKeys[index].description = e.target.value;
                              setShortcutFormData({
                                ...shortcutFormData,
                                keys: newKeys,
                              });
                            }}
                            placeholder="What does this shortcut do?"
                          />
                        </CCol>
                        <CCol xs={12} md={2} className="d-flex align-items-end">
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => removeKeySlot(index)}
                          >
                            Remove
                          </CButton>
                        </CCol>
                      </CRow>
                    ))}

                    <CButton
                      type="button"
                      color="info"
                      size="sm"
                      className="me-2"
                      onClick={addKeySlot}
                    >
                      Add Key Combination
                    </CButton>

                    <CButton
                      type="submit"
                      color="primary"
                      size="sm"
                      disabled={shortcutLoading}
                    >
                      {shortcutLoading ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          {editingShortcut ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilSave} className="me-2" />
                          {editingShortcut ? "Update Shortcut" : "Add Shortcut"}
                        </>
                      )}
                    </CButton>

                    {editingShortcut && (
                      <CButton
                        color="secondary"
                        size="sm"
                        className="ms-2"
                        onClick={handleShortcutCancel}
                      >
                        Cancel
                      </CButton>
                    )}
                  </CForm> */}

                  <Divider className="my-4" />

                  {/* Table/List of Shortcuts */}
                  {shortcutLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Loading shortcuts...</p>
                    </div>
                  ) : (
                    <CTable responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Action</CTableHeaderCell>
                          <CTableHeaderCell>Keys</CTableHeaderCell>
                          <CTableHeaderCell>Description</CTableHeaderCell>
                          {/* --- ADDED THIS --- */}
                          <CTableHeaderCell>Active</CTableHeaderCell>
                          <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {shortcuts.map((shortcut) => (
                          <CTableRow key={shortcut._id}>
                            <CTableDataCell>{shortcut.action}</CTableDataCell>
                            <CTableDataCell>
                              {shortcut.keys
                                ?.map((k) => k.combination.join(" + "))
                                .join(", ")}
                            </CTableDataCell>
                            <CTableDataCell>
                              {shortcut.keys.map((k) => k.description).join(", ")}
                            </CTableDataCell>

                            {/* --- ADDED THIS CELL --- */}
                            <CTableDataCell>
                              <CFormCheck
                                id={`shortcut-toggle-${shortcut._id}`}
                                // Default to 'true' if 'isActive' is undefined
                                checked={shortcut.isActive !== false}
                                onChange={(e) => handleShortcutToggle(shortcut, e.target.checked)}
                                disabled={shortcutLoading}
                              />
                            </CTableDataCell>

                            <CTableDataCell>
                              {/* <CButton
                                color="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleShortcutEdit(shortcut)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton> */}
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleShortcutDelete(shortcut._id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                  {/* Predefined Shortcuts Selection Modal */}
                  <Dialog
                    open={showShortcutModal}
                    onClose={() => setShowShortcutModal(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={window.innerWidth < 600}
                  >
                    <DialogTitle>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <Keyboard className="me-2" />
                          Available Keyboard Shortcuts
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => setShowShortcutModal(false)}
                        >
                          <X size={20} />
                        </IconButton>
                      </div>
                    </DialogTitle>

                    <DialogContent>
                      {/* Search Bar */}
                      <div className="mb-3">
                        <CInputGroup size="sm">
                          <CInputGroupText>
                            <Search size={16} />
                          </CInputGroupText>
                          <CFormInput
                            type="text"
                            placeholder="Search shortcuts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </CInputGroup>
                      </div>

                      {/* Shortcut Selection List */}
                      <div className="mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {Object.entries(getFilteredShortcuts()).map(([category, categoryShortcuts]) => (
                          <div key={category} className="mb-3">
                            <Typography variant="body2" className="fw-bold text-primary mb-2">
                              {category} ({categoryShortcuts.length})
                            </Typography>

                            <div className="d-flex flex-column gap-2">
                              {categoryShortcuts.map((shortcut) => {
                                // Check if this shortcut is already added
                                const isAlreadyAdded = shortcuts.some(
                                  s => s.action === shortcut.action
                                );

                                const isSelected = selectedPredefinedShortcut?.action === shortcut.action;

                                return (
                                  <div
                                    key={shortcut.action}
                                    className={`p-3 border rounded ${isSelected ? 'border-primary bg-primary bg-opacity-10' : ''
                                      } ${isAlreadyAdded ? 'opacity-50 bg-light' : 'cursor-pointer'}`}
                                    onClick={() => {
                                      if (!isAlreadyAdded) {
                                        setSelectedPredefinedShortcut(shortcut);
                                        setCustomKeyCombination(shortcut.suggestedKeys);
                                      }
                                    }}
                                    style={{
                                      cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                          <strong>{shortcut.action}</strong>
                                          {isAlreadyAdded && (
                                            <CBadge color="success">
                                              <CheckCircle size={12} className="me-1" />
                                              Added
                                            </CBadge>
                                          )}
                                        </div>
                                        <div className="small text-muted">
                                          {shortcut.description}
                                        </div>
                                        {shortcut.route && (
                                          <div className="small text-info mt-1">
                                            Route: {shortcut.route}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <CBadge
                                          color={isAlreadyAdded ? 'secondary' : 'info'}
                                          className="text-white"
                                        >
                                          {shortcut.suggestedKeys.join(' + ')}
                                        </CBadge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {Object.keys(getFilteredShortcuts()).length === 0 && (
                          <div className="text-center py-4">
                            <AlertCircle size={48} className="text-muted mb-2" />
                            <p className="text-muted">No shortcuts found matching "{searchQuery}"</p>
                          </div>
                        )}
                      </div>

                      {/* Key Recording Section */}
                      {selectedPredefinedShortcut && (
                        <div className="border rounded p-3 bg-light">
                          <Typography variant="subtitle2" className="mb-2 fw-bold">
                            Customize Key Combination:
                          </Typography>

                          <div className="d-flex gap-2 align-items-center mb-2">
                            <CFormInput
                              type="text"
                              readOnly
                              value={customKeyCombination.join(' + ') || 'Click and press keys...'}
                              onFocus={() => setCustomKeyRecording(true)}
                              onKeyDown={handleModalKeyDown}
                              placeholder="Click and press keys..."
                              className="form-control-sm"
                              style={{
                                backgroundColor: customKeyRecording ? '#fff3cd' : 'white',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            />

                            <CButton
                              color="secondary"
                              size="sm"
                              onClick={() => {
                                setCustomKeyCombination([]);
                                setCustomKeyRecording(true);
                              }}
                              title="Reset and record new combination"
                            >
                              <RefreshCw size={16} />
                            </CButton>
                          </div>

                          {customKeyRecording && (
                            <Alert severity="warning" className="py-1">
                              <div className="d-flex align-items-center">
                                <AlertCircle size={16} className="me-2" />
                                <small>Press your desired key combination now...</small>
                              </div>
                            </Alert>
                          )}

                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Selected:</strong> {selectedPredefinedShortcut.action}
                            </small>
                          </div>
                        </div>
                      )}
                    </DialogContent>

                    <DialogActions className="p-3">
                      <CButton
                        color="secondary"
                        size="sm"
                        onClick={() => {
                          setShowShortcutModal(false);
                          setSelectedPredefinedShortcut(null);
                          setCustomKeyCombination([]);
                          setSearchQuery('');
                        }}
                      >
                        Cancel
                      </CButton>

                      <CButton
                        color="primary"
                        size="sm"
                        onClick={handleSaveSelectedShortcut}
                        disabled={!selectedPredefinedShortcut || customKeyCombination.length === 0}
                      >
                        <CIcon icon={cilSave} className="me-2" />
                        Add Shortcut
                      </CButton>
                    </DialogActions>
                  </Dialog>
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