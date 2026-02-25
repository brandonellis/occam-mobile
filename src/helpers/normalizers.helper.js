// Shared normalizers for payload shaping

// Helper: treat 'group' exactly like 'class' in all flows
export const isClassLike = (service) => {
  const type = String(service?.service_type || '').toLowerCase();
  return type === 'class' || type === 'group';
};
