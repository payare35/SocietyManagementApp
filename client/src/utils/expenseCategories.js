/**
 * Expense category tree: subType labels roll up to type (Maintenance, Repair, etc.)
 */

export const EXPENSE_ITEMS = [
  { subType: 'Lift Repair — Electrical', type: 'Repair', group: 'Lift Repair' },
  { subType: 'Lift Repair — Part Replacement', type: 'Repair', group: 'Lift Repair' },
  { subType: 'Electrical', type: 'Repair' },
  { subType: 'Lift Repair', type: 'Repair' },
  { subType: 'Plumbing', type: 'Repair' },
  { subType: 'Salary', type: 'Maintenance' },
  { subType: 'Society Electricity', type: 'Maintenance' },
  { subType: 'Society Tax', type: 'Maintenance' },
  { subType: 'Water Tax', type: 'Maintenance' },
  { subType: 'Tanker Charges', type: 'Maintenance' },
  { subType: 'Lift AMC', type: 'Maintenance' },
];

const ROLLUP_ONLY = ['Event', 'Utility', 'Other'];

const itemBySubType = new Map(EXPENSE_ITEMS.map((item) => [item.subType, item]));

export const resolveExpenseType = (subType) => {
  if (!subType) return null;
  const item = itemBySubType.get(subType);
  if (item) return item.type;
  if (ROLLUP_ONLY.includes(subType)) return subType;
  return null;
};

export const getExpenseCascaderOptions = () => {
  const repairGroups = {};
  const repairStandalone = [];

  for (const item of EXPENSE_ITEMS) {
    if (item.type !== 'Repair') continue;
    if (item.group) {
      if (!repairGroups[item.group]) repairGroups[item.group] = [];
      repairGroups[item.group].push({
        value: item.subType,
        label: item.subType.replace(`${item.group} — `, ''),
      });
    } else {
      repairStandalone.push({ value: item.subType, label: item.subType });
    }
  }

  const maintenanceChildren = EXPENSE_ITEMS.filter((i) => i.type === 'Maintenance').map((i) => ({
    value: i.subType,
    label: i.subType,
  }));

  const repairChildren = [
    ...Object.entries(repairGroups).map(([group, children]) => ({
      value: `__group__${group}`,
      label: group,
      children,
    })),
    ...repairStandalone,
  ];

  return [
    { value: 'Maintenance', label: 'Maintenance', children: maintenanceChildren },
    { value: 'Repair', label: 'Repair', children: repairChildren },
    ...ROLLUP_ONLY.map((t) => ({ value: t, label: t })),
  ];
};

/** Convert cascader path to { type, subType } for API */
export const cascaderPathToExpense = (path) => {
  if (!path?.length) return { type: null, subType: null };
  const leaf = path[path.length - 1];
  if (leaf.startsWith('__group__')) return { type: null, subType: null };
  if (ROLLUP_ONLY.includes(leaf)) return { type: leaf, subType: null };
  const rollup = resolveExpenseType(leaf);
  return { type: rollup, subType: leaf };
};

/** Build cascader value from stored expense */
export const expenseToCascaderPath = (expense) => {
  if (!expense) return [];
  const sub = expense.subType;
  const type = expense.type;
  if (sub) {
    const item = itemBySubType.get(sub);
    if (item?.group) return [type, `__group__${item.group}`, sub];
    if (item) return [type, sub];
    return [type, sub];
  }
  if (type && ROLLUP_ONLY.includes(type)) return [type];
  if (type) return [type];
  return [];
};

export const getExpenseDisplayLabel = (expense) => expense?.subType || expense?.type || '—';
