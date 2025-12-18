// src/components/PresetDetails/PresetDetails.tsx

import React, { useCallback, useRef } from "react";
import { Card, CardContent, Typography, Stack } from "@mui/material";
import EditNoteIcon from '@mui/icons-material/EditNote';

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setPresetNotes, setPresetName } from "../../redux/store/reducers/preset-reducer";
import { RichTextEmojiInput } from "../RichText/RichTextEmojiInput"; 
import "./PresetDetails.css";

const getTextWidth = (text: string, font: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);
  const nameFieldRef = useRef<HTMLDivElement | null>(null);

  const checkNameOverflow = (currentText: string, newText: string): boolean => {
    if (!nameFieldRef.current) return false;
    const el = nameFieldRef.current;

    const style = window.getComputedStyle(el);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const availableWidth = el.clientWidth - padding;
    
    const textWidth = getTextWidth(newText, font);
    return textWidth > (availableWidth - 15);
  };

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
      'Home', 'End', 'Tab', 'Enter', 'Escape'
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }

    if (nameFieldRef.current) {
        const currentText = nameFieldRef.current.innerText;
        const potentialText = currentText + e.key;
        
        if (checkNameOverflow(currentText, potentialText)) {
            e.preventDefault();
        }
    }
  }, []);

  const handleNamePaste = useCallback((e: React.ClipboardEvent) => {
    if (!nameFieldRef.current) return;
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const currentText = nameFieldRef.current.innerText;
    const potentialText = currentText + pastedText;

    if (checkNameOverflow(currentText, potentialText)) {
        e.preventDefault();
    }
  }, []);

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: 520, 
        width: 550,  
        bgcolor: '#121212', 
        color: '#e2e8f0', 
        borderRadius: 2, 
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)', 
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ 
        padding: '24px !important', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        boxSizing: 'border-box' 
      }}>
        
        {/* HEADER */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexShrink: 0 }}>
          <EditNoteIcon fontSize="small" color="action" />
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#E2E8F0' }}>
            Preset Details
          </Typography>
        </Stack>

        {/* NAME FIELD */}
        <div style={{ marginBottom: '24px', flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Name
          </Typography>
          
          <RichTextEmojiInput 
             value={preset.presetName}
             onChange={(val) => dispatch(setPresetName(val))}
             placeholder="Give your preset a name..."
             allowMultiline={false}
             inputRef={nameFieldRef}
             onKeyDown={handleNameKeyDown}
             onPaste={handleNamePaste}
             className="name-field-editable"
             style={{ 
                 height: '46px', 
                 overflow: 'hidden', 
                 whiteSpace: 'nowrap'
             }}
          />
        </div>

        {/* NOTES FIELD */}
        <div style={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0
        }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes
          </Typography>
          
          <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
             <RichTextEmojiInput 
                value={preset.presetNotes}
                onChange={(val) => dispatch(setPresetNotes(val))}
                placeholder="Add setup notes, instructions, or boss info..."
                allowMultiline={true}
                style={{ height: '100%', overflowY: 'auto' }}
             />
          </div>
        </div>

      </CardContent>
    </Card>
  );
};