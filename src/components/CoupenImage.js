import React from 'react';
import { Box, Typography } from '@mui/material';

const CouponImage = React.forwardRef(({ coupon }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: 'linear-gradient(145deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
        borderRadius: '20px',
        p: 3,
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Decorative background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />

      {/* Header */}
      <Box sx={{ zIndex: 1 }}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            opacity: 0.7,
            letterSpacing: '1px',
          }}
        >
          COUPON CARD
        </Typography>
        <Typography
          sx={{
            fontSize: '28px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            mt: 0.5,
          }}
        >
          {coupon.discountValue}
          {coupon.discountType === 'percentage' ? '%' : ' ₹'} OFF
        </Typography>
      </Box>

      {/* Coupon code section */}
      <Box
        sx={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(6px)',
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '2px',
            fontFamily: 'monospace',
          }}
        >
          {coupon.code}
        </Typography>
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          APPLY NOW
        </Typography>
      </Box>

      {/* Footer details */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 1,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}
          >
            Valid Until
          </Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
            {new Date(coupon.expiryDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Typography>
        </Box>

        {coupon.minOrderValue > 0 && (
          <Box>
            <Typography
              sx={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}
            >
              Min Order
            </Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
              ₹{coupon.minOrderValue}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

CouponImage.displayName = 'CouponImage';
export default CouponImage;
