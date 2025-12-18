// src/components/SlotSection/SlotSection.tsx

import React, { useCallback, useMemo } from "react";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";
import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";

import {
  equipmentCoords,
  equipmentCoordsMobile,
  inventoryCoords,
  inventoryCoordsMobile,
} from "../../data/coordinates";

import { type Coord } from "../../schemas/coord";
import { type Item as ItemData } from "../../schemas/item-data";
import { isMobile } from "../../utility/window-utils";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

import "./SlotSection.css";

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#000000',
    color: '#e2e8f0',
    maxWidth: 300,
    border: '1px solid #333',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    padding: '12px',
    fontSize: '16px',
    lineHeight: '2.2', 
  },
}));

interface SlotProps {
  slots: ItemData[];
  handleClickOpen: (e: any, index: number, slotGroup: string) => void;
  handleDragAndDrop?: (
    dragItem: { fromGroup: string; index: number; id: string },
    targetGroup: string,
    targetIndex: number
  ) => void;
  handleShiftClick?: (e: any, index: number, slotGroup: string) => void;
  handleContextMenu?: (e: React.MouseEvent, index: number, slotGroup: string) => void;
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[];
  slotGroup: string;
}

interface SingleSlotProps extends SlotProps {
  index: number;
  coord: Coord;
  slotGroup: string;
}

const SingleSlot = ({
  index,
  coord,
  slotGroup,
  slots,
  handleClickOpen,
  handleShiftClick,
  handleDragAndDrop,
  handleContextMenu,
}: SingleSlotProps): JSX.Element | null => {
  const slot = slots[index];
  if (!slot) return null;

  const maps = useEmojiMap();
  const { selectedSlots, breakdown } = useAppSelector(selectPreset);

  const entry = slot.id && maps ? maps.get(slot.id) : undefined;
  const emojiUrl = entry && maps ? maps.getUrl(entry.id) ?? "" : "";

  const style = useMemo(() => ({
    left: coord.x1,
    top: coord.y1,
    width: coord.x2 - coord.x1,
    height: coord.y2 - coord.y1,
    position: 'absolute' as const,
  }), [coord]);

  const breakdownEntry = breakdown.find(
    (b) => b.slotType === slotGroup && b.slotIndex === index
  );
  
  const rawNote = breakdownEntry?.description || "";
  
  const parsedNote = useMemo(() => {
    if (!rawNote || !maps) return rawNote;
    
    return rawNote.replace(/:([a-zA-Z0-9_]+):/g, (match: string, name: string) => {
      const cleanName = name.replace(/_/g, ' ').toLowerCase();
      
      let foundId = "";
      if (maps.resolve) { foundId = maps.resolve(cleanName); }
      
      if (foundId) {
         const url = maps.getUrl(foundId);
         if (url) {
             return `<img 
                src="${url}" 
                alt="${name}" 
                class="disc-emoji" 
                style="width: calc(34px * 0.8); height: calc(34px * 0.8); vertical-align: middle; margin: 0 2px; transform: translateY(-2px);"
             />`;
         }
      }
      
      return match; 
    });
  }, [rawNote, maps]);

  const slotKey = `${slotGroup}:${index}`;
  const slotIsSelected = selectedSlots.includes(slotKey);

  const getClassName = () =>
    `${slotGroup}-icon-container ${
      slotIsSelected ? "selected" : ""
    }`;

  const onSlotSelect = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey && handleShiftClick) {
        handleShiftClick(e, index, slotGroup);
      } else {
        handleClickOpen(e, index, slotGroup);
      }
    },
    [handleShiftClick, handleClickOpen, index, slotGroup]
  );

  const onNoteClick = useCallback(
    (e: React.MouseEvent) => {
      if (handleContextMenu) {
        e.stopPropagation(); 
        handleContextMenu(e, index, slotGroup);
      }
    },
    [handleContextMenu, index, slotGroup]
  );

  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: "SLOT_ITEM",
      item: { fromGroup: slotGroup, index, id: slot.id },
      collect: (monitor) => ({ opacity: monitor.isDragging() ? 0.5 : 1 }),
    }),
    [slotGroup, index, slot.id]
  );

  const [, dropRef] = useDrop(
    () => ({
      accept: "SLOT_ITEM",
      drop: (dragItem: { fromGroup: string; index: number; id: string }) => {
        if (handleDragAndDrop) {
          handleDragAndDrop(dragItem, slotGroup, index);
        }
      },
    }),
    [handleDragAndDrop, slotGroup, index]
  );

  const tooltipContent = entry ? (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            {emojiUrl && <img src={emojiUrl} alt="" style={{ width: 32, height: 32 }} />}
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                    {entry.name}
                </Typography>
                <Link 
                    href={`https://runescape.wiki/w/${entry.name.replace(/ /g, '_')}`} 
                    target="_blank" 
                    rel="noopener"
                    sx={{ fontSize: '0.75rem', color: '#3B82F6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    Open on Wiki
                </Link>
            </Box>
        </Box>
        
        {rawNote ? (
            <Box 
                onClick={onNoteClick}
                sx={{ 
                    cursor: 'pointer', 
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } 
                }}
            >
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    NOTE <span>(Edit)</span>
                </Typography>
                <div 
                    style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: parsedNote }} 
                />
            </Box>
        ) : (
            <Box 
                onClick={onNoteClick}
                sx={{ 
                    mt: 1, 
                    cursor: 'pointer',
                    '&:hover .add-note-text': { textDecoration: 'underline' } 
                }}
            >
               <Typography 
                 variant="caption" 
                 className="add-note-text"
                 sx={{ display: 'block', color: '#3B82F6', fontWeight: 'bold' }}
               >
                   + Click to add note
               </Typography>
            </Box>
        )}
    </Box>
  ) : null;

  return (
    <>
      {emojiUrl && <DragPreviewImage connect={dragPreview} src={emojiUrl} />}

      <div ref={dropRef} style={style}>
        <div ref={dragRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
          
          <HtmlTooltip 
            title={tooltipContent} 
            arrow 
            placement="bottom" 
            leaveDelay={200}
          >
            <div
                className="slot-hitbox"
                style={{ 
                    position: "absolute",
                    width: "100%", 
                    height: "100%", 
                    zIndex: 2, 
                    cursor: "pointer",
                    opacity: opacity 
                }}
                onClick={onSlotSelect}
            />
          </HtmlTooltip>

          <div
            className={getClassName()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: "none", 
              zIndex: 1
            }}
          >
            {emojiUrl && (
              <img
                className={`${slotGroup}-icon`}
                src={emojiUrl}
                alt={entry?.name ?? ""}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
};

const SlotSection = ({
  slots,
  coords,
  slotGroup,
  handleClickOpen,
  handleShiftClick,
  handleDragAndDrop,
  handleContextMenu,
}: SlotSectionProps): JSX.Element => {
  return (
    <>
      {coords.map((coord, index) => (
        <SingleSlot
          key={index}
          slots={slots}
          coord={coord}
          index={index}
          slotGroup={slotGroup}
          handleClickOpen={handleClickOpen}
          handleShiftClick={handleShiftClick}
          handleDragAndDrop={handleDragAndDrop}
          handleContextMenu={handleContextMenu}
        />
      ))}
    </>
  );
};

export const Inventory = (props: SlotProps) => {
  const coords = isMobile() ? inventoryCoordsMobile : inventoryCoords;
  return <SlotSection {...props} coords={coords} slotGroup="inventory" />;
};

export const Equipment = (props: SlotProps) => {
  const coords = isMobile() ? equipmentCoordsMobile : equipmentCoords;
  return <SlotSection {...props} coords={coords} slotGroup="equipment" />;
};