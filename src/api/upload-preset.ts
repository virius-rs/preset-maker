// src/api/upload-preset.ts

import { type SavedPreset } from "../schemas/saved-preset-data";

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

export async function uploadPreset(
  data: SavedPreset,
  id?: string
): Promise<UploadPresetResponse> {
  console.log("Uploading preset via API...", data.presetName);

  try {
    const response = await fetch('/api/save-preset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      imageUrl: "" // no
    };

  } catch (error) {
    console.error("Upload failed", error);
    throw error;
  }
}

export async function getPresetImageUrl(
  preset: SavedPreset,
  id: string
): Promise<string> {
  return "";
}