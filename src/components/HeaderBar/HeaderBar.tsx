import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import HomeIcon from '@mui/icons-material/Home';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GitHubIcon from '@mui/icons-material/GitHub';

import './HeaderBar.css';
import { HelpDialog } from '../HelpDialog/HelpDialog';

export const HeaderBar = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  // kept for future notifications if needed
  // const { enqueueSnackbar } = useSnackbar(); 

  const onHomeClick = useCallback(() => {
    navigate('/');
    navigate(0);
  }, [navigate]);

  const handleHelpOpen = useCallback(() => setHelpDialogOpen(true), []);
  const handleHelpClose = useCallback(() => setHelpDialogOpen(false), []);

  return (
    <>
      <Box className="header-bar">
        <AppBar 
          position="sticky" 
          className="header-bar__app-bar"
          elevation={2}
        >
          <Container maxWidth="xl">
            <Toolbar 
              disableGutters 
              className="header-bar__toolbar"
              sx={{ 
                minHeight: { xs: 64, sm: 80 },
                px: { xs: 1, sm: 2 }
              }}
            >
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                className="header-bar__logo-section"
              >
                <Tooltip title="Go to Home">
                  <IconButton
                    onClick={onHomeClick}
                    size="large"
                    edge="start"
                    color="inherit"
                  >
                    <HomeIcon sx={{ fontSize: { xs: 30, sm: 40 } }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h1"
                className="header-bar__title"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  flexGrow: 1,
                  textAlign: { xs: 'center', md: 'left' },
                  ml: { xs: 0, md: 2 }
                }}
              >
                Preset Generator
              </Typography>

              <Box className="header-bar__actions" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                
                {/* Link to source/storage for transparency */}
                <Tooltip title="View Source & Storage">
                  <Button
                    color="inherit"
                    startIcon={<GitHubIcon />}
                    href="https://github.com/virius-rs/preset-maker"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      display: { xs: 'none', sm: 'flex' },
                      textTransform: 'none',
                      opacity: 0.8 
                    }}
                  >
                    GitHub
                  </Button>
                </Tooltip>

                <Tooltip title="Help">
                  <IconButton
                    onClick={handleHelpOpen}
                    className="header-bar__help-button"
                    color="inherit"
                    size={isMobile ? 'small' : 'medium'}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
      
      <HelpDialog
        open={helpDialogOpen}
        onClose={handleHelpClose}
      />
    </>
  );
};