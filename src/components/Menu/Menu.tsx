// src/components/Menu/Menu.tsx

import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  Paper,
  Grid,
  Stack,
  Button,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Chip,
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  Add as AddIcon,
  ArrowDropDown,
  Warning as WarningIcon,
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Link as LinkIcon,
} from "@mui/icons-material";

import { RecentPresetDropdown } from "./RecentPresetDropdown";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

import { useStorageMode } from "../../storage/StorageModeContext";
import { usePresetDirtyState } from "./usePresetDirtyState";
import { usePresetSave } from "./usePresetSave";
import { usePresetLoader } from "./usePresetLoader";
import { useRecentPresets } from "./useRecentPresets";

import { usePresetExport } from "../../hooks/usePresetExport";
import { usePresetJsonExport } from "./usePresetJsonExport";
import { usePresetJsonImport } from "./usePresetJsonImport";

import "./Menu.css";

/* ---------------------------------------------
   Status Chip
--------------------------------------------- */

const StatusChip = ({ isDirty }: { isDirty: boolean | null }) => {
  if (isDirty === null) return null;
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? "Unsaved Changes" : "Saved"}
      color={isDirty ? "warning" : "success"}
      variant="outlined"
      size="small"
    />
  );
};

/* ---------------------------------------------
   Component
--------------------------------------------- */

export const PresetMenu = (): JSX.Element => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset);
  const { presetName } = preset;

  const { setMode } = useStorageMode();

  const { recentList, refresh, setRecentList } = useRecentPresets();
  const { isDirty, markClean } = usePresetDirtyState(preset);

  const { generateUrl, isSaving } = usePresetSave({
    preset,
    presetName,
    markClean,
    setRecentList,
  });

  const [recentSelection, setRecentSelection] = useState("");
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);

  const { copyImage, downloadImage, clipboardSupported } =
    usePresetExport(presetName);

  const { exportJson } = usePresetJsonExport(preset);

  const { importJson } = usePresetJsonImport({
    markClean,
    setRecentSelection,
    setMode,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loadRecent } = usePresetLoader({
    id,
    markClean,
    setRecentSelection,
  });

  /* ---------------------------------------------
     Handlers
  --------------------------------------------- */

  const handleGenerateUrl = async () => {
    const newId = await generateUrl();
    if (newId) {
      navigate(`/${newId}`, { replace: true });
      
      const shareUrl = `${window.location.origin}${window.location.pathname}#/${newId}`;

      try {
        await navigator.clipboard.writeText(shareUrl);
        enqueueSnackbar("Preset saved! Link copied to clipboard.", { variant: "success" });
      } catch (e) {
        enqueueSnackbar("Preset saved! URL updated.", { variant: "success" });
      }
    }
  };

  /* ---------------------------------------------
     Render
  --------------------------------------------- */

  return (
    <Paper className="preset-menu__paper">
      <Grid container justifyContent="space-between" sx={{ mt: 2, p: 2 }}>
        {/* LEFT SIDE: New & Recent */}
        <Grid item>
          <Stack direction="row" spacing={3}>
            <Button 
              startIcon={<AddIcon />} 
              variant="contained"
              onClick={() => {
                 navigate('/');
                 navigate(0);
              }}
            >
              New Preset
            </Button>
            <RecentPresetDropdown
              selected={recentSelection}
              onSelect={(p) => {
                if (!p.presetId) return;
                loadRecent(p);
              }}
              items={recentList}
              onRemoved={refresh}
            />
          </Stack>
        </Grid>

        {/* RIGHT SIDE: Menu & Action */}
        <Grid item>
          <Stack direction="row" spacing={3} alignItems="center">
            
            {/* Dropdown Menu */}
            <Button
              onClick={(e) => setAnchorExport(e.currentTarget)}
              endIcon={<ArrowDropDown />}
            >
              Menu
            </Button>

            <Menu
              anchorEl={anchorExport}
              open={Boolean(anchorExport)}
              onClose={() => setAnchorExport(null)}
              disableScrollLock
            >
              {/* Image Options */}
              <MenuItem
                disabled={!clipboardSupported}
                onClick={async () => {
                  await copyImage();
                  enqueueSnackbar("Image copied", { variant: "success" });
                  setAnchorExport(null);
                }}
              >
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Copy Image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  await downloadImage();
                  enqueueSnackbar("Image downloaded", { variant: "success" });
                  setAnchorExport(null);
                }}
              >
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Download Image" />
              </MenuItem>

              <Divider />

              {/* JSON Options */}
              <MenuItem onClick={() => { exportJson(); setAnchorExport(null); }}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export JSON" />
              </MenuItem>

              <MenuItem onClick={() => { 
                fileInputRef.current?.click(); 
                setAnchorExport(null); 
              }}>
                <ListItemIcon>
                  <FileUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Import JSON" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) importJson(file);
                  }}
                />
              </MenuItem>
            </Menu>

            {/* MAIN ACTION: Generate URL */}
            <Tooltip
              title="Save this preset to the cloud and copy the link."
              arrow
            >
              <span>
                <Button
                  onClick={handleGenerateUrl}
                  disabled={isSaving}
                  startIcon={isSaving ? undefined : <LinkIcon />}
                  variant="contained"
                  color="success"
                  sx={{ minWidth: '160px' }}
                >
                  {isSaving ? <CircularProgress size={20} color="inherit" /> : "Generate URL"}
                </Button>
              </span>
            </Tooltip>

            {/* Status Indicator */}
            <StatusChip isDirty={isDirty} />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PresetMenu;