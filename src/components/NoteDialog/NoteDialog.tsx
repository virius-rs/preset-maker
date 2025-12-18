// src/components/NoteDialog/NoteDialog.tsx

import React, { useEffect, useState, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { RichTextEmojiInput } from "../RichText/RichTextEmojiInput";

export interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialNote: string;
  imageUrl?: string;
  onSave: (note: string) => void;
}

export const NoteDialog = ({
  open,
  onClose,
  title,
  initialNote,
  imageUrl,
  onSave,
}: NoteDialogProps): JSX.Element => {
  const [note, setNote] = useState(initialNote);
  
  const prevOpenRef = useRef(open);

  if (open && !prevOpenRef.current) {
      if (note !== initialNote) {
          setNote(initialNote);
      }
  }

  useEffect(() => {
      prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (open) {
    }
  }, [initialNote, open]);

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "#0f0f0f",
          color: "#e2e8f0",
          backgroundImage: "none",
          border: "1px solid #333",
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", p: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
             Edit Note: <span style={{ color: '#3B82F6' }}>{title}</span>
          </Typography>
          
          {imageUrl && (
            <img 
                src={imageUrl} 
                alt="" 
                style={{ width: 32, height: 32 }} 
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pt: '24px !important', minHeight: '160px' }}>
        <RichTextEmojiInput
            key={title} 
            value={note}
            onChange={(val) => setNote(val)}
            placeholder="Enter note details... (Type : to search emojis)"
            autoFocus
            style={{ minHeight: '120px' }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
         <Typography variant="caption" sx={{ color: '#64748b' }}>
            Tip: You can use :emoji_name: syntax here.
         </Typography>

         <Box>
            <Button 
                onClick={onClose} 
                sx={{ color: '#94a3b8', mr: 1, textTransform: 'none' }}
            >
            Cancel
            </Button>
            <Button 
                onClick={handleSave} 
                variant="contained" 
                sx={{ 
                    bgcolor: '#3B82F6', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#2563eb' } 
                }}
            >
            Save Note
            </Button>
         </Box>
      </DialogActions>
    </Dialog>
  );
};