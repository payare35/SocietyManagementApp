import { countFlats } from './flatUtils.js';

/**
 * Compute maintenance due for one member.
 * @param {{ flatNumber?: string, monthlyMaintenanceAmount?: number | null }} member
 * @param {number} configMonthlyAmount - society default from societyConfig
 */
export const computeDueAmount = (member, configMonthlyAmount) => {
  const flatCount = countFlats(member.flatNumber);
  const ratePerFlat =
    member.monthlyMaintenanceAmount != null && member.monthlyMaintenanceAmount !== ''
      ? Number(member.monthlyMaintenanceAmount)
      : Number(configMonthlyAmount);
  return {
    ratePerFlat,
    flatCount,
    amount: ratePerFlat * flatCount,
  };
};
