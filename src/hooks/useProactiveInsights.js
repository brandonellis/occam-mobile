import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMarshalInsights } from '../services/marshal.api';
import logger from '../helpers/logger.helper';

/**
 * Fetch and manage proactive insights from the Marshal API.
 * Used by both dashboard screens and MarshalScreen to display
 * rich operational insight cards.
 */
const useProactiveInsights = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMarshalInsights();
      // The API may wrap in { success, data } or return data directly
      const insightData = result?.data || result;
      setData(insightData);
    } catch (err) {
      logger.warn('Proactive insights fetch failed:', err?.message);
      setError('Could not load insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Build a flat list of displayable insight cards for simpler rendering
  const cards = useMemo(() => {
    const expiring = data?.expiring_memberships || null;
    const revenue = data?.revenue_trend || null;
    const capacity = data?.capacity || null;
    const engagement = data?.client_engagement || null;
    const caddieDemand = data?.caddie_demand && !data.caddie_demand.unavailable ? data.caddie_demand : null;
    const conversions = data?.conversions && !data.conversions.unavailable ? data.conversions : null;

    const result = [];

    if (expiring && (expiring.count ?? 0) > 0) {
      result.push({
        type: 'expiring_memberships',
        title: 'Expiring Memberships',
        icon: 'card-account-details-outline',
        period: 'next 30 days',
        urgent: expiring.members?.some((m) => m.days_left <= 7),
        headline: `${expiring.count}`,
        headlineLabel: 'expiring soon',
        members: expiring.members || [],
        data: expiring,
      });
    }

    if (revenue && !revenue.unavailable) {
      result.push({
        type: 'revenue_trend',
        title: 'Revenue Trend',
        icon: 'trending-up',
        trendPct: revenue.change_pct ?? null,
        thisMonth: revenue.this_month_fmt ?? '$0',
        lastMonth: revenue.last_month_fmt ?? '$0',
        data: revenue,
      });
    }

    if (capacity) {
      result.push({
        type: 'capacity',
        title: 'Weekly Capacity',
        icon: 'calendar-clock',
        period: capacity.week_label,
        trendPct: capacity.change_pct ?? null,
        headline: `${capacity.booked_hours ?? 0}`,
        headlineLabel: `hrs across ${capacity.coach_count ?? 0} coach${(capacity.coach_count ?? 0) !== 1 ? 'es' : ''}`,
        stats: [
          { label: 'Bookings', value: capacity.total_bookings ?? 0 },
          { label: 'Last week', value: `${capacity.last_week_hours ?? 0} hrs` },
        ],
        data: capacity,
      });
    }

    if (engagement && (engagement.inactive_count ?? 0) > 0) {
      result.push({
        type: 'client_engagement',
        title: 'Client Engagement',
        icon: 'account-switch-outline',
        period: '30+ days inactive',
        headline: `${engagement.inactive_count}`,
        headlineLabel: `of ${engagement.total_clients ?? 0} clients inactive`,
        members: (engagement.clients || []).map((c) => ({
          name: c.name,
          detail: `${c.days_since}d \u00B7 ${c.last_visit}`,
        })),
        data: engagement,
      });
    }

    if (caddieDemand && caddieDemand.has_signals) {
      result.push({
        type: 'caddie_demand',
        title: 'Caddie Demand',
        icon: 'lightning-bolt-outline',
        period: `last ${caddieDemand.period_days ?? 7} days`,
        trending: (caddieDemand.anomalies?.length ?? 0) > 0,
        headline: `${caddieDemand.total_signals ?? 0}`,
        headlineLabel: `friction signal${(caddieDemand.total_signals ?? 0) !== 1 ? 's' : ''}`,
        highlights: caddieDemand.highlights || [],
        data: caddieDemand,
      });
    }

    if (conversions && conversions.has_signals) {
      result.push({
        type: 'conversions',
        title: 'Conversions',
        icon: 'check-circle-outline',
        period: `last ${conversions.period_days ?? 7} days`,
        trending: (conversions.anomalies?.length ?? 0) > 0,
        headline: `${conversions.total_signals ?? 0}`,
        headlineLabel: `conversion event${(conversions.total_signals ?? 0) !== 1 ? 's' : ''}`,
        highlights: conversions.highlights || [],
        data: conversions,
      });
    }

    return result;
  }, [data]);

  return {
    cards,
    data,
    error,
    fetchInsights,
    isLoading,
  };
};

export default useProactiveInsights;
