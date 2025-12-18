import { useSnackbar } from 'notistack';
import React, { useCallback, useState, useRef } from 'react';
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

import AddIcon from '@mui/icons-material/Add'; 
import GitHubIcon from '@mui/icons-material/GitHub';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { RecentPresetDropdown } from '../Menu/RecentPresetDropdown';
import { useRecentPresets } from '../Menu/useRecentPresets';
import { usePresetLoader } from '../Menu/usePresetLoader';
import { useAppDispatch } from '../../redux/hooks'; 
import { resetToInitialState } from '../../redux/store/reducers/preset-reducer'; 

import './HeaderBar.css';
import { HelpDialog } from '../HelpDialog/HelpDialog';

export const HeaderBar = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); 
  
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);

  const [recentSelection, setRecentSelection] = useState("");
  const { recentList, refresh } = useRecentPresets();
  const { loadRecent } = usePresetLoader({
    markClean: () => {}, 
    setRecentSelection,
  });

  const onNewPresetClick = useCallback(() => {
    if (window.location.pathname !== '/' && window.location.hash !== '#/') {
        navigate('/');
    } else {
        dispatch(resetToInitialState()); 
    }
  }, [navigate, dispatch]); 

  const handleRecentSelect = useCallback((p: any) => {
    if (!p.presetId) return;
    loadRecent(p);
  }, [loadRecent]);

  const handleHelpOpen = useCallback(() => setHelpDialogOpen(true), []);
  const handleHelpClose = useCallback(() => setHelpDialogOpen(false), []);

  return (
    <>
      <Box className="header-bar">
        <AppBar 
          position="sticky" 
          className="header-bar__app-bar"
          elevation={0}
          sx={{ 
            bgcolor: '#121212', 
            borderBottom: '1px solid #1e1e1e'
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}> 
            <Toolbar 
              disableGutters 
              className="header-bar__toolbar"
              sx={{ 
                minHeight: { xs: 64, sm: 80 },
                px: { xs: 2, sm: 0 }
              }}
            >
              
              {/* TITLE */}
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h1"
                className="header-bar__title"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  flexShrink: 0,
                  textAlign: 'left',
                  mr: { xs: 1, sm: 3 },
                  ml: { xs: 0, sm: '209px' },
                  color: '#e2e8f0'
                }}
              >
                Preset Generator
              </Typography>

              {/* ACTION BUTTONS */}
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={2} 
                className="header-bar__action-buttons"
                sx={{ 
                    flexGrow: 1, 
                    justifyContent: 'flex-start',
                }}
              >
                <Button 
                  startIcon={<AddIcon />} 
                  variant="contained"
                  onClick={onNewPresetClick} 
                  sx={{ 
                    whiteSpace: 'nowrap',
                    bgcolor: '#3B82F6',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { bgcolor: '#2563EB' }
                  }}
                >
                  New Preset
                </Button>

                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <RecentPresetDropdown
                    selected={recentSelection}
                    onSelect={handleRecentSelect}
                    items={recentList}
                    onRemoved={refresh}
                  />
                </Box>
                
              </Stack>

              {/* RIGHT ICONS */}
              <Box 
                className="header-bar__actions" 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    flexShrink: 0, 
                    mr: { xs: 0, sm: '192px' } 
                }}
              >
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <RecentPresetDropdown
                      selected={recentSelection}
                      onSelect={handleRecentSelect}
                      items={recentList}
                      onRemoved={refresh}
                  />
                </Box>

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
                      opacity: 0.8,
                      color: '#e2e8f0'
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
                    sx={{ color: '#e2e8f0' }}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
      
      <HelpDialog open={helpDialogOpen} onClose={handleHelpClose} />
    </>
  );
};