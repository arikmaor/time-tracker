import React from 'react'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ActivityIndicator = () => (
  <Box width='100%' height='100%' display='flex' justifyContent='center' mt={2}>
    <CircularProgress color='primary' />
  </Box>
)

export default ActivityIndicator
