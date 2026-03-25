export const buildSyntheticEmail = (contactNumber) => `${contactNumber}@society.app`;

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getPaginatedSlice = (docs, page, limit) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const start = (pageNum - 1) * limitNum;
  return docs.slice(start, start + limitNum);
};
