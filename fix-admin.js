const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/(admin)/dashboard/components/AuthStats.tsx',
  'src/app/(admin)/dashboard/components/RecentAuditLogs.tsx',
  'src/app/(admin)/dashboard/components/RecentSecurityEvents.tsx',
  'src/app/(admin)/audit-logs/components/AuditLogsList.tsx',
  'src/app/(admin)/security-events/components/SecurityEventsList.tsx',
  'src/app/(admin)/users/components/UsersList.tsx',
  'src/app/(admin)/clients/components/ClientsList.tsx',
  'src/app/(admin)/roles/components/RolesList.tsx'
];

for (const f of filesToFix) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (!content.includes('useAuth')) {
    content = content.replace(/(import .* from 'react'.*\n)/, "$1import { useAuth } from '@/hooks/useAuth'\nimport { apiClient } from '@/lib/apiClient'\n");
    changed = true;
  }

  // Inject const { accessToken } = useAuth() right after component declaration
  const compMatch = content.match(/const [A-Z][a-zA-Z0-9]+ = \([^\)]*\) => {/);
  if (compMatch && !content.includes('const { accessToken } = useAuth()')) {
    content = content.replace(compMatch[0], compMatch[0] + "\n  const { accessToken } = useAuth()");
    changed = true;
  }

  // Add accessToken to dependency arrays if it's not there
  if (content.includes('useEffect(() => {') && content.includes('}, [])')) {
    content = content.replace(/}, \[\]\)/g, '}, [accessToken])');
    changed = true;
  }

  // Replace fetch logic
  content = content.replace(/const res = await fetch\('([^']+)'\)/g, "if (!accessToken) return;\n        const res: any = await apiClient(accessToken).get('$1')");
  content = content.replace(/if \(!res\.ok\) throw new Error\('Failed to fetch'\)/g, "");
  content = content.replace(/const data = await res\.json\(\)/g, "const data = res");
  
  // Fix the fallback messages
  content = content.replace(/Failed to load [^.]+ TODO: Implement [^.]+ endpoint./g, "Failed to load data.");

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
}
