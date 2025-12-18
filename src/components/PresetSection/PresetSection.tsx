// src/components/PresetSection/PresetSection.tsx

import React from 'react';
import { Container, Grid } from '@mui/material';

import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';

export const PresetSection = (): JSX.Element => {
  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Grid 
          container 
          spacing={3} 
          direction="row" 
          justifyContent="center" 
          alignItems="flex-start"
        >
          <Grid item>
            <PresetEditor />
          </Grid>

          <Grid item>
            <PresetDetails />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};