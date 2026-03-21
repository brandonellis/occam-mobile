import React from 'react';
import PropTypes from 'prop-types';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Icon, Surface, Text } from 'react-native-paper';
import { colors } from '../../theme';
import { proactiveInsightsStyles as styles } from '../../styles/proactiveInsights.styles';

const CARD_ACCENT = {
  expiring_memberships: styles.cardWarning,
  revenue_trend: styles.cardRevenue,
  capacity: styles.cardCapacity,
  client_engagement: styles.cardEngagement,
  caddie_demand: styles.cardCaddie,
  conversions: styles.cardConversions,
};

const TrendBadge = ({ pct }) => {
  if (pct === null || pct === undefined) return null;

  const isUp = pct > 0;
  const isDown = pct < 0;

  return (
    <View style={[styles.trendBadge, isUp ? styles.trendUp : isDown ? styles.trendDown : styles.trendFlat]}>
      <Icon
        source={isUp ? 'arrow-up' : isDown ? 'arrow-down' : 'minus'}
        size={10}
        color={isUp ? colors.success : isDown ? colors.error : colors.textTertiary}
      />
      <Text style={[styles.trendText, isUp ? styles.trendTextUp : isDown ? styles.trendTextDown : styles.trendTextFlat]}>
        {isUp ? '+' : ''}{pct}%
      </Text>
    </View>
  );
};

TrendBadge.propTypes = { pct: PropTypes.number };

const MemberList = ({ members, maxVisible = 3 }) => {
  if (!members || members.length === 0) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <View style={styles.memberList}>
      {visible.map((m, i) => (
        <View key={`${m.name}-${i}`} style={styles.memberRow}>
          <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
          {m.days_left !== undefined ? (
            <View style={[styles.daysPill, m.days_left <= 7 && styles.daysPillHot]}>
              <Text style={[styles.daysPillText, m.days_left <= 7 && styles.daysPillTextHot]}>
                {m.days_left}d
              </Text>
            </View>
          ) : m.detail ? (
            <Text style={styles.memberDetail}>{m.detail}</Text>
          ) : null}
        </View>
      ))}
      {overflow > 0 ? (
        <Text style={styles.memberOverflow}>+{overflow} more</Text>
      ) : null}
    </View>
  );
};

MemberList.propTypes = {
  members: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
  maxVisible: PropTypes.number,
};

const HighlightsList = ({ highlights, maxVisible = 3 }) => {
  if (!highlights || highlights.length === 0) return null;

  const visible = highlights.slice(0, maxVisible);
  const overflow = highlights.length - maxVisible;

  return (
    <View style={styles.memberList}>
      {visible.map((h, i) => (
        <View key={h.type || h.label || `highlight-${i}`} style={styles.highlightRow}>
          <Text style={styles.highlightLabel} numberOfLines={1}>{h.label}</Text>
          <Text style={styles.highlightCount}>{h.count}</Text>
        </View>
      ))}
      {overflow > 0 ? (
        <Text style={styles.memberOverflow}>+{overflow} more</Text>
      ) : null}
    </View>
  );
};

HighlightsList.propTypes = {
  highlights: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    label: PropTypes.string,
    count: PropTypes.number,
  })),
  maxVisible: PropTypes.number,
};

const InsightCard = ({ card, onAskMarshal }) => {
  const accent = CARD_ACCENT[card.type] || styles.cardCapacity;

  return (
    <Surface style={[styles.card, accent, card.urgent && styles.cardUrgent]} elevation={0}>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Icon source={card.icon} size={16} color={colors.textSecondary} />
          <Text style={styles.cardTitle}>{card.title}</Text>
          {card.trendPct !== undefined && card.trendPct !== null ? (
            <TrendBadge pct={card.trendPct} />
          ) : card.trending ? (
            <View style={styles.trendingBadge}>
              <Icon source="arrow-up" size={9} color={colors.success} />
              <Text style={styles.trendingText}>trending</Text>
            </View>
          ) : null}
        </View>

        {card.period ? (
          <Text style={styles.cardPeriod}>{card.period}</Text>
        ) : null}

        {/* Revenue special layout */}
        {card.type === 'revenue_trend' ? (
          <View style={styles.revenueRow}>
            <View style={styles.revenueAmount}>
              <Text style={styles.revenueValue}>{card.thisMonth}</Text>
              <Text style={styles.revenuePeriod}>this month</Text>
            </View>
            <View style={styles.revenueSep} />
            <View style={styles.revenueAmount}>
              <Text style={styles.revenueValue}>{card.lastMonth}</Text>
              <Text style={styles.revenuePeriod}>last month</Text>
            </View>
          </View>
        ) : null}

        {/* Big number headline */}
        {card.headline && card.type !== 'revenue_trend' ? (
          <View style={styles.headline}>
            <Text style={styles.headlineNumber}>{card.headline}</Text>
            <Text style={styles.headlineLabel}>{card.headlineLabel}</Text>
          </View>
        ) : null}

        {/* Stats row (capacity) */}
        {card.stats ? (
          <View style={styles.statsRow}>
            {card.stats.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Member list (expiring, engagement) */}
        {card.members ? <MemberList members={card.members} maxVisible={card.headline ? 2 : 3} /> : null}

        {/* Highlights (caddie demand, conversions) */}
        {card.highlights ? <HighlightsList highlights={card.highlights} maxVisible={card.headline ? 2 : 3} /> : null}
      </View>

      {/* Ask Marshal CTA */}
      <Pressable style={styles.marshalLink} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => onAskMarshal(card.type, card.data)}>
        <Icon source="robot-outline" size={14} color={colors.accent} />
        <Text style={styles.marshalLinkText}>Ask Marshal</Text>
        <Icon source="arrow-right" size={12} color={colors.accent} />
      </Pressable>
    </Surface>
  );
};

InsightCard.propTypes = {
  card: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    data: PropTypes.object,
    headline: PropTypes.string,
    headlineLabel: PropTypes.string,
    period: PropTypes.string,
    trendPct: PropTypes.number,
    trending: PropTypes.bool,
    urgent: PropTypes.bool,
    thisMonth: PropTypes.string,
    lastMonth: PropTypes.string,
    members: PropTypes.array,
    highlights: PropTypes.array,
    stats: PropTypes.array,
  }).isRequired,
  onAskMarshal: PropTypes.func.isRequired,
};

const ProactiveInsightsSection = ({ cards, isLoading, error, onRefresh, onAskMarshal }) => {
  if (isLoading) return null;
  if (error || !cards || cards.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Icon source="robot-outline" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Marshal Insights</Text>
        </View>
        {onRefresh ? (
          <Button mode="text" compact onPress={onRefresh}>
            Refresh
          </Button>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {cards.map((card) => (
          <InsightCard key={card.type} card={card} onAskMarshal={onAskMarshal} />
        ))}
      </ScrollView>
    </View>
  );
};

ProactiveInsightsSection.propTypes = {
  cards: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onAskMarshal: PropTypes.func.isRequired,
};

export default ProactiveInsightsSection;
