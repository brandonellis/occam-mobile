export const DEFAULT_FEE_RATE = 0.03;

export const BILLING_CYCLE_LABELS = {
  month: 'Monthly',
  year: 'Yearly',
  week: 'Weekly',
  quarter: 'Quarterly',
};

export const getBillingCycleLabel = (cycle) =>
  BILLING_CYCLE_LABELS[cycle] || cycle;
