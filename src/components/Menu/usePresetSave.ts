// src/components/Menu/usePresetSave.ts

import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";
import { addRecentPreset } from "../../storage/recent-presets";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import { useGlobalLoading } from "../../storage/GlobalLoadingContext";

export function usePresetSave({
  preset,
  presetName,
  markClean,
  setRecentList,
}: {
  preset: any;
  presetName: string;
  markClean: (snapshot: any) => void;
  setRecentList: (list: any[]) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { beginGlobalSave, endGlobalSave } = useGlobalLoading();
  const [isSaving, setIsSaving] = useState(false);

  const generateUrl = useCallback(async () => {
    setIsSaving(true);
    beginGlobalSave("Generating URL...");

    try {
      const newId = await CloudPresetStorage.savePreset(preset);

      addRecentPreset({ 
        presetId: newId, 
        presetName: presetName || "Untitled Preset", 
        source: "cloud" 
      });
      
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      markClean(preset);

      return newId;

    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(`Failed to generate URL: ${err.message}`, { variant: "error" });
      return null;
    } finally {
      setIsSaving(false);
      endGlobalSave();
    }
  }, [
    preset,
    presetName,
    enqueueSnackbar,
    beginGlobalSave,
    endGlobalSave,
    markClean,
    setRecentList,
  ]);

  return {
    generateUrl,
    isSaving,
  };
}