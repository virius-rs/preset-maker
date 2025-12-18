import React from 'react'; // <--- FIX 1: Added this line
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// --- 1. COORDINATES ---
// (These remain exactly the same as before)
const inventoryCoords = [
  { x1: 11, y1: 7, x2: 47, y2: 39 }, { x1: 54, y1: 7, x2: 90, y2: 39 },
  { x1: 97, y1: 7, x2: 133, y2: 39 }, { x1: 140, y1: 7, x2: 176, y2: 39 },
  { x1: 183, y1: 7, x2: 219, y2: 39 }, { x1: 226, y1: 7, x2: 262, y2: 39 },
  { x1: 269, y1: 7, x2: 305, y2: 39 },

  { x1: 11, y1: 43, x2: 47, y2: 75 }, { x1: 54, y1: 43, x2: 90, y2: 75 },
  { x1: 97, y1: 43, x2: 133, y2: 75 }, { x1: 140, y1: 43, x2: 176, y2: 75 },
  { x1: 183, y1: 43, x2: 219, y2: 75 }, { x1: 226, y1: 43, x2: 262, y2: 75 },
  { x1: 269, y1: 43, x2: 305, y2: 75 },

  { x1: 11, y1: 79, x2: 47, y2: 111 }, { x1: 54, y1: 79, x2: 90, y2: 111 },
  { x1: 97, y1: 79, x2: 133, y2: 111 }, { x1: 140, y1: 79, x2: 176, y2: 111 },
  { x1: 183, y1: 79, x2: 219, y2: 111 }, { x1: 226, y1: 79, x2: 262, y2: 111 },
  { x1: 269, y1: 79, x2: 305, y2: 111 },

  { x1: 11, y1: 115, x2: 47, y2: 147 }, { x1: 54, y1: 115, x2: 90, y2: 147 },
  { x1: 97, y1: 115, x2: 133, y2: 147 }, { x1: 140, y1: 115, x2: 176, y2: 147 },
  { x1: 183, y1: 115, x2: 219, y2: 147 }, { x1: 226, y1: 115, x2: 262, y2: 147 },
  { x1: 269, y1: 115, x2: 305, y2: 147 }
];

const equipmentCoords = [
  { x1: 330, y1: 8.5, x2: 362, y2: 39 }, { x1: 376, y1: 8.5, x2: 408, y2: 39 },
  { x1: 422, y1: 8.5, x2: 454, y2: 39 }, { x1: 468, y1: 8.5, x2: 500, y2: 39 },
  
  { x1: 330, y1: 46.5, x2: 362, y2: 78 }, { x1: 376, y1: 46.5, x2: 408, y2: 78 },
  { x1: 422, y1: 46.5, x2: 454, y2: 78 }, { x1: 468, y1: 46.5, x2: 500, y2: 78 },
  
  { x1: 330, y1: 84, x2: 362, y2: 115 }, { x1: 376, y1: 84, x2: 408, y2: 115 },
  { x1: 422, y1: 84, x2: 454, y2: 115 }, { x1: 468, y1: 84, x2: 500, y2: 115 },
  
  { x1: 330, y1: 122, x2: 362, y2: 152 }
];

// --- 2. DATA TYPES ---

type Item = { id: string };
type Relic = { id: string };
type Familiar = { id: string };

interface PresetData {
  presetName: string;
  inventorySlots: Item[];
  equipmentSlots: Item[];
  relics: { primaryRelics: Relic[]; alternativeRelics: Relic[] };
  familiars: { primaryFamiliars: Familiar[]; alternativeFamiliars: Familiar[] };
}

// --- 3. HANDLER ---

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // A. Validation
  if (!id) {
    return new ImageResponse(
      <div style={{ color: 'white', background: '#121212', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Preset ID Missing
      </div>,
      { width: 600, height: 400 }
    );
  }

  // B. Fetch Data from Firebase
  // REPLACE 'YOUR-PROJECT-ID' below with your real project ID from firebase
  const DB_URL = 'https://YOUR-PROJECT-ID.firebaseio.com'; 
  
  let preset: PresetData | null = null;
  try {
    const res = await fetch(`${DB_URL}/presets/${id}.json`);
    preset = await res.json();
  } catch (e) {
    console.error('Error fetching preset:', e);
  }

  if (!preset) {
    return new ImageResponse(
      <div style={{ color: 'white', background: '#121212', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Preset Not Found
      </div>,
      { width: 600, height: 400 }
    );
  }

  // C. Image Resolution Helper
  const getIconUrl = (itemId: string) => {
    if (!itemId) return null;
    return `https://img.pvme.io/images/${itemId}.png`; 
  };

  // D. Render the Image
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#121212', // Dark Theme Background
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
          padding: 20,
        }}
      >
        {/* HEADER: Preset Name */}
        <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#fff', borderBottom: '1px solid #333', paddingBottom: 10, width: '100%' }}>
          {preset.presetName || 'Untitled Preset'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 40 }}>
          
          {/* LEFT COLUMN: Inventory & Equipment Grid */}
          <div style={{ position: 'relative', width: 520, height: 160 }}>
             
             {/* Background Container Box (Visual only) */}
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px solid #333', borderRadius: 8, background: '#0b0b0b' }} />

             {/* INVENTORY SLOTS */}
             {preset.inventorySlots?.map((slot, index) => {
                const coord = inventoryCoords[index];
                if (!coord || !slot.id) return null;
                const src = getIconUrl(slot.id);
                
                return (
                  <div key={`inv-${index}`} style={{ position: 'absolute', left: coord.x1, top: coord.y1, display: 'flex' }}>
                    {src && <img src={src} width="36" height="32" style={{ objectFit: 'contain' }} />}
                  </div>
                );
             })}

             {/* EQUIPMENT SLOTS */}
             {preset.equipmentSlots?.map((slot, index) => {
                const coord = equipmentCoords[index];
                if (!coord || !slot.id) return null;
                const src = getIconUrl(slot.id);

                return (
                  <div key={`equip-${index}`} style={{ position: 'absolute', left: coord.x1, top: coord.y1, display: 'flex' }}>
                    {src && <img src={src} width="32" height="30" style={{ objectFit: 'contain' }} />}
                  </div>
                );
             })}
          </div>

        </div>

        {/* BOTTOM ROW: Relics & Familiars */}
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20, gap: 20, alignItems: 'center' }}>
            
            {/* Relics */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#0b0b0b', padding: '10px 15px', borderRadius: 8, border: '1px solid #333' }}>
                <span style={{ fontSize: 14, color: '#888', marginRight: 5 }}>RELICS</span>
                {preset.relics?.primaryRelics?.map((r, i) => (
                    r.id && <img key={`pr-${i}`} src={getIconUrl(r.id)!} width="32" height="32" />
                ))}
            </div>

            {/* Familiars */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#0b0b0b', padding: '10px 15px', borderRadius: 8, border: '1px solid #333' }}>
                <span style={{ fontSize: 14, color: '#888', marginRight: 5 }}>FAMILIAR</span>
                {preset.familiars?.primaryFamiliars?.map((f, i) => (
                    f.id && <img key={`pf-${i}`} src={getIconUrl(f.id)!} width="32" height="32" />
                ))}
            </div>

        </div>

      </div>
    ),
    {
      width: 600,
      height: 350,
    }
  );
}