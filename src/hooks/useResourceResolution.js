import { useState, useEffect } from 'react';
import { getResources } from '../services/bookings.api';
import logger from '../helpers/logger.helper';

/**
 * Auto-resolves a resource for services that require one (e.g. bays, simulators).
 * Mirrors TimeSlotSelectionScreen's resource pool logic: filter by type + location.
 *
 * Returns immediately with initialResource if one was provided or if the
 * service doesn't require a resource.
 */
const useResourceResolution = ({ initialResource, service, locationId }) => {
  const [selectedResource, setSelectedResource] = useState(initialResource || null);

  useEffect(() => {
    if (selectedResource?.id || !service?.requires_resource || !locationId) return;
    let cancelled = false;

    (async () => {
      try {
        const resp = await getResources();
        if (cancelled) return;
        const allResources = resp?.data || resp || [];

        const serviceTypeIds = service.resource_type_ids || [];

        const typeMatched = allResources.filter((r) => {
          if (r.status === 'inactive' || r.status === 'disabled') return false;
          if (serviceTypeIds.length > 0) {
            const rTypeIds = r.resource_type_ids || [];
            if (rTypeIds.length > 0 && !serviceTypeIds.some((id) => rTypeIds.includes(id))) return false;
          }
          return true;
        });

        // Prefer resources at the booking location
        const atLocation = typeMatched.filter((r) => {
          if (r.location_id === locationId) return true;
          if (Array.isArray(r.location_ids) && r.location_ids.includes(locationId)) return true;
          if (!r.location_id && !r.location_ids) return true;
          return false;
        });

        const filtered = atLocation.length > 0 ? atLocation : typeMatched;
        if (filtered.length > 0) {
          setSelectedResource({ id: filtered[0].id, name: filtered[0].name });
        }
      } catch (err) {
        logger.warn('Failed to auto-resolve resource for booking:', err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [service?.requires_resource, service?.resource_type_ids, locationId, selectedResource?.id]);

  return { selectedResource };
};

export default useResourceResolution;
