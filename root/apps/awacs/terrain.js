/*
	terrain.js - Load and read the terrarium terrain data.
*/

// The terrain map expects the world divided cleanly into 32x32 tiles, each tile being 256x256.
// Cutting of the map at this particular lattitude makes the map square. 
const WEB_MERCATOR_LIMIT = -85.051128;

const TERRAIN_ROOT = './data/terrain'
const TERRAIN_ZOOM = 5;
const TILE_COUNT = 2 ** TERRAIN_ZOOM;

const MAX_TILES_IN_CACHE = 256;

const FAILED_TILE_RELOAD_TIMEOUT = 30000;
const TILE_LOAD_TIMEOUT = 18000;

const terrain_tiles = new Map();
const pending_tiles = new Map();
const failed_tiles = new Map();
/*
	Return a tile position given a lattitude,longitude.
	
	The tile position returned is of the form <tile_x>.<pos_x>, <tile_y>.<pos_y>.
	
	The integer part tells you the row/column, the fractional part tells you the
	position within the tile.
*/

function tilePosition(position) {

	const longitude = ((position[0] + 180) % 360 + 360) % 360;
	const latitude = Math.max(WEB_MERCATOR_LIMIT, Math.min(-WEB_MERCATOR_LIMIT, position[1])) * Math.PI / 180;
	return [longitude / 360 * TILE_COUNT, (1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * TILE_COUNT];
}

/* 
	Turn an RGB value into elevation. Terrarium convention.
*/
function rgb2Elevation(r, g, b) {
	return (r * 256.0) + g + (b / 256.0) - 32768.0
}

/* 
	Load a tile map given tile_x, tile_y.
	
	This function loads the Terrarium RGB tile map, creates a temporary canvas
	element to load the PNG bitmap data, and generates a cached 2D elevation
	array.

	The tile cache is a FIFO cache.
*/
async function loadTile(tile_x, tile_y) {
	const tile_key = `${tile_x}/${tile_y}`;
	
	// Already loaded? Return.
	if (terrain_tiles.has(tile_key)) return;
	
	// Queued for loading? Return.
	if (pending_tiles.has(tile_key)) return pending_tiles.get(tile_key);

	// If this is a failed tile, wait for timeout.
	if (Date.now() - (failed_tiles.get(tile_key) || 0) < FAILED_TILE_RELOAD_TIMEOUT) return;

	const promise = (async () => {
		try {
			const response = await fetch(`${TERRAIN_ROOT}/${terrain_zoom}/${tile_key}.png`, { signal: AbortSignal.timeout(TILE_LOAD_TIMEOUT) });
			if (!response.ok) throw new Error('Elevation tile unavailable');
			
			/* Create a temporary canvas. */
			const bitmap = await createImageBitmap(await response.blob());
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width; canvas.height = bitmap.height;
			const context = canvas.getContext('2d', { willReadFrequently: true });
			context.drawImage(bitmap, 0, 0);
			const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
			
			// Create the elevation cache.
			const elevations = new Float32Array(canvas.width * canvas.height);
			for (let pixel_index = 0; pixel_index < elevations.length; pixel_index++) {
				elevations[pixel_index] = rgb2Elevation(pixels[pixel_index * 4], pixels[pixel_index * 4 + 1], pixels[pixel_index * 4 + 2]);
			}
			
			terrain_tiles.set(tile_key, { 
				elevations, size: canvas.width 
			});
			
			// Cleanup.
			bitmap.close();
			failed_tiles.delete(tile_key);
			if (terrain_tiles.size > MAX_TILES_IN_CACHE) terrain_tiles.delete(terrain_tiles.keys().next().value);
		} 
		catch { 
			failed_tiles.set(tile_key, Date.now()); 
		}
		finally { 
			pending_tiles.delete(tile_key); 
		}
	})();
	pending_tiles.set(tile_key, promise);
	return promise;
}

/*
	Get the height in metres given lattitude, longitude.
*/
export function getElevation(position) {
	if (Math.abs(position[1]) > WEB_MERCATOR_LIMIT) return null;

	const [pixel_x, pixel_y] = tilePosition(position);

	const tile_x = Math.floor(pixel_x);
	const tile_y = Math.min(Math.floor(pixel_y), TILE_COUNT - 1);
	
	const tile = terrain_tiles.get(`${tile_x}/${tile_y}`);
	
	if (!tile) return null;
	
	const column = Math.min(tile.size - 1, Math.floor((pixel_x - tile_x) * tile.size));
	const row = Math.min(tile.size - 1, Math.floor((pixel_y - tile_y) * tile.size));
	
	return tile.elevations[row * tile.size + column];
}
/*
	Ensure the tiles corresponding to 'positions' is loaded.
	Used to keep the relevant terrain data in cache.
*/
export async function ensureTerrain(positions) {
	const tile_keys = new Set(positions.map(position => tilePosition(position).map(Math.floor).join('/')));
	const tile_queue = [...tile_keys];
	// Bound requests so a coverage update cannot flood the tile service.
	await Promise.all(Array.from({ length: Math.min(6, tile_queue.length) }, async () => {
		while (tile_queue.length) {
			const [tile_x, tile_y] = tile_queue.shift().split('/').map(Number);
			await loadTile(tile_x, Math.min(TILE_COUNT - 1, tile_y));
		}
	}));
}
