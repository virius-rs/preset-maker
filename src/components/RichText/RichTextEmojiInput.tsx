// src/components/RichText/RichTextEmojiInput.tsx

import React, { useCallback, useRef, useState, useEffect } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Paper, List, ListItemButton, ListItemText, ListItemAvatar, Avatar } from "@mui/material";
import { useEmojiEditableField } from "../../hooks/useEmojiEditableField";
import { useEmojiMap, type EmojiEntry } from "../../hooks/useEmojiMap";
import { emojify } from "../../utility/emojify";

import "./RichTextEmojiInput.css";

interface RichTextEmojiInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allowMultiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  autoFocus?: boolean;
  inputRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const RichTextEmojiInput = ({
  value,
  onChange,
  placeholder,
  allowMultiline = true,
  className,
  style,
  onKeyDown,
  onPaste,
  autoFocus,
  inputRef
}: RichTextEmojiInputProps) => {
  const maps = useEmojiMap();
  const { ref, html, onFocus, onBlur, onChange: onFieldChange } = useEmojiEditableField({
    value,
    allowMultiline,
    onCommit: onChange,
  });

  useEffect(() => {
    if (inputRef && ref.current) {
      inputRef.current = ref.current;
    }
  }, [inputRef, ref]);

  const [suggestions, setSuggestions] = useState<EmojiEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef(suggestions);
  const menuOpenRef = useRef(menuOpen);
  const selectedIndexRef = useRef(selectedIndex);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
  useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuOpen) return;
      const target = event.target as Node;
      const isInput = ref.current?.contains(target);
      const isMenu = menuRef.current?.contains(target);
      if (!isInput && !isMenu) {
        setMenuOpen(false);
        setSearchQuery(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [menuOpen, ref]);

  const checkTrigger = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
        setMenuOpen(false);
        setSearchQuery(null);
        return;
    }

    const text = textNode.textContent ?? "";
    const caretPos = range.startOffset;
    const lastColon = text.lastIndexOf(":", caretPos - 1);
    
    if (lastColon !== -1) {
      const query = text.substring(lastColon + 1, caretPos);
      if (query.includes(" ") || query.length > 20) {
        setMenuOpen(false);
        setSearchQuery(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
      setSearchQuery(query); 
    } else {
      setMenuOpen(false);
      setSearchQuery(null);
    }
  }, []);

  useEffect(() => {
      if (searchQuery === null || !maps || !maps.byId) {
          setMenuOpen(false);
          return;
      }
      const timer = setTimeout(() => {
          const lowerQuery = searchQuery.toLowerCase();
          const matches = Object.values(maps.byId).filter(e => {
              const nameMatch = e.name.toLowerCase().includes(lowerQuery);
              const idMatch = e.id.toLowerCase().includes(lowerQuery);
              const aliasMatch = e.id_aliases?.some(a => a.toLowerCase().includes(lowerQuery));
              return nameMatch || idMatch || aliasMatch;
          });
          matches.sort((a, b) => {
              const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
              const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              return 0;
          });
          setSuggestions(matches.slice(0, 50)); 
          setSelectedIndex(0);
          setMenuOpen(matches.length > 0);
      }, 150);
      return () => clearTimeout(timer);
  }, [searchQuery, maps]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isOpen = menuOpenRef.current;
    const currentSuggestions = suggestionsRef.current;
    const currentIndex = selectedIndexRef.current;

    if (isOpen && currentSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault(); e.stopPropagation();
        setSelectedIndex((currentIndex + 1) % currentSuggestions.length);
        return;
      } 
      if (e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        setSelectedIndex((currentIndex - 1 + currentSuggestions.length) % currentSuggestions.length);
        return;
      } 
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault(); e.stopPropagation();
        if (currentSuggestions[currentIndex]) selectEmoji(currentSuggestions[currentIndex]);
        return;
      } 
      if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        setMenuOpen(false);
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  const handleInput = (e: ContentEditableEvent) => {
    onFieldChange(e.target.value); 
    checkTrigger();  
  };

  const createEmojiNode = (emojiId: string): Node | null => {
      const htmlString = emojify(`:${emojiId}:`);
      const div = document.createElement('div');
      div.innerHTML = htmlString;
      const img = div.querySelector('img');
      
      if (img) {
          img.className = "disc-emoji"; 
          return img;
      }
      return null;
  };

  const selectEmoji = (emoji: EmojiEntry) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const currentRange = sel.getRangeAt(0);
    const textNode = currentRange.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const fullText = textNode.textContent ?? "";
    const currentOffset = currentRange.startOffset;
    const queryLen = searchQueryRef.current?.length || 0;
    
    let colonIndex = fullText.lastIndexOf(":", currentOffset - 1 - queryLen);
    if (colonIndex === -1) colonIndex = fullText.lastIndexOf(":", currentOffset - 1);

    if (colonIndex !== -1) {
        const replaceEndIndex = currentOffset;
        const replaceRange = document.createRange();
        replaceRange.setStart(textNode, colonIndex);
        replaceRange.setEnd(textNode, replaceEndIndex);
        replaceRange.deleteContents();
        
        const imgNode = createEmojiNode(emoji.id);
        if (imgNode) {
            replaceRange.insertNode(imgNode);
            const space = document.createTextNode("\u00A0");
            replaceRange.setStartAfter(imgNode);
            replaceRange.setEndAfter(imgNode);
            replaceRange.insertNode(space);
            replaceRange.setStartAfter(space);
            replaceRange.setEndAfter(space);
            sel.removeAllRanges();
            sel.addRange(replaceRange);
        }
        setMenuOpen(false);
        setSearchQuery(null);
        if (ref.current) onFieldChange(ref.current.innerHTML); 
    }
  };

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (menuOpen && listRef.current) {
        const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, menuOpen]);

  useEffect(() => {
      if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  return (
    <div className={`rich-text-wrapper ${className}`} style={style}>
      <ContentEditable
        innerRef={ref}
        html={html}
        className="field-editable"
        onChange={handleInput}
        onBlur={onBlur}
        onFocus={() => onFocus()}
        onKeyUp={checkTrigger}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        tagName="div"
      />
      {(!html || html === "<br>") && placeholder && (
         <div className="field-placeholder">{placeholder}</div>
      )}
      {menuOpen && (
        <Paper
            ref={menuRef}
            elevation={8}
            sx={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 9999,
                maxHeight: 250,
                width: 300,
                overflowY: "auto",
                bgcolor: "#1e1e1e",
                color: "white",
                border: '1px solid #333'
            }}
        >
            <List dense ref={listRef} sx={{ padding: 0 }}>
                {suggestions.map((emoji, index) => {
                    const url = maps?.getUrl(emoji.id);
                    return (
                        <ListItemButton
                            key={emoji.id}
                            selected={index === selectedIndex}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectEmoji(emoji)}
                            sx={{
                                '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
                                '&.Mui-selected:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)' },
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                            }}
                        >
                            <ListItemAvatar sx={{ minWidth: 32 }}>
                                <Avatar src={url} variant="square" sx={{ width: 24, height: 24 }} />
                            </ListItemAvatar>
                            <ListItemText 
                                primary={emoji.name} 
                                secondary={`:${emoji.id}:`}
                                primaryTypographyProps={{ fontSize: '0.9rem', color: '#fff' }}
                                secondaryTypographyProps={{ fontSize: '0.75rem', color: '#888' }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </Paper>
      )}
    </div>
  );
};