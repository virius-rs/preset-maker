// src/components/PresetEditor/PresetEditor.tsx

import React, { useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { useSnackbar } from "notistack"; 

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SaveIcon from "@mui/icons-material/Save";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"; 

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  toggleSlotSelection,
  clearSelectedSlots,
  selectPreset,
  setEquipmentSlot,
  setInventorySlot,
  swapInventorySlots,
  updateSlotIndex,
  updateSlotType,
  updateSlotKey,
  setBreakdownEntry, 
} from "../../redux/store/reducers/preset-reducer";

import { addToQueue, selectRecentItems } from "../../redux/store/reducers/recent-item-reducer";
import { type Item as ItemData } from "../../schemas/item-data";
import { SlotType } from "../../schemas/slot-type";
import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";
import { Equipment, Inventory } from "../SlotSection/SlotSection";
import { FamiliarSection } from "../FamiliarSection/FamiliarSection";
import { RelicSection } from "../RelicSection/RelicSection";

import { usePresetSave } from "../Menu/usePresetSave";
import { useRecentPresets } from "../Menu/useRecentPresets";
import { usePresetExport, type ExportScope } from "../../hooks/usePresetExport"; 
import { usePresetJsonExport } from '../Menu/usePresetJsonExport'; 
import { usePresetJsonImport } from '../Menu/usePresetJsonImport'; 

import "./PresetEditor.css";
import genericBackground from "../../assets/bg_large.png";
import mobilePresetMapBackground from "../../assets/presetmap_mobile.png";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import { NoteDialog } from "../NoteDialog/NoteDialog"; 

const SEGMENTS: ExportScope[] = ['combined', 'inventory-equipped', 'buffs'];
const getScopeText = (scope: ExportScope) => {
    switch (scope) {
        case 'combined': return 'Combined';
        case 'inventory-equipped': return 'Inventory & Equipped'; 
        case 'buffs': return 'Relics & Familiar';
        default: return 'Combined'; 
    }
}

export const PresetEditor = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const maps = useEmojiMap();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const preset = useAppSelector(selectPreset);
  const { presetName, breakdown } = preset; 
  
  const [copyAnchor, setCopyAnchor] = useState<null | HTMLElement>(null);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  const [noteDialog, setNoteDialog] = useState<{ 
      open: boolean, 
      slotGroup: string, 
      index: number, 
      initialNote: string, 
      itemName: string,
      imageUrl?: string 
  }>({
    open: false,
    slotGroup: 'inventory',
    index: 0,
    initialNote: '',
    itemName: '',
    imageUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummySetRecentSelection = useCallback(() => {}, []); 

  const { exportJson } = usePresetJsonExport(preset);
  const { importJson } = usePresetJsonImport({
    markClean: () => {}, 
    setRecentSelection: dummySetRecentSelection,
    setMode: () => {} 
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ""; 
    if (file) importJson(file);
    enqueueSnackbar("Preset imported from JSON.", { variant: "info" });
  }, [importJson, enqueueSnackbar]);


  const { setRecentList } = useRecentPresets();
  const { generateUrl, isSaving } = usePresetSave({
    preset,
    presetName,
    markClean: () => {}, 
    setRecentList,
  });

  const { copyImage, downloadImage, clipboardSupported } = usePresetExport(presetName);

  const handleCopyAction = useCallback(async (scope: ExportScope) => {
    setCopyAnchor(null);
    await copyImage(scope);
    enqueueSnackbar(`${getScopeText(scope)} copied to clipboard!`, { variant: "success" });
  }, [copyImage, enqueueSnackbar]);

  const handleDownloadAction = useCallback(async (scope: ExportScope) => {
    setDownloadAnchor(null);
    await downloadImage(scope);
    enqueueSnackbar(`${getScopeText(scope)} downloaded!`, { variant: "success" });
  }, [downloadImage, enqueueSnackbar]);

  const handleExportJsonAction = useCallback(() => {
    setDownloadAnchor(null);
    exportJson();
  }, [exportJson]);
  
  const handleGenerateUrl = useCallback(async () => {
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
  }, [generateUrl, navigate, enqueueSnackbar]);
  
  const { inventorySlots, equipmentSlots, slotType, selectedSlots, slotIndex } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSlotSelection = useCallback((_event: React.MouseEvent<HTMLAreaElement>, index: number, slotGroup: string) => {
      const key = `${slotGroup}:${index}`;
      if (slotGroup !== "inventory") {
        dispatch(clearSelectedSlots());
        dispatch(toggleSlotSelection(key));
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        dispatch(updateSlotType(SlotType.Equipment));
        return;
      }
      const hasNonInventory = selectedSlots.some(k => !k.startsWith("inventory"));
      if (hasNonInventory) dispatch(clearSelectedSlots());

      dispatch(updateSlotType(SlotType.Inventory));
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
    }, [dispatch, selectedSlots]);

  const handleSlotOpen = useCallback((_event: React.MouseEvent<HTMLAreaElement>, index: number, slotGroup: string) => {
      const key = `${slotGroup}:${index}`;
      const isInSelection = selectedSlots.includes(key);
      const inInventoryMulti = selectedSlots.length > 1 && selectedSlots.every(k => k.startsWith("inventory"));

      dispatch(updateSlotType(slotGroup === "inventory" ? SlotType.Inventory : SlotType.Equipment));

      if (isInSelection && inInventoryMulti) {
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        setDialogOpen(true);
        return;
      }
      dispatch(clearSelectedSlots());
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
      setDialogOpen(true);
    }, [dispatch, selectedSlots]);

  const handleSlotContextMenu = useCallback((_e: React.MouseEvent, index: number, slotGroup: string) => {
    const entry = breakdown.find(b => b.slotType === slotGroup && b.slotIndex === index);
    
    let itemId = "";
    if (slotGroup === "inventory") itemId = inventorySlots[index]?.id;
    else if (slotGroup === "equipment") itemId = equipmentSlots[index]?.id;
    
    const itemData = itemId && maps ? maps.get(itemId) : null;
    const imageUrl = itemId && maps ? maps.getUrl(itemId) : undefined;
    
    if (itemData) {
        setNoteDialog({
            open: true,
            slotGroup,
            index,
            initialNote: entry?.description ?? "",
            itemName: itemData.name,
            imageUrl: imageUrl ?? undefined 
        });
    }
  }, [breakdown, inventorySlots, equipmentSlots, maps]);

  const handleSaveNote = useCallback((note: string) => {
    dispatch(setBreakdownEntry({
        slotType: noteDialog.slotGroup as "inventory" | "equipment",
        slotIndex: noteDialog.index,
        description: note
    }));
  }, [dispatch, noteDialog]);


  const presetToUI: Record<number, number> = { 1: 0, 12: 1, 10: 2, 4: 3, 2: 4, 5: 5, 3: 6, 6: 7, 7: 8, 11: 9, 9: 10, 8: 11, 13: 12 };

  const handleDragAndDrop = useCallback((dragItem: { fromGroup: string; index: number; id: string }, targetGroup: string, targetIndex: number) => {
      const from = dragItem.fromGroup;
      if (!dragItem.id) return;
      const entry = maps?.get(dragItem.id);
      const presetSlot = entry?.preset_slot ?? 0;
      const uiSlot = presetToUI[presetSlot] ?? -1;

      const getNote = (group: string, idx: number) => 
          breakdown.find(b => b.slotType === group && b.slotIndex === idx)?.description || "";
      
      const sourceNote = getNote(from, dragItem.index);
      const targetNote = getNote(targetGroup, targetIndex);

      const updateNote = (group: string, idx: number, text: string) => {
          dispatch(setBreakdownEntry({ slotType: group as any, slotIndex: idx, description: text }));
      };

      if (from === "inventory" && targetGroup === "equipment") {
        if (uiSlot !== targetIndex) return;
        
        dispatch(setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setInventorySlot({ index: dragItem.index, value: { id: "" } }));
        
        updateNote("equipment", targetIndex, sourceNote);
        updateNote("inventory", dragItem.index, "");

      } else if (from === "equipment" && targetGroup === "inventory") {
        dispatch(setInventorySlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setEquipmentSlot({ index: dragItem.index, value: { id: "" } }));

        updateNote("inventory", targetIndex, sourceNote);
        updateNote("equipment", dragItem.index, "");

      } else if (from === "equipment" && targetGroup === "equipment") {
        if (uiSlot !== targetIndex) return;
        
        dispatch(setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setEquipmentSlot({ index: dragItem.index, value: { id: "" } }));

        updateNote("equipment", targetIndex, sourceNote);
        updateNote("equipment", dragItem.index, "");

      } else if (from === "inventory" && targetGroup === "inventory") {

        dispatch(swapInventorySlots({ sourceIndex: dragItem.index, targetIndex }));
        
        updateNote("inventory", targetIndex, sourceNote);
        updateNote("inventory", dragItem.index, targetNote);
      }
    }, [dispatch, maps, presetToUI, breakdown]);

  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(clearSelectedSlots());
  }, [dispatch]);

  const changeSlot = useCallback((indices: string[], item: ItemData) => {
      indices.forEach((key) => {
        const [group, raw] = key.split(":");
        const index = Number(raw);
        if (index < 0) return;
        if (group === "inventory") dispatch(setInventorySlot({ index, value: item }));
        else dispatch(setEquipmentSlot({ index, value: item }));

        dispatch(setBreakdownEntry({ 
            slotType: group as "inventory" | "equipment", 
            slotIndex: index, 
            description: "" 
        }));
      });
      dispatch(addToQueue(item));
      dispatch(clearSelectedSlots());
    }, [dispatch]);

  // STYLING CONSTANTS
  const ACTION_BUTTON_SX = {
    whiteSpace: 'nowrap', 
    color: '#e2e8f0', 
    bgcolor: '#1e1e1e', 
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': { 
        bgcolor: '#2d2d2d', 
        color: '#3B82F6' 
    }
  };

  const GENERATE_BUTTON_SX = {
    whiteSpace: 'nowrap', 
    minWidth: 'auto', 
    px: 1.5, 
    bgcolor: '#22C55E', 
    color: '#ffffff', 
    fontWeight: 600, 
    textTransform: 'none',
    borderRadius: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': { 
        bgcolor: '#16A34A', 
    } 
  };

  const DIVIDER_SX = {
    bgcolor: 'rgba(255,255,255,0.1)', 
    height: 24, 
    alignSelf: 'center', 
    mx: 0.5
  };

  return (
    <>
      <Card 
        elevation={0}
        sx={{
          height: 520, 
          bgcolor: '#121212', 
          color: '#e2e8f0', 
          width: 550, 
          borderRadius: 2, 
          marginBottom: 0, 
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)', 
        }}
      >
        <CardContent sx={{ padding: '20px !important', display: 'flex', flexDirection: 'column' }}>
          
          <div className="preset-editor__export-container" style={{ width: '510px', margin: '0 auto', flexGrow: 0 }}>
            <div 
              className="preset-map-container" 
              style={{ 
                width: '510px', 
                height: '163px', 
                backgroundImage: `url(${genericBackground})`,
                position: 'relative', 
                marginBottom: '10px'
              }}
            >
                <Inventory 
                    slots={inventorySlots} 
                    handleClickOpen={handleSlotOpen} 
                    handleShiftClick={handleSlotSelection} 
                    handleDragAndDrop={handleDragAndDrop} 
                    handleContextMenu={handleSlotContextMenu}
                />
                <Equipment 
                    slots={equipmentSlots} 
                    handleClickOpen={handleSlotOpen} 
                    handleShiftClick={handleSlotSelection} 
                    handleDragAndDrop={handleDragAndDrop} 
                    handleContextMenu={handleSlotContextMenu}
                />
                
                <img 
                    width={510} 
                    height={163} 
                    src="https://img.pvme.io/images/O7VznNO.png" 
                    alt="preset" 
                    className="desktop-only" 
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                />

                <div className="preset-image-container mobile-only">
                    <img 
                        width={183} 
                        height={512} 
                        src={mobilePresetMapBackground} 
                        alt="preset mobile" 
                    />
                </div>
            </div>

            <div className="relics-familiar-container" style={{ width: '510px' }}>
              <RelicSection />
              <FamiliarSection />
            </div>
          </div>

          <Stack 
            direction="row" 
            justifyContent="center" 
            alignItems="center" 
            spacing={1.5} 
            sx={{ 
                mt: 3, 
                pt: 2, 
                borderTop: '1px solid rgba(255,255,255,0.1)' 
            }}
          >
              <Button 
                onClick={() => fileInputRef.current?.click()}
                startIcon={<FileUploadIcon fontSize="small" />}
                variant="contained" 
                size="small" 
                sx={ACTION_BUTTON_SX}
              >
                Import
              </Button>
              <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />

              <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />

              <Button onClick={(e) => setCopyAnchor(e.currentTarget)} disabled={!clipboardSupported} endIcon={<ArrowDropDownIcon />} variant="contained" size="small" sx={ACTION_BUTTON_SX} startIcon={<ContentCopyIcon fontSize="small" />}>Copy</Button>
              <Menu anchorEl={copyAnchor} open={Boolean(copyAnchor)} onClose={() => setCopyAnchor(null)} disableScrollLock>
                <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>IMAGE</Typography>
                {SEGMENTS.map((scope) => (<MenuItem key={scope} onClick={() => handleCopyAction(scope)} disabled={!clipboardSupported}>{getScopeText(scope)}</MenuItem>))}
              </Menu>
              
              <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />

              <Button onClick={(e) => setDownloadAnchor(e.currentTarget)} endIcon={<ArrowDropDownIcon />} variant="contained" size="small" sx={ACTION_BUTTON_SX} startIcon={<FileDownloadIcon fontSize="small" />}>Download</Button>
              <Menu anchorEl={downloadAnchor} open={Boolean(downloadAnchor)} onClose={() => setDownloadAnchor(null)} disableScrollLock>
                <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>IMAGE</Typography>
                {SEGMENTS.map((scope) => (<MenuItem key={scope} onClick={() => handleDownloadAction(scope)}>{getScopeText(scope)}</MenuItem>))}
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 'bold', display: 'block' }}>DATA</Typography>
                <MenuItem onClick={handleExportJsonAction}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <SaveIcon fontSize="small" />
                        <Typography>Export JSON</Typography>
                    </Stack>
                </MenuItem>
              </Menu>

              <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />

              <Tooltip title="Save to cloud" arrow>
                  <span>
                      <Button 
                        onClick={handleGenerateUrl} 
                        disabled={isSaving} 
                        variant="contained" 
                        sx={GENERATE_BUTTON_SX} 
                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />} 
                        size="small"
                      >
                        {!isSaving && "Generate URL"}
                      </Button>
                  </span>
              </Tooltip>
          </Stack>

        </CardContent>
      </Card>

      <EmojiSelectDialog open={dialogOpen} onClose={onDialogClose} onSelect={(ids) => changeSlot(selectedSlots as string[], { id: ids[0] })} slotType={slotType} slotIndex={slotIndex} slotKey={selectedSlots[0] ?? ""} selectedIndices={selectedSlots} recentlySelected={recentItems} />
      
      <NoteDialog 
        open={noteDialog.open} 
        onClose={() => setNoteDialog(prev => ({ ...prev, open: false }))} 
        title={noteDialog.itemName}
        initialNote={noteDialog.initialNote}
        imageUrl={noteDialog.imageUrl} 
        onSave={handleSaveNote}
      />
    </>
  );
};