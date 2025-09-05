import React from 'react';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';

const CustomToolbar = () => {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton
        sx={{
          color: 'purple',
          fontWeight: 'bold',
        }}
      />
      <GridToolbarFilterButton
        sx={{
          color: 'purple',
          fontWeight: 'bold',
        }}
      />
      <GridToolbarDensitySelector
        sx={{
          color: 'purple',
          fontWeight: 'bold',
        }}
      />
      <GridToolbarExport
        sx={{
          color: 'purple',
          fontWeight: 'bold',
        }}
      />
    </GridToolbarContainer>
  );
};

export default CustomToolbar;
