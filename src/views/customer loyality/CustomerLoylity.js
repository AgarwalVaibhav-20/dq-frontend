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
  Snackbar
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
  CheckCircle
} from 'lucide-react';
import {
  createCoupon,
  fetchCoupons,
  updateCoupon,
  deleteCoupon,
  clearCouponState
} from '../../redux/slices/coupenSlice';

function CustomerLoyalty() {
  // Form states
  const [couponCode, setCouponCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // UI states
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, coupon: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Redux
  const dispatch = useDispatch();
  const { coupons, loading, error, successMessage } = useSelector(state => state.coupons);

  // Load coupons on component mount
  useEffect(() => {
    dispatch(fetchCoupons());
    return () => {
      dispatch(clearCouponState());
    };
  }, [dispatch]);

  // Handle success/error messages
  useEffect(() => {
    if (successMessage) {
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      dispatch(clearCouponState());
    }
    if (error) {
      setSnackbar({ open: true, message: error.message || 'An error occurred', severity: 'error' });
      dispatch(clearCouponState());
    }
  }, [successMessage, error, dispatch]);

  // Generate random alphanumeric coupon code
  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 3) + 6;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Get default expiry date (7 days from now)
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // Validate form
  const validateForm = () => {
    if (discountType === 'percentage' && discountPercentage && (discountPercentage < 1 || discountPercentage > 100)) {
      setSnackbar({ open: true, message: 'Discount percentage must be between 1 and 100', severity: 'error' });
      return false;
    }
    if (discountType === 'fixed' && discountPercentage && discountPercentage < 1) {
      setSnackbar({ open: true, message: 'Discount amount must be at least 1', severity: 'error' });
      return false;
    }
    if (minOrderValue && parseFloat(minOrderValue) < 0) {
      setSnackbar({ open: true, message: 'Minimum order value cannot be negative', severity: 'error' });
      return false;
    }
    if (maxUsage && parseInt(maxUsage) < 1) {
      setSnackbar({ open: true, message: 'Maximum usage must be at least 1', severity: 'error' });
      return false;
    }
    if (expiryDate && new Date(expiryDate) <= new Date()) {
      setSnackbar({ open: true, message: 'Expiry date must be in the future', severity: 'error' });
      return false;
    }
    return true;
  };

  // Handle form submission (create or update)
  const handleSubmit = async () => {
    if (!validateForm()) return;

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
        // Update existing coupon
        await dispatch(updateCoupon({
          id: editingCoupon._id,
          updates: couponData
        })).unwrap();
        setEditingCoupon(null);
      } else {
        // Create new coupon
        await dispatch(createCoupon(couponData)).unwrap();
      }

      // Reset form on success
      resetForm();

      // Refresh coupons list
      dispatch(fetchCoupons());
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Reset form
  const resetForm = () => {
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

  // Handle edit coupon
  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon.code);
    setExpiryDate(coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '');
    setDiscountPercentage(coupon.discountValue ? coupon.discountValue.toString() : '');
    setDiscountType(coupon.discountType || 'percentage');
    setMinOrderValue(coupon.minOrderValue ? coupon.minOrderValue.toString() : '');
    setMaxDiscountAmount(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '');
    setMaxUsage(coupon.maxUsage ? coupon.maxUsage.toString() : '');
    setDescription(coupon.description || '');
    setIsActive(coupon.isActive !== false);
    setAnchorEl(null);
  };

  // Handle delete coupon
  const handleDeleteCoupon = async () => {
    if (deleteDialog.coupon) {
      try {
        await dispatch(deleteCoupon(deleteDialog.coupon._id)).unwrap();
        setDeleteDialog({ open: false, coupon: null });
        dispatch(fetchCoupons()); // Refresh list
      } catch (error) {
        console.log(error , "Error is here ")
        console.error('Delete error:', error);
      }
    }
  };

  // Copy coupon code to clipboard
  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnackbar({ open: true, message: `Coupon code "${code}" copied!`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to copy code', severity: 'error' });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle menu actions
  const handleMenuClick = (event, coupon) => {
    setAnchorEl(event.currentTarget);
    setSelectedCoupon(coupon);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCoupon(null);
  };

  // Check coupon status
  const getCouponStatus = (coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    const isMaxUsageReached = coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;
    const isInactive = !coupon.isActive;

    return { isExpired, isMaxUsageReached, isInactive };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Heart size={32} color="#1976d2" />
        Customer Loyalty Program
      </Typography>

      <Grid container spacing={3}>
        {/* Coupon Form Section */}
        <Grid item xs={12} lg={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {editingCoupon ? <Edit size={20} /> : <Plus size={20} />}
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                {/* Coupon Code */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty to auto-generate"
                    helperText="6-8 alphanumeric characters (auto-generated if empty)"
                  />
                </Grid>

                {/* Discount Type and Value */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount Type"
                    select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`Discount ${discountType === 'percentage' ? 'Percentage' : 'Amount (₹)'}`}
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    inputProps={{
                      min: 1,
                      max: discountType === 'percentage' ? 100 : undefined,
                      step: discountType === 'percentage' ? 1 : 0.01
                    }}
                    helperText={`${discountType === 'percentage' ? '1-100%' : 'Minimum ₹1'} (default: 10${discountType === 'percentage' ? '%' : ' ₹'})`}
                  />
                </Grid>

                {/* Expiry Date */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Default: 7 days from today"
                  />
                </Grid>

                {/* Min Order Value and Max Usage */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Min Order Value (₹)"
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Minimum cart value to apply coupon"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Usage Count"
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    inputProps={{ min: 1 }}
                    helperText="Leave empty for unlimited usage"
                  />
                </Grid>

                {/* Max Discount Amount (for percentage type) */}
                {discountType === 'percentage' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Max Discount Amount (₹)"
                      type="number"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Maximum discount cap for percentage coupons"
                    />
                  </Grid>
                )}

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description for internal use"
                    inputProps={{ maxLength: 500 }}
                    helperText={`${description.length}/500 characters`}
                  />
                </Grid>

                {/* Active Status */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={`Coupon Status: ${isActive ? 'Active' : 'Inactive'}`}
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> :
                    editingCoupon ? <Save size={20} /> : <Plus size={20} />}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={loading}
                  sx={{ minWidth: 100 }}
                >
                  {editingCoupon ? 'Cancel' : 'Reset'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Coupons List Section */}
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loading && coupons?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading coupons...
                  </Typography>
                </Box>
              ) : coupons?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Heart size={48} style={{ color: '#ccc' }} />
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    No coupons found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first coupon to get started
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
                        {/* Coupon Header */}
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
                              onClick={(e) => handleMenuClick(e, coupon)}
                            >
                              <MoreVertical size={16} />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Status Chips */}
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

                        {/* Coupon Details */}
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

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditCoupon(selectedCoupon)}>
          <ListItemIcon>
            <Edit size={16} />
          </ListItemIcon>
          <ListItemText>Edit Coupon</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialog({ open: true, coupon: selectedCoupon });
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Trash2 size={16} />
          </ListItemIcon>
          <ListItemText>Delete Coupon</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, coupon: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle size={24} color="#f44336" />
          Delete Coupon
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the coupon <strong>"{deleteDialog.coupon?.code}"</strong>?
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone and will permanently remove the coupon from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, coupon: null })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCoupon}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          icon={snackbar.severity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Instructions Card */}
      <Card elevation={1} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            🎯 CRUD Operations Guide
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Plus size={32} color="#4caf50" />
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  CREATE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill the form and click "Create Coupon"
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <RefreshCw size={32} color="#2196f3" />
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  READ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View all coupons with status indicators
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Edit size={32} color="#ff9800" />
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  UPDATE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click menu (⋮) → Edit to modify coupons
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Trash2 size={32} color="#f44336" />
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  DELETE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click menu (⋮) → Delete with confirmation
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CustomerLoyalty;

// import React, { useState } from 'react';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   TextField,
//   Grid,
//   Paper,
//   Chip,
//   Divider,
//   Alert,
//   IconButton,
//   Tooltip
// } from '@mui/material';
// import {
//   Heart as LoyaltyIcon,
//   Copy as CopyIcon,
//   RefreshCw as RefreshIcon,
//   Calendar as CalendarIcon
// } from 'lucide-react';

// function CustomerLoyalty() {
//   const [couponCode, setCouponCode] = useState('');
//   const [expiryDate, setExpiryDate] = useState('');
//   const [discountPercentage, setDiscountPercentage] = useState('');
//   const [generatedCoupons, setGeneratedCoupons] = useState([]);
//   const [alertMessage, setAlertMessage] = useState('');

//   // Generate random alphanumeric coupon code (6-8 digits)
//   const generateCouponCode = () => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     const length = Math.floor(Math.random() * 3) + 6; // 6-8 characters
//     let result = '';

//     for (let i = 0; i < length; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//     }

//     return result;
//   };

//   // Set default expiry date to 7 days from now
//   const getDefaultExpiryDate = () => {
//     const date = new Date();
//     date.setDate(date.getDate() + 7);
//     return date.toISOString().split('T')[0];
//   };

//   // Handle coupon generation
//   const handleGenerateCoupon = () => {
//     const newCode = generateCouponCode();
//     const expiry = expiryDate || getDefaultExpiryDate();
//     const discount = discountPercentage || '10'; // Default 10% if not specified

//     setCouponCode(newCode);

//     // Console log the generated coupon details
//     console.log('🎫 Generated Coupon Code:', newCode);
//     console.log('📅 Expiry Date:', expiry);
//     console.log('💰 Discount Percentage:', discount + '%');
//     console.log('📊 Full Coupon Details:', {
//       code: newCode,
//       expiryDate: expiry,
//       discountPercentage: discount + '%',
//       generatedAt: new Date().toLocaleString()
//     });

//     // Add to generated coupons list
//     const newCoupon = {
//       id: Date.now(),
//       code: newCode,
//       expiryDate: expiry,
//       discountPercentage: discount,
//       generatedAt: new Date().toLocaleString()
//     };

//     setGeneratedCoupons(prev => [newCoupon, ...prev]);
//     setAlertMessage(`Coupon "${newCode}" with ${discount}% discount generated successfully!`);

//     // Clear alert after 3 seconds
//     setTimeout(() => setAlertMessage(''), 3000);
//   };

//   // Copy coupon code to clipboard
//   const handleCopyCode = (code) => {
//     navigator.clipboard.writeText(code);
//     setAlertMessage(`Coupon code "${code}" copied to clipboard!`);
//     setTimeout(() => setAlertMessage(''), 2000);
//   };

//   // Format date for display
//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//         <LoyaltyIcon color="primary" />
//         Customer Loyalty Program
//       </Typography>

//       {alertMessage && (
//         <Alert severity="success" sx={{ mb: 2 }}>
//           {alertMessage}
//         </Alert>
//       )}

//       <Grid container spacing={3}>
//         {/* Coupon Generation Section */}
//         <Grid item xs={12} md={6}>
//           <Card elevation={3}>
//             <CardContent>
//               <Typography variant="h6" gutterBottom color="primary">
//                 Generate Coupon
//               </Typography>
//               <Divider sx={{ mb: 2 }} />

//               <Box sx={{ mb: 3 }}>
//                 <TextField
//                   fullWidth
//                   label="Expiry Date"
//                   type="date"
//                   value={expiryDate}
//                   onChange={(e) => setExpiryDate(e.target.value)}
//                   InputLabelProps={{
//                     shrink: true,
//                   }}
//                   sx={{ mb: 2 }}
//                   helperText="Leave empty for default 7 days from today"
//                 />

//                 <TextField
//                   fullWidth
//                   label="Discount Percentage"
//                   type="number"
//                   value={discountPercentage}
//                   onChange={(e) => setDiscountPercentage(e.target.value)}
//                   inputProps={{
//                     min: 1,
//                     max: 100,
//                     step: 1
//                   }}
//                   sx={{ mb: 2 }}
//                   helperText="Enter discount percentage (1-100). Leave empty for default 10%"
//                 />

//                 <Button
//                   variant="contained"
//                   color="primary"
//                   size="large"
//                   fullWidth
//                   onClick={handleGenerateCoupon}
//                   startIcon={<RefreshIcon />}
//                   sx={{ mb: 2 }}
//                 >
//                   Generate Coupon Code
//                 </Button>
//               </Box>

//               {couponCode && (
//                 <Paper
//                   elevation={2}
//                   sx={{
//                     p: 2,
//                     backgroundColor: 'primary.light',
//                     color: 'primary.contrastText',
//                     textAlign: 'center'
//                   }}
//                 >
//                   <Typography variant="h6" gutterBottom>
//                     Generated Coupon Code
//                   </Typography>
//                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
//                     <Typography variant="h4" component="span" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
//                       {couponCode}
//                     </Typography>
//                     <Tooltip title="Copy Code">
//                       <IconButton
//                         onClick={() => handleCopyCode(couponCode)}
//                         sx={{ color: 'inherit' }}
//                       >
//                         <CopyIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </Box>
//                   <Typography variant="body2" sx={{ mt: 1 }}>
//                     Discount: {discountPercentage || '10'}% | Expires: {formatDate(expiryDate || getDefaultExpiryDate())}
//                   </Typography>
//                 </Paper>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Generated Coupons History */}
//         <Grid item xs={12} md={6}>
//           <Card elevation={3}>
//             <CardContent>
//               <Typography variant="h6" gutterBottom color="primary">
//                 Generated Coupons
//               </Typography>
//               <Divider sx={{ mb: 2 }} />

//               {generatedCoupons.length === 0 ? (
//                 <Box sx={{ textAlign: 'center', py: 4 }}>
//                   <LoyaltyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
//                   <Typography variant="body1" color="text.secondary">
//                     No coupons generated yet
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     Click "Generate Coupon Code" to create your first coupon
//                   </Typography>
//                 </Box>
//               ) : (
//                 <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
//                   {generatedCoupons.map((coupon) => (
//                     <Paper
//                       key={coupon.id}
//                       elevation={1}
//                       sx={{
//                         p: 2,
//                         mb: 2,
//                         border: '1px solid',
//                         borderColor: 'divider'
//                       }}
//                     >
//                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                         <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
//                           {coupon.code}
//                         </Typography>
//                         <Tooltip title="Copy Code">
//                           <IconButton
//                             size="small"
//                             onClick={() => handleCopyCode(coupon.code)}
//                           >
//                             <CopyIcon />
//                           </IconButton>
//                         </Tooltip>
//                       </Box>

//                       <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
//                         <Chip
//                           icon={<CalendarIcon />}
//                           label={`Expires: ${formatDate(coupon.expiryDate)}`}
//                           size="small"
//                           color="warning"
//                           variant="outlined"
//                         />
//                         <Chip
//                           label={`${coupon.discountPercentage || '10'}% OFF`}
//                           size="small"
//                           color="success"
//                           variant="filled"
//                         />
//                       </Box>

//                       <Typography variant="caption" color="text.secondary">
//                         Generated: {coupon.generatedAt}
//                       </Typography>
//                     </Paper>
//                   ))}
//                 </Box>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Instructions */}
//       <Card elevation={1} sx={{ mt: 3 }}>
//         <CardContent>
//           <Typography variant="h6" gutterBottom color="primary">
//             How to Use
//           </Typography>
//           <Divider sx={{ mb: 2 }} />
//           <Box component="ul" sx={{ pl: 2 }}>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               Set an expiry date (optional) - defaults to 7 days from today
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               Set discount percentage (optional) - defaults to 10% if not specified
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               Click "Generate Coupon Code" to create a 6-8 digit alphanumeric code
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               The generated code will be logged to the browser console
//             </Typography>
//             <Typography component="li" variant="body2" sx={{ mb: 1 }}>
//               Use the copy button to copy coupon codes to clipboard
//             </Typography>
//             <Typography component="li" variant="body2">
//               All generated coupons are saved in the history section
//             </Typography>
//           </Box>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// }

// export default CustomerLoyalty;
