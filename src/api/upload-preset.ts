// src/api/upload-preset.ts

import { type SavedPreset } from "../schemas/saved-preset-data";

const API_BASE = "https://preset-maker.vercel.app/";
const API_URL = `${API_BASE}/api/save-preset`;

interface UploadPresetResponse {
  id: string;
  imageUrl: string;
}

export async function uploadPreset(
  data: SavedPreset,
  id?: string
): Promise<UploadPresetResponse> {
  console.log("Uploading preset via Vercel API...", data.presetName);

  try {
    const response = await fetch(API_URL, {
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
      imageUrl: "" // No
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