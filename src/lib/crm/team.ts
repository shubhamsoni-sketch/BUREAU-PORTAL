export type CrmUserRole = 'Admin' | 'Manager' | 'DSA Agent' | 'Ops Executive' | 'Accounts';
export type CrmUserStatus = 'active' | 'inactive';

export type CrmPermissionKey =
  | 'dashboard'
  | 'lead_management'
  | 'eligibility_check'
  | 'lender_selection'
  | 'file_process'
  | 'lender_management'
  | 'team_management'
  | 'eligibility_credits'
  | 'reports';

export type CrmTeamMember = {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  mobile: string;
  role: CrmUserRole;
  zone: string;
  leadsAssigned: number;
  leadsConverted: number;
  joinedDate: string;
  status: CrmUserStatus;
  avatar: string;
  permissions: CrmPermissionKey[];
  loginEnabled?: boolean;
  credentialsGeneratedAt?: string;
};

export const crmPermissionLabels: Record<CrmPermissionKey, string> = {
  dashboard: 'Dashboard',
  lead_management: 'Lead Management',
  eligibility_check: 'Eligibility Checker',
  lender_selection: 'Lender Selection',
  file_process: 'File Process',
  lender_management: 'Lender Management',
  team_management: 'Team Management',
  eligibility_credits: 'Eligibility Credits',
  reports: 'Reports & Analytics',
};

export const rolePermissions: Record<CrmUserRole, CrmPermissionKey[]> = {
  Admin: [
    'dashboard',
    'lead_management',
    'eligibility_check',
    'lender_selection',
    'file_process',
    'lender_management',
    'team_management',
    'eligibility_credits',
    'reports',
  ],
  Manager: [
    'dashboard',
    'lead_management',
    'eligibility_check',
    'lender_selection',
    'file_process',
    'lender_management',
    'reports',
  ],
  'DSA Agent': ['dashboard', 'lead_management', 'eligibility_check', 'lender_selection'],
  'Ops Executive': ['dashboard', 'file_process', 'lender_selection'],
  Accounts: ['dashboard', 'eligibility_credits', 'reports'],
};

const roles = Object.keys(rolePermissions) as CrmUserRole[];
const statuses: CrmUserStatus[] = ['active', 'inactive'];

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function normalizeRole(value: unknown): CrmUserRole {
  const role = text(value);
  return roles.includes(role as CrmUserRole) ? (role as CrmUserRole) : 'DSA Agent';
}

export function normalizePermissions(
  value: unknown,
  role: CrmUserRole
): CrmPermissionKey[] {
  const allowed = new Set(Object.keys(crmPermissionLabels) as CrmPermissionKey[]);
  if (!Array.isArray(value)) return rolePermissions[role];
  const permissions = value
    .map((permission) => text(permission))
    .filter((permission): permission is CrmPermissionKey =>
      allowed.has(permission as CrmPermissionKey)
    );
  return permissions.length ? permissions : rolePermissions[role];
}

export const defaultCrmTeam: CrmTeamMember[] = [
  {
    id: 'usr-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@credittrust.in',
    mobile: '9876543210',
    role: 'Admin',
    zone: 'HQ - Mumbai',
    leadsAssigned: 0,
    leadsConverted: 0,
    joinedDate: '01 Jan 2024',
    status: 'active',
    avatar: 'RK',
    permissions: rolePermissions.Admin,
  },
  {
    id: 'usr-002',
    name: 'Sunita Rao',
    email: 'sunita.r@credittrust.in',
    mobile: '9765432109',
    role: 'Manager',
    zone: 'Bangalore HSR',
    leadsAssigned: 42,
    leadsConverted: 31,
    joinedDate: '15 Mar 2024',
    status: 'active',
    avatar: 'SR',
    permissions: rolePermissions.Manager,
  },
  {
    id: 'usr-003',
    name: 'Priya Sharma',
    email: 'priya.s@credittrust.in',
    mobile: '9654321098',
    role: 'DSA Agent',
    zone: 'Mumbai Central',
    leadsAssigned: 38,
    leadsConverted: 24,
    joinedDate: '10 Apr 2024',
    status: 'active',
    avatar: 'PS',
    permissions: rolePermissions['DSA Agent'],
  },
  {
    id: 'usr-004',
    name: 'Anil Mehta',
    email: 'anil.m@credittrust.in',
    mobile: '9543210987',
    role: 'DSA Agent',
    zone: 'Pune West',
    leadsAssigned: 29,
    leadsConverted: 18,
    joinedDate: '20 May 2024',
    status: 'active',
    avatar: 'AM',
    permissions: rolePermissions['DSA Agent'],
  },
  {
    id: 'usr-005',
    name: 'Kavitha Nair',
    email: 'kavitha.n@credittrust.in',
    mobile: '9321098765',
    role: 'Ops Executive',
    zone: 'Chennai Adyar',
    leadsAssigned: 27,
    leadsConverted: 15,
    joinedDate: '12 Jul 2024',
    status: 'active',
    avatar: 'KN',
    permissions: rolePermissions['Ops Executive'],
  },
  {
    id: 'usr-006',
    name: 'Nitin Shah',
    email: 'accounts@credittrust.in',
    mobile: '9210987654',
    role: 'Accounts',
    zone: 'HQ - Finance',
    leadsAssigned: 0,
    leadsConverted: 0,
    joinedDate: '01 Aug 2024',
    status: 'active',
    avatar: 'NS',
    permissions: rolePermissions.Accounts,
  },
];

export function normalizeTeam(value: unknown): CrmTeamMember[] {
  if (!Array.isArray(value)) return defaultCrmTeam;
  const team = value
    .filter((item): item is Partial<CrmTeamMember> => Boolean(item && typeof item === 'object'))
    .map((member): CrmTeamMember => {
      const role = normalizeRole(member.role);
      const status = text(member.status) as CrmUserStatus;
      const name = text(member.name);
      return {
        id: text(member.id) || `usr-${Date.now()}`,
        authUserId: text(member.authUserId) || undefined,
        name,
        email: text(member.email),
        mobile: text(member.mobile).replace(/\D/g, '').slice(-10),
        role,
        zone: text(member.zone),
        leadsAssigned: Number(member.leadsAssigned || 0),
        leadsConverted: Number(member.leadsConverted || 0),
        joinedDate: text(member.joinedDate) || new Date().toLocaleDateString('en-IN'),
        status: statuses.includes(status) ? status : 'active',
        avatar: text(member.avatar) || initials(name),
        permissions: normalizePermissions(member.permissions, role),
        loginEnabled: member.loginEnabled !== false,
        credentialsGeneratedAt: text(member.credentialsGeneratedAt) || undefined,
      };
    })
    .filter((member) => member.name && member.email);
  return team;
}
