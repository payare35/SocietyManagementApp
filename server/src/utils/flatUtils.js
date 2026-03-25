/**
 * Count flats from a comma-separated flatNumber string stored on members.
 * "501" → 1, "501, 502" → 2, empty → 1
 */
export const countFlats = (flatNumber) => {
  if (!flatNumber) return 1;
  const parts = String(flatNumber).split(',').map((f) => f.trim()).filter(Boolean);
  return parts.length || 1;
};
