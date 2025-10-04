import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  createCoupon,
  fetchCoupons,
  updateCoupon,
  deleteCoupon,
  clearCouponState
} from '../../redux/slices/coupenSlice';
import {
  fetchMembers,
  addMember,
  updateMember,
  deleteMember
} from '../../redux/slices/memberSlice';
import { fetchCustomers } from '../../redux/slices/customerSlice';

function CustomerLoyalty() {
  const [activeTab, setActiveTab] = useState(0);

  // Coupon Form states
  const [couponCode, setCouponCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const { customers, loading } = useSelector((state) => state.customers);

  // Member Form states
  const [memberForm, setMemberForm] = useState({
    customerName: '',
    customerId: '',
    membershipName: '',
    discountType: 'percentage',
    discount: '',
    startDate: '',
    expirationDate: '',
    status: 'active',
    notes: ''
  });

  const [memberDialog, setMemberDialog] = useState({ open: false, mode: 'create', member: null });
  const [memberDetailDialog, setMemberDetailDialog] = useState({ open: false, member: null });

  // UI states
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', item: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const dispatch = useDispatch();
  const { coupons, loading: couponLoading, error: couponError, successMessage } = useSelector(state => state.coupons);
  const { members, loading: memberLoading, error: memberError } = useSelector(state => state.members);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    dispatch(fetchCoupons());
    dispatch(fetchMembers(token));
    dispatch(fetchCustomers(restaurantId));
    return () => {
      dispatch(clearCouponState());
    };
  }, [dispatch, token, restaurantId]);

  useEffect(() => {
    if (successMessage) {
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      dispatch(clearCouponState());
    }
    if (couponError) {
      setSnackbar({ open: true, message: couponError.message || 'An error occurred', severity: 'error' });
      dispatch(clearCouponState());
    }
    if (memberError) {
      setSnackbar({ open: true, message: memberError.message || 'An error occurred', severity: 'error' });
    }
  }, [successMessage, couponError, memberError, dispatch]);

  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 3) + 6;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const getCouponStatus = (coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    const isMaxUsageReached = coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;
    const isInactive = !coupon.isActive;
    return { isExpired, isMaxUsageReached, isInactive };
  };

  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const validateCouponForm = () => {
    if (discountType === 'percentage' && discountPercentage && (discountPercentage < 1 || discountPercentage > 100)) {
      setSnackbar({ open: true, message: 'Discount percentage must be between 1 and 100', severity: 'error' });
      return false;
    }
    if (expiryDate && new Date(expiryDate) <= new Date()) {
      setSnackbar({ open: true, message: 'Expiry date must be in the future', severity: 'error' });
      return false;
    }
    return true;
  };

  const validateMemberForm = () => {
    if (!memberForm.customerName || !memberForm.customerId || !memberForm.membershipName || !memberForm.discount || !memberForm.expirationDate) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return false;
    }
    if (memberForm.discountType === 'percentage' && (memberForm.discount < 0 || memberForm.discount > 100)) {
      setSnackbar({ open: true, message: 'Discount percentage must be between 0 and 100', severity: 'error' });
      return false;
    }
    if (memberForm.discountType === 'fixed' && memberForm.discount < 0) {
      setSnackbar({ open: true, message: 'Discount amount must be greater than 0', severity: 'error' });
      return false;
    }
    if (new Date(memberForm.expirationDate) <= new Date()) {
      setSnackbar({ open: true, message: 'Expiration date must be in the future', severity: 'error' });
      return false;
    }
    return true;
  };

  const handleCouponSubmit = async () => {
    if (!validateCouponForm()) return;

    const couponData = {
      code: couponCode || generateCouponCode(),
      discountType,
      discountValue: parseFloat(discountPercentage) || 10,
      expiryDate: expiryDate || getDefaultExpiryDate(),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      description: description.trim(),
      isActive
    };

    try {
      if (editingCoupon) {
        await dispatch(updateCoupon({ id: editingCoupon._id, updates: couponData })).unwrap();
        setEditingCoupon(null);
      } else {
        await dispatch(createCoupon(couponData)).unwrap();
      }
      resetCouponForm();
      dispatch(fetchCoupons());
    } catch (error) {
      console.error('Coupon submission error:', error);
    }
  };

  const handleMemberSubmit = async () => {
    if (!validateMemberForm()) return;

    const memberData = {
      ...memberForm,
      discount: parseFloat(memberForm.discount),
      startDate: memberForm.startDate || new Date().toISOString()
    };

    try {
      if (memberDialog.mode === 'edit') {
        await dispatch(updateMember({ id: memberDialog.member._id, memberData })).unwrap();
        setSnackbar({ open: true, message: 'Member updated successfully', severity: 'success' });
      } else {
        await dispatch(addMember(memberData)).unwrap();
        setSnackbar({ open: true, message: 'Member added successfully', severity: 'success' });
      }
      setMemberDialog({ open: false, mode: 'create', member: null });
      resetMemberForm();
      dispatch(fetchMembers(token));
    } catch (error) {
      console.error('Member submission error:', error);
      setSnackbar({ open: true, message: 'Failed to save member', severity: 'error' });
    }
  };

  const resetCouponForm = () => {
    setCouponCode('');
    setExpiryDate('');
    setDiscountPercentage('');
    setDiscountType('percentage');
    setMinOrderValue('');
    setMaxDiscountAmount('');
    setMaxUsage('');
    setDescription('');
    setIsActive(true);
    setEditingCoupon(null);
  };

  const resetMemberForm = () => {
    setMemberForm({
      customerName: '',
      customerId: '',
      membershipName: '',
      discountType: 'percentage',
      discount: '',
      startDate: '',
      expirationDate: '',
      status: 'active',
      notes: ''
    });
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon.code);
    setExpiryDate(coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '');
    setDiscountPercentage(coupon.discountValue?.toString() || '');
    setDiscountType(coupon.discountType || 'percentage');
    setMinOrderValue(coupon.minOrderValue?.toString() || '');
    setMaxDiscountAmount(coupon.maxDiscountAmount?.toString() || '');
    setMaxUsage(coupon.maxUsage?.toString() || '');
    setDescription(coupon.description || '');
    setIsActive(coupon.isActive !== false);
    setAnchorEl(null);
  };

  const handleEditMember = (member) => {
    setMemberForm({
      customerName: member.customerName,
      customerId: member.customerId._id || member.customerId,
      membershipName: member.membershipName,
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

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnackbar({ open: true, message: `Code "${code}" copied!`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to copy code', severity: 'error' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleMenuClick = (event, item, type) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ item, type });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const getMembershipStatus = (member) => {
    const isExpired = new Date(member.expirationDate) < new Date();
    return {
      isExpired,
      isInactive: member.status === 'inactive',
      statusColor: isExpired ? 'error' : member.status === 'active' ? 'success' : 'warning'
    };
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      setMemberForm(prev => ({
        ...prev,
        customerId: customer._id,
        customerName: customer.name
      }));
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Heart size={32} color="#1976d2" />
        Customer Loyalty Program
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Award size={20} />} label="Coupons" iconPosition="start" />
          <Tab icon={<Users size={20} />} label="Memberships" iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {editingCoupon ? <Edit size={20} /> : <Plus size={20} />}
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Leave empty to auto-generate"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Discount Type</InputLabel>
                      <Select
                        value={discountType}
                        label="Discount Type"
                        onChange={(e) => setDiscountType(e.target.value)}
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
                      label={`Discount ${discountType === 'percentage' ? '%' : 'Amount'}`}
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Min Order Value (₹)"
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max Usage Count"
                      type="number"
                      value={maxUsage}
                      onChange={(e) => setMaxUsage(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                      label={`Status: ${isActive ? 'Active' : 'Inactive'}`}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCouponSubmit}
                    disabled={couponLoading}
                    startIcon={couponLoading ? <CircularProgress size={20} /> : <Save size={20} />}
                  >
                    {editingCoupon ? 'Update' : 'Create'}
                  </Button>
                  <Button variant="outlined" onClick={resetCouponForm} sx={{ minWidth: 100 }}>
                    {editingCoupon ? 'Cancel' : 'Reset'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    All Coupons ({coupons?.length || 0})
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => dispatch(fetchCoupons())}
                    startIcon={<RefreshCw size={16} />}
                  >
                    Refresh
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {couponLoading && coupons?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : coupons?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Heart size={48} style={{ color: '#ccc' }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                      No coupons found
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                    {(coupons ?? []).map((coupon) => {
                      const { isExpired, isMaxUsageReached, isInactive } = getCouponStatus(coupon);

                      return (
                        <Paper
                          key={coupon._id}
                          elevation={1}
                          sx={{
                            p: 2,
                            mb: 2,
                            border: '1px solid',
                            borderColor: (isExpired || isMaxUsageReached || isInactive) ? 'error.main' : 'divider',
                            opacity: (isExpired || isMaxUsageReached || isInactive) ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              elevation: 2,
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: (isExpired || isMaxUsageReached || isInactive) ? 'text.secondary' : 'primary.main'
                              }}
                            >
                              {coupon.code}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Tooltip title="Copy Code">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyCode(coupon.code)}
                                  color="primary"
                                >
                                  <Copy size={16} />
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, coupon, 'coupon')}
                              >
                                <MoreVertical size={16} />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            <Chip
                              icon={<Calendar size={12} />}
                              label={`Expires: ${formatDate(coupon.expiryDate)}`}
                              size="small"
                              color={isExpired ? "error" : "warning"}
                              variant="outlined"
                            />
                            <Chip
                              label={`${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' ₹'} OFF`}
                              size="small"
                              color="success"
                              variant="filled"
                            />
                            {coupon.usageCount !== undefined && (
                              <Chip
                                label={`Used: ${coupon.usageCount || 0}${coupon.maxUsage ? `/${coupon.maxUsage}` : ''}`}
                                size="small"
                                color={isMaxUsageReached ? "error" : "info"}
                                variant="outlined"
                              />
                            )}
                            {isInactive && (
                              <Chip
                                label="Inactive"
                                size="small"
                                color="error"
                                variant="filled"
                              />
                            )}
                          </Box>

                          {coupon.minOrderValue && coupon.minOrderValue > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Min Order: ₹{coupon.minOrderValue}
                            </Typography>
                          )}

                          {coupon.maxDiscountAmount && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Max Discount: ₹{coupon.maxDiscountAmount}
                            </Typography>
                          )}

                          {coupon.description && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                              "{coupon.description}"
                            </Typography>
                          )}

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Created: {formatDate(coupon.createdAt)}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    All Memberships ({members?.length || 0})
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
                      onClick={() => setMemberDialog({ open: true, mode: 'create', member: null })}
                      startIcon={<Plus size={20} />}
                    >
                      Add Member
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
                      No memberships found
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {(members ?? []).map((member) => {
                      const { isExpired, isInactive, statusColor } = getMembershipStatus(member);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={member._id}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              opacity: isExpired || isInactive ? 0.6 : 1,
                              '&:hover': { elevation: 4 }
                            }}
                            onClick={() => setMemberDetailDialog({ open: true, member })}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {member.customerName}
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
                              {member.membershipName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              <Chip 
                                label={`${member.discount}${member.discountType === 'percentage' ? '%' : ' ₹'} OFF`} 
                                size="small" 
                                color="success" 
                              />
                              <Chip label={member.status} size="small" color={statusColor} />
                              <Chip label={`Visits: ${member.visitsCount || 0}`} size="small" variant="outlined" />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              Expires: {formatDate(member.expirationDate)}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={memberDialog.open} onClose={() => setMemberDialog({ open: false, mode: 'create', member: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {memberDialog.mode === 'edit' ? 'Edit Member' : 'Add New Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Membership Name"
                value={memberForm.membershipName}
                onChange={(e) => setMemberForm({ ...memberForm, membershipName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={memberForm.discountType}
                  label="Discount Type"
                  onChange={(e) => setMemberForm({ ...memberForm, discountType:e.target.value })}
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

            <Grid item xs={12} sm={6}>
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialog({ open: false, mode: 'create', member: null })}>
            Cancel
          </Button>
          <Button onClick={handleMemberSubmit} variant="contained" disabled={memberLoading}>
            {memberDialog.mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={memberDetailDialog.open} onClose={() => setMemberDetailDialog({ open: false, member: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Member Details
          <IconButton onClick={() => setMemberDetailDialog({ open: false, member: null })}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {memberDetailDialog.member && (
            <Box>
              <Typography variant="h6" gutterBottom>{memberDetailDialog.member.customerName}</Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Membership</Typography>
                  <Typography variant="body1">{memberDetailDialog.member.membershipName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Discount</Typography>
                  <Typography variant="body1">
                    {memberDetailDialog.member.discount}{memberDetailDialog.member.discountType === 'percentage' ? '%' : ' ₹'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">{formatDate(memberDetailDialog.member.startDate)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Expiration</Typography>
                  <Typography variant="body1">{formatDate(memberDetailDialog.member.expirationDate)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={memberDetailDialog.member.status} size="small" color={getMembershipStatus(memberDetailDialog.member).statusColor} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Total Visits</Typography>
                  <Typography variant="body1">{memberDetailDialog.member.visitsCount || 0}</Typography>
                </Grid>
                {memberDetailDialog.member.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2">{memberDetailDialog.member.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: '', item: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteDialog.type}?
            {deleteDialog.type === 'coupon' && deleteDialog.item && ` (${deleteDialog.item.code})`}
            {deleteDialog.type === 'member' && deleteDialog.item && ` (${deleteDialog.item.customerName})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: '', item: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          if (selectedItem?.type === 'coupon') {
            handleEditCoupon(selectedItem.item);
          } else if (selectedItem?.type === 'member') {
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
    </Box>
  );
}

export default CustomerLoyalty;