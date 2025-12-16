// src/storage/preset-storage.ts

import { LocalPresetStorage } from "./LocalPresetStorage";
import { normalizePreset } from "../redux/store/reducers/normalizePreset";
import { type Preset } from "../schemas/preset";
import { type PresetSummary } from "../schemas/preset-summary";
import { type SavedPreset } from "../schemas/saved-preset-data";
import { getPreset as getRemotePreset } from "../api/get-preset";
import { uploadPreset } from "../api/upload-preset";

export const loadPresetById = async (
  id: string
): Promise<{
  data: Preset;
  presetId: string;
  source: "local" | "cloud";
}> => {
  try {
    const raw = await LocalPresetStorage.getPreset(id);
    const normalised = await normalizePreset(raw);
    return {
      data: normalised,
      presetId: raw.presetId ?? id,
      source: "local",
    };
  } catch (e) {
    console.log(`Local load failed for ${id}, trying GitHub...`);
    const remoteData = await getRemotePreset(id);
    
    return {
      data: remoteData,
      presetId: id,
      source: "cloud",
    };
  }
};

export const PresetStorageShim = {
  async savePreset(preset: SavedPreset, id?: string): Promise<string> {
    const result = await uploadPreset(preset, id);
    return result.id;
  },

  async listRecentPresets(): Promise<PresetSummary[]> {
    return LocalPresetStorage.listRecentPresets();
  },

  saveToRecentPresets(summary: PresetSummary): void {
    LocalPresetStorage.saveToRecentPresets(summary);
  }
};