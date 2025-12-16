// src/api/get-preset.ts

import { type Preset, blankPreset } from "../schemas/preset";
import { normalizePreset } from "../redux/store/reducers/normalizePreset";

const REPO_OWNER = "virius-rs";
const REPO_NAME = "preset-maker";
const BRANCH = "master";
const STORAGE_PATH = "presets";

export async function getPreset(id: string): Promise<Preset> {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${STORAGE_PATH}/${id}.json`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`Preset ${id} not found at ${url}`);
      return blankPreset;
    }

    const data = await res.json();
    return normalizePreset(data);

  } catch (e) {
    console.error("Failed to load preset", e);
    return blankPreset;
  }
}