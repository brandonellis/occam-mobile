import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ListSkeleton } from '../../components/SkeletonLoader';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import ServiceUsageCard from '../../components/ServiceUsageCard';
import { packageStyles as styles } from '../../styles/packages.styles';
import { globalStyles } from '../../styles/global.styles';
import { getPackages, getMyPackages } from '../../services/packages.api';
import { formatCurrency } from '../../helpers/pricing.helper';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import logger from '../../helpers/logger.helper';

// ─── Owned Package Card ──────────────────────────────────────────────────────
const OwnedPackageCard = ({ clientPackage }) => {
  const pkg = clientPackage.package || {};
  const pkgName = pkg.name || 'Package';
  const status = clientPackage.status || 'active';
  const isActive = status === 'active';
  const isExpired = clientPackage.is_expired || false;

  const statusColor = isExpired ? colors.warning : isActive ? colors.success : colors.textTertiary;
  const statusBg = isExpired ? colors.warningLight : isActive ? colors.successLight : colors.borderLight;
  const statusLabel = isExpired ? 'Expired' : status.charAt(0).toUpperCase() + status.slice(1);

  const expiresAt = clientPackage.expires_at ? new Date(clientPackage.expires_at) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24))) : null;

  // Use pre-computed balance_summary from the API
  const balanceSummary = clientPackage.balance_summary || [];

  return (
    <>
      <View style={styles.ownedCard}>
        <View style={styles.ownedCardHeader}>
          <Text style={styles.ownedCardName}>{pkgName}</Text>
          <View style={[styles.ownedStatusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.ownedStatusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.ownedStatusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        {expiresAt && isActive && daysLeft !== null && (
          <View style={styles.ownedExpiryRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={daysLeft <= 7 ? colors.warning : colors.textTertiary}
            />
            <Text style={[
              styles.ownedExpiryText,
              daysLeft <= 7 && { color: colors.warning },
            ]}>
              {daysLeft === 0
                ? 'Expires today'
                : daysLeft === 1
                  ? 'Expires tomorrow'
                  : `Expires in ${daysLeft} days`}
            </Text>
          </View>
        )}
      </View>

      {balanceSummary.map((svc) => (
        <ServiceUsageCard
          key={svc.service_id}
          serviceName={svc.service_name || 'Service'}
          used={svc.used ?? 0}
          remaining={svc.remaining ?? null}
          total={svc.quantity ?? 0}
        />
      ))}
    </>
  );
};

// ─── Available Package Card ──────────────────────────────────────────────────
const PackageCard = ({ pkg, onSelect }) => {
  const services = pkg.package_services || [];
  const price = parseFloat(pkg.price) || 0;

  return (
    <View style={styles.packageCard}>
      <View style={styles.packageCardHeader}>
        <View style={styles.packageCardIcon}>
          <MaterialCommunityIcons name="package-variant" size={22} color={colors.accent} />
        </View>
        <Text style={styles.packageCardName}>{pkg.name}</Text>
      </View>

      {pkg.description ? (
        <Text style={styles.packageCardDescription}>{pkg.description}</Text>
      ) : null}

      <View style={styles.packageCardPriceRow}>
        <Text style={styles.packageCardPrice}>{formatCurrency(price)}</Text>
        <Text style={styles.packageCardPriceLabel}>one-time</Text>
      </View>

      {pkg.validity_days ? (
        <View style={styles.packageValidityRow}>
          <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textTertiary} />
          <Text style={styles.packageValidityText}>
            Valid for {pkg.validity_days} days after purchase
          </Text>
        </View>
      ) : null}

      {services.length > 0 && (
        <View style={styles.packageServicesSection}>
          <Text style={styles.packageServicesSectionTitle}>Included Services</Text>
          {services.map((ps, i) => (
            <View key={ps.id || i} style={styles.packageServiceRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.packageServiceText}>
                {ps.service?.name || `Service ${ps.service_id}`}
              </Text>
              <Text style={styles.packageServiceQty}>{ps.quantity}x</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.selectPackageButton}
        onPress={() => onSelect(pkg)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectPackageButtonText}>Purchase Package</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const PackageListScreen = ({ navigation }) => {
  const [packages, setPackages] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const [packagesResult, myPackagesResult] = await Promise.allSettled([
        getPackages(),
        getMyPackages(),
      ]);

      if (packagesResult.status === 'fulfilled') {
        const list = packagesResult.value;
        setPackages(Array.isArray(list) ? list : []);
      } else {
        logger.warn('Failed to load packages:', packagesResult.reason?.message);
        setPackages([]);
      }

      if (myPackagesResult.status === 'fulfilled') {
        const list = myPackagesResult.value;
        setMyPackages(Array.isArray(list) ? list : []);
      } else {
        // Non-fatal — user may not have any packages
        setMyPackages([]);
      }
    } catch (err) {
      logger.warn('Failed to load package data:', err?.message || err);
      setError('Failed to load packages.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleSelectPackage = useCallback(
    (pkg) => {
      navigation.navigate(SCREENS.PACKAGE_CHECKOUT, { package: pkg });
    },
    [navigation]
  );

  const activeOwned = myPackages.filter((cp) => cp.status === 'active');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Packages"
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData()} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Owned packages section */}
          {activeOwned.length > 0 && (
            <View style={styles.ownedSection}>
              <Text style={styles.ownedSectionTitle}>Your Packages</Text>
              {activeOwned.map((cp) => (
                <OwnedPackageCard key={cp.id} clientPackage={cp} />
              ))}
            </View>
          )}

          {/* Divider between owned and available */}
          {activeOwned.length > 0 && packages.length > 0 && (
            <View style={styles.sectionDivider}>
              <View style={styles.sectionDividerLine} />
              <Text style={styles.sectionDividerText}>Available Packages</Text>
              <View style={styles.sectionDividerLine} />
            </View>
          )}

          {/* Available packages for purchase */}
          {activeOwned.length === 0 && (
            <Text style={styles.introText}>
              Purchase a package to get bundled sessions at a great price.
            </Text>
          )}

          {packages.length > 0 ? (
            packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={handleSelectPackage}
              />
            ))
          ) : activeOwned.length === 0 ? (
            <EmptyState
              icon="package-variant"
              title="No Packages Available"
              message="There are no packages available for purchase at this time."
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PackageListScreen;
