const terrain_zoom = 5;
const tile_count = 2 ** terrain_zoom;
const terrain_tiles = new Map();
const pending_tiles = new Map();
const failed_tiles = new Map();

function tilePosition(position) {
  const longitude = ((position[0] + 180) % 360 + 360) % 360;
  const latitude = Math.max(-85.051128, Math.min(85.051128, position[1])) * Math.PI / 180;
  return [longitude / 360 * tile_count, (1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * tile_count];
}

async function loadTile(tile_x, tile_y) {
  const tile_key = `${tile_x}/${tile_y}`;
  if (terrain_tiles.has(tile_key)) return;
  if (pending_tiles.has(tile_key)) return pending_tiles.get(tile_key);
  if (Date.now() - (failed_tiles.get(tile_key) || 0) < 30000) return;
  const promise = (async () => {
    try {
      const response = await fetch(`./data/terrain/${terrain_zoom}/${tile_key}.png`, {signal: AbortSignal.timeout(18000)});
      if (!response.ok) throw new Error('Elevation tile unavailable');
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext('2d', {willReadFrequently: true});
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      // Terrarium RGB encodes metres as red*256 + green + blue/256 - 32768.
      const elevations = new Float32Array(canvas.width * canvas.height);
      for (let pixel_index = 0; pixel_index < elevations.length; pixel_index++) {
        elevations[pixel_index] = pixels[pixel_index * 4] * 256 + pixels[pixel_index * 4 + 1] + pixels[pixel_index * 4 + 2] / 256 - 32768;
      }
      terrain_tiles.set(tile_key, {elevations, size: canvas.width});
      bitmap.close();
      failed_tiles.delete(tile_key);
      if (terrain_tiles.size > 256) terrain_tiles.delete(terrain_tiles.keys().next().value);
    } catch { failed_tiles.set(tile_key, Date.now()); }
    finally { pending_tiles.delete(tile_key); }
  })();
  pending_tiles.set(tile_key, promise);
  return promise;
}

export function getElevation(position) {
  if (Math.abs(position[1]) > 85.051128) return null;
  const [pixel_x, pixel_y] = tilePosition(position);
  const tile_x = Math.floor(pixel_x);
  const tile_y = Math.min(tile_count - 1, Math.floor(pixel_y));
  const tile = terrain_tiles.get(`${tile_x}/${tile_y}`);
  if (!tile) return null;
  const column = Math.min(tile.size - 1, Math.floor((pixel_x - tile_x) * tile.size));
  const row = Math.min(tile.size - 1, Math.floor((pixel_y - tile_y) * tile.size));
  return tile.elevations[row * tile.size + column];
}

export async function ensureTerrain(positions) {
  const tile_keys = new Set(positions.map(position => tilePosition(position).map(Math.floor).join('/')));
  const tile_queue = [...tile_keys];
  // Bound requests so a coverage update cannot flood the tile service.
  await Promise.all(Array.from({length: Math.min(6, tile_queue.length)}, async () => {
    while (tile_queue.length) {
      const [tile_x, tile_y] = tile_queue.shift().split('/').map(Number);
      await loadTile(tile_x, Math.min(tile_count - 1, tile_y));
    }
  }));
}
