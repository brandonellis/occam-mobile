export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  COACH: 'coach',
  CLIENT: 'client',
};

export const ADMIN_SHELL_ROLES = [ROLES.ADMIN, ROLES.OWNER];
export const COACH_ROLES = [...ADMIN_SHELL_ROLES, ROLES.COACH];

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'occam_auth_token',
  REFRESH_TOKEN: 'occam_refresh_token',
  USER_DATA: 'occam_user_data',
  TENANT_ID: 'occam_tenant_id',
  ACTIVE_ROLE: 'occam_active_role',
  COMPANY_DATA: 'occam_company_data',
  LAST_ORG: 'occam_last_org',
};
