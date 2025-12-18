// src/components/RelicSection/RelicSection.tsx
import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";

import relicIconPath from "../../assets/relic.png";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPrimaryRelic,
  setAlternativeRelic,
  setBreakdownEntry,
} from "../../redux/store/reducers/preset-reducer";

import { type Relic as RelicData } from "../../schemas/relic";
import { type IndexedSelection, PrimaryOrAlternative } from "../../schemas/util";

import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";
import { NoteDialog } from "../NoteDialog/NoteDialog";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import { isMobile } from "../../utility/window-utils";

import "./RelicSection.css";

const isMobileScreen = isMobile();

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
  },
}));

export const RelicSection = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { relics, breakdown } = useAppSelector(selectPreset);

  const maps = useEmojiMap();   

  const primary = relics.primaryRelics;
  const alt = relics.alternativeRelics.filter(r => r && r.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selection, setSelection] = useState<IndexedSelection>({
    primaryOrAlternative: PrimaryOrAlternative.None,
    index: -1,
  });

  const [noteDialog, setNoteDialog] = useState<{ 
      open: boolean, 
      slotType: string,
      index: number, 
      initialNote: string, 
      itemName: string,
      imageUrl?: string 
  }>({
    open: false,
    slotType: '',
    index: 0,
    initialNote: '',
    itemName: '',
    imageUrl: ''
  });

  const openDialog = useCallback(
    (type: PrimaryOrAlternative, index: number) => {
      if (isMobileScreen) return;
      setSelection({ primaryOrAlternative: type, index });
      setDialogOpen(true);
    },
    []
  );

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const onSelect = useCallback(
    (ids: string[]) => {
      const id = ids[0] ?? "";
      const relic: RelicData | null = id ? { id } : null;

      if (selection.primaryOrAlternative === PrimaryOrAlternative.Primary) {
        dispatch(setPrimaryRelic({ index: selection.index, value: relic }));
        dispatch(setBreakdownEntry({ slotType: "relic", slotIndex: selection.index, description: "" }));
      } else {
        dispatch(setAlternativeRelic({ index: selection.index, value: relic }));
        dispatch(setBreakdownEntry({ slotType: "relicAlternative", slotIndex: selection.index, description: "" }));
      }

      setSelection({ primaryOrAlternative: PrimaryOrAlternative.None, index: -1 });
      setDialogOpen(false);
    },
    [dispatch, selection]
  );

  const handleOpenNote = (e: React.MouseEvent, slotType: string, index: number, itemId: string) => {
    e.stopPropagation(); 
    const entry = breakdown.find(b => b.slotType === slotType && b.slotIndex === index);
    const itemData = maps?.get(itemId);
    const imageUrl = maps?.getUrl(itemId);

    if (itemData) {
        setNoteDialog({
            open: true,
            slotType,
            index,
            initialNote: entry?.description ?? "",
            itemName: itemData.name,
            imageUrl: imageUrl ?? undefined
        });
    }
  };

  const handleSaveNote = (note: string) => {
    dispatch(setBreakdownEntry({
        slotType: noteDialog.slotType as any,
        slotIndex: noteDialog.index,
        description: note
    }));
  };

  const safeGet = (id: string) => maps?.get(id);
  const safeUrl = (id: string) => maps?.getUrl(id) ?? "";

  const getTooltipContent = (itemId: string, slotType: string, index: number) => {
      const entry = safeGet(itemId);
      if (!entry) return null;
      
      const emojiUrl = safeUrl(itemId);
      const breakdownEntry = breakdown.find(b => b.slotType === slotType && b.slotIndex === index);
      const rawNote = breakdownEntry?.description || "";

      const parsedNote = rawNote.replace(/:([a-zA-Z0-9_]+):/g, (match: string, name: string) => {
          const cleanName = name.replace(/_/g, ' ').toLowerCase();
          let foundId = "";
          if (maps?.resolve) { foundId = maps.resolve(cleanName); }
          
          if (foundId) {
             const url = maps?.getUrl(foundId);
             if (url) return `<img src="${url}" alt="${name}" style="width: 2.4em; height: 2.4em; vertical-align: middle; margin: 0 2px; transform: translateY(-2px);" />`;
          }
          return match; 
      });

      return (
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
                    onClick={(e) => handleOpenNote(e, slotType, index, itemId)}
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
                        style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '2.6em' }}
                        dangerouslySetInnerHTML={{ __html: parsedNote }} 
                    />
                </Box>
            ) : (
                <Box 
                    onClick={(e) => handleOpenNote(e, slotType, index, itemId)}
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
      );
  };

  return (
    <div className="d-flex flex-col width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img className="m-8" width={24} height={24} src={relicIconPath} />
        Relics
      </Typography>

      <div className="d-flex flex-col">
        {primary.map((r, i) => {
          const entry = r.id ? safeGet(r.id) : undefined;

          if (!entry) {
            return (
              <div
                key={i}
                className="d-flex flex-center relic-section__list-item"
                onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
              >
                <Tooltip title="Add relic">
                  <AddIcon className="cursor-pointer relic-section__add-relic" htmlColor="#646464" />
                </Tooltip>
              </div>
            );
          }

          const url = safeUrl(entry.id);
          const tooltipContent = getTooltipContent(entry.id, "relic", i);

          return (
            <HtmlTooltip key={i} title={tooltipContent} arrow placement="bottom" leaveDelay={200}>
                <div
                  className="d-flex flex-center relic-section__list-item"
                  onClick={() => openDialog(PrimaryOrAlternative.Primary, i)}
                >
                  <img className="relic-section__list-item-image" src={url} />
                  <span className="relic-section__list-item-name">{entry.name}</span>
                </div>
            </HtmlTooltip>
          );
        })}
      </div>

      <div className="mt-auto relic-section__alternative">
        <div className="relic-section__alternative__title">Alternative</div>

        {alt.map((r, i) => {
          const entry = safeGet(r.id);
          if (!entry) return null;

          const url = safeUrl(entry.id);
          const tooltipContent = getTooltipContent(entry.id, "relicAlternative", i);

          return (
            <HtmlTooltip key={i} title={tooltipContent} arrow placement="bottom" leaveDelay={200}>
                <div
                  className="d-flex flex-center relic-section__list-item"
                  onClick={() => openDialog(PrimaryOrAlternative.Alternative, i)}
                >
                  <img className="relic-section__list-item-image" src={url} />
                  <span className="relic-section__list-item-name">{entry.name}</span>
                </div>
            </HtmlTooltip>
          );
        })}

        <div
          className="d-flex flex-center relic-section__list-item relic-section__list-item--add"
          onClick={() => openDialog(PrimaryOrAlternative.Alternative, alt.length)}
        >
          <Tooltip title="Add alternative relic">
            <AddIcon className="cursor-pointer relic-section__add-relic" htmlColor="#646464" />
          </Tooltip>
        </div>
      </div>

      <EmojiSelectDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSelect={onSelect}
        slotType={"relic"}
        slotKey=""
        slotIndex={selection.index}
        selectedIndices={[`${selection.index}`]}
        recentlySelected={[]}
      />

      <NoteDialog 
        open={noteDialog.open} 
        onClose={() => setNoteDialog(prev => ({ ...prev, open: false }))} 
        title={noteDialog.itemName}
        initialNote={noteDialog.initialNote}
        imageUrl={noteDialog.imageUrl} 
        onSave={handleSaveNote}
      />
    </div>
  );
};