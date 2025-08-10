// If you already have getNodeHeightById in a file, you can re-export from there.
// Keeping this small utility so all placement/shift math calls one place.

export const getNodeHeightById = (nodeId: string): number => {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
  return el?.offsetHeight ?? 80; // fallback if not rendered yet
};

/**
 * For “add below” and shift math. Defaults are a safe fallback.
 */
export function halfHeightPlus(nodeId: string, pad = 100, fallback = 80) {
  const h = getNodeHeightById(nodeId) || fallback;
  return h / 2 + pad;
}