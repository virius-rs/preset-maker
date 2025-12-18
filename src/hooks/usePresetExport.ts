// hooks/usePresetExport.ts

import html2canvas from "html2canvas";

export type ExportScope = 'combined' | 'inventory-equipped' | 'buffs';

export const usePresetExport = (presetName: string) => {
  const LOGGING = false;
  const log = (...a: any[]) => LOGGING && console.log("[Export]", ...a);

  const getEditorElement = () =>
    document.querySelector(".preset-editor__card") as HTMLElement | null;

  const getLoadoutContainer = () =>
    document.querySelector(".preset-map-container") as HTMLElement | null;
  
  const getRelicFamiliarContainer = () =>
    document.querySelector(".relics-familiar-container") as HTMLElement | null;

  const GEAR_WIDTH = 510;
  const GEAR_HEIGHT = 163;
  const BUFFS_WIDTH = 510;


  const ensureImagesLoaded = async (el: HTMLElement) => {
    const images = Array.from(el.querySelectorAll("img"));
    log("Waiting for images:", images.length);

    await Promise.all(
      images
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = () => resolve(true);
            })
        )
    );
  };

  const renderCanvas = async (scope: ExportScope): Promise<HTMLCanvasElement | null> => {
    const element = getEditorElement();
    if (!element) return null;

    log("Starting renderCanvas() with scope:", scope);
    await ensureImagesLoaded(element);

    const originalPadding = element.style.padding;
    const originalMargin = element.style.marginBottom;
    const cardContent = element.querySelector(
      ".MuiCardContent-root"
    ) as HTMLElement | null;
    const originalCardContentPadding = cardContent?.style.padding;

    const addButtons = Array.from(
      element.querySelectorAll(
        ".relic-section__list-item--add, .familiar-section__list-item--add"
      )
    ) as HTMLElement[];
    const listRows = Array.from(
      element.querySelectorAll(
        ".relic-section__list-item, .familiar-section__list-item"
      )
    ) as HTMLElement[];
    const altSections = Array.from(
      element.querySelectorAll(
        ".relic-section__alternative, .familiar-section__alternative"
      )
    ) as HTMLElement[];

    const hiddenRows: HTMLElement[] = [];
    const hiddenSections: HTMLElement[] = [];
    
    const conditionallyHiddenElements: {el: HTMLElement, originalDisplay: string}[] = [];
    
    const loadoutContainer = getLoadoutContainer();
    const relicFamiliarContainer = getRelicFamiliarContainer();
    
    let originalBuffsWidth: string | undefined;

    const hideElement = (el: HTMLElement | null) => {
        if (el && el.style.display !== 'none') {
            conditionallyHiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.display = 'none';
        }
    };
    
    try {
      if (scope === 'buffs' && relicFamiliarContainer) { 
          hideElement(loadoutContainer);
          
          originalBuffsWidth = relicFamiliarContainer.style.width;
          relicFamiliarContainer.style.width = `${BUFFS_WIDTH}px`;
      }
      
      if (scope === 'inventory-equipped') { 
          hideElement(relicFamiliarContainer);
      }
      
      addButtons.forEach((b) => (b.style.display = "none"));
      listRows.forEach((row) => {
        const isAdd = row.classList.contains("relic-section__list-item--add") ||
                      row.classList.contains("familiar-section__list-item--add");
        const hasImage = !!row.querySelector("img");

        if (!isAdd && !hasImage) {
          row.style.display = "none";
          hiddenRows.push(row);
        }
      });
      altSections.forEach((section) => {
        const list = section.querySelector(
          ".relic-section__list, .familiar-section__list"
        ) as HTMLElement | null;

        if (!list) {
          section.style.display = "none";
          hiddenSections.push(section);
          return;
        }
        const realItems = Array.from(list.children).filter((child) =>
          child.querySelector("img")
        );
        if (realItems.length === 0) {
          section.style.display = "none";
          hiddenSections.push(section);
        }
      });

      element.style.padding = "0px";
      element.style.marginBottom = "0px";
      if (cardContent) cardContent.style.padding = "0px";

      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: null,
      });

      
      let cropX, cropY, cropWidth, cropHeight;

      if (scope === 'inventory-equipped' && loadoutContainer) {
          const editorBox = element.getBoundingClientRect();
          const loadoutBox = loadoutContainer.getBoundingClientRect();
          
          cropX = loadoutBox.left - editorBox.left;
          cropY = loadoutBox.top - editorBox.top;
          cropWidth = GEAR_WIDTH;
          cropHeight = GEAR_HEIGHT;
      } 
      else if (scope === 'buffs' && relicFamiliarContainer) {
          const editorBox = element.getBoundingClientRect();
          const buffsBox = relicFamiliarContainer.getBoundingClientRect();
          
          cropX = buffsBox.left - editorBox.left;
          cropY = buffsBox.top - editorBox.top;
          cropWidth = BUFFS_WIDTH;
          cropHeight = buffsBox.height; 
      }
      else {
          const visibleContent = element.querySelector('.preset-editor__export-container');
          const boundingBox = visibleContent ? visibleContent.getBoundingClientRect() : element.getBoundingClientRect();
          const editorBox = element.getBoundingClientRect();

          cropX = boundingBox.left - editorBox.left;
          cropY = boundingBox.top - editorBox.top;
          cropWidth = boundingBox.width;
          cropHeight = boundingBox.height; 
      }
      
      const cropped = document.createElement("canvas");
      cropped.width = Math.round(cropWidth); 
      cropped.height = Math.round(cropHeight);

      const ctx = cropped.getContext("2d");
      if (ctx) {
          ctx.drawImage(
              canvas, 
              cropX, cropY, cropWidth, cropHeight,
              0, 0, cropped.width, cropped.height
          );
      }
      
      return cropped;
    } finally {
      element.style.padding = originalPadding;
      element.style.marginBottom = originalMargin;
      if (cardContent) cardContent.style.padding = originalCardContentPadding ?? "";

      addButtons.forEach((b) => (b.style.display = ""));
      hiddenRows.forEach((r) => (r.style.display = ""));
      hiddenSections.forEach((s) => (s.style.display = ""));

      conditionallyHiddenElements.forEach(item => {
          item.el.style.display = item.originalDisplay || ''; 
      });
      
      if (relicFamiliarContainer && scope === 'buffs') {
          relicFamiliarContainer.style.width = originalBuffsWidth || '';
      }
    }
  };

  const downloadImage = async (scope: ExportScope = 'combined') => {
    log("downloadImage() called");
    const canvas = await renderCanvas(scope);
    if (!canvas) return;

    const scopeName = scope.toUpperCase();
    const link = document.createElement("a");
    link.download = `PRESET_${presetName.replaceAll(" ", "_")}_${scopeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    log("Download OK");
  };

  const copyImage = async (scope: ExportScope = 'combined') => {
    log("copyImage() called");
    const canvas = await renderCanvas(scope);
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve)
    );
    if (blob)
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

    log("Copied OK");
  };

  return {
    copyImage,
    downloadImage,
    clipboardSupported: Boolean(navigator.clipboard?.write),
  };
};