import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Loyalty as LoyaltyIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

function CustomerLoyalty() {
  const [couponCode, setCouponCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [generatedCoupons, setGeneratedCoupons] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');

  // Generate random alphanumeric coupon code (6-8 digits)
  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 3) + 6; // 6-8 characters
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  };

  // Set default expiry date to 7 days from now
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // Handle coupon generation
  const handleGenerateCoupon = () => {
    const newCode = generateCouponCode();
    const expiry = expiryDate || getDefaultExpiryDate();
    
    setCouponCode(newCode);
    
    // Console log the generated coupon code
    console.log('Generated Coupon Code:', newCode);
    console.log('Expiry Date:', expiry);
    
    // Add to generated coupons list
    const newCoupon = {
      id: Date.now(),
      code: newCode,
      expiryDate: expiry,
      generatedAt: new Date().toLocaleString()
    };
    
    setGeneratedCoupons(prev => [newCoupon, ...prev]);
    setAlertMessage(`Coupon "${newCode}" generated successfully!`);
    
    // Clear alert after 3 seconds
    setTimeout(() => setAlertMessage(''), 3000);
  };

  // Copy coupon code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setAlertMessage(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setAlertMessage(''), 2000);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LoyaltyIcon color="primary" />
        Customer Loyalty Program
      </Typography>
      
      {alertMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Coupon Generation Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Generate Coupon
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 2 }}
                  helperText="Leave empty for default 7 days from today"
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleGenerateCoupon}
                  startIcon={<RefreshIcon />}
                  sx={{ mb: 2 }}
                >
                  Generate Coupon Code
                </Button>
              </Box>

              {couponCode && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'primary.light', 
                    color: 'primary.contrastText',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Generated Coupon Code
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="h4" component="span" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {couponCode}
                    </Typography>
                    <Tooltip title="Copy Code">
                      <IconButton 
                        onClick={() => handleCopyCode(couponCode)}
                        sx={{ color: 'inherit' }}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Expires: {formatDate(expiryDate || getDefaultExpiryDate())}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Coupons History */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Generated Coupons
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {generatedCoupons.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LoyaltyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No coupons generated yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Generate Coupon Code" to create your first coupon
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {generatedCoupons.map((coupon) => (
                    <Paper 
                      key={coupon.id} 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {coupon.code}
                        </Typography>
                        <Tooltip title="Copy Code">
                          <IconButton 
                            size="small"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip 
                          icon={<CalendarIcon />}
                          label={`Expires: ${formatDate(coupon.expiryDate)}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        Generated: {coupon.generatedAt}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Card elevation={1} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            How to Use
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Set an expiry date (optional) - defaults to 7 days from today
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Click "Generate Coupon Code" to create a 6-8 digit alphanumeric code
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              The generated code will be logged to the browser console
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Use the copy button to copy coupon codes to clipboard
            </Typography>
            <Typography component="li" variant="body2">
              All generated coupons are saved in the history section
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CustomerLoyalty;
