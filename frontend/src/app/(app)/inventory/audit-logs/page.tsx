'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Filter, ShieldAlert } from 'lucide-react'
import { auditLogsApi } from '@/lib/inventory-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, permissions } from '@/lib/utils'

const ACTION_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'danger', LOGIN: 'info',
  EXPORT: 'neutral', ACTIVATE: 'success', DEACTIVATE: 'danger',
}

export default function AuditLogsPage() {
  const user = useAuthStore((s) => s.user)
  const [page, setPage] = useState(1)
  const [module, setModule] = useState('')

  // Backend AuditLogsController restricts to DEVELOPER_ADMIN, BUSINESS_OWNER, MANAGER, FINANCE_MANAGER
  const canView = user ? permissions.canViewAuditLogs(user.role) : false

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, module],
    queryFn: () => auditLogsApi.list({ page, limit: 30, module: module || undefined }),
    placeholderData: (prev) => prev,
    enabled: canView,
  })

  if (!canView) {
    return (
      <div>
        <PageHeader title="Audit Logs" subtitle="Immutable record of all system actions" />
        <EmptyState icon={<ShieldAlert size={24} />} title="Access restricted" description="Audit logs are visible to admins, managers, and finance managers only." />
      </div>
    )
  }

  const logs = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable record of all system actions" />

      <div className="erp-card px-4 py-3 mb-4 flex items-center gap-3">
        <Filter size={14} className="text-text-muted" />
        <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1) }} className="erp-input h-8 text-sm w-44">
          <option value="">All Modules</option>
          <option value="inventory">Inventory</option>
          <option value="auth">Authentication</option>
          <option value="company">Company</option>
        </select>
        <div className="ml-auto text-xs text-text-muted">{meta ? `${meta.total} records` : ''}</div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Entity</th><th>Ref #</th><th>IP Address</th></tr></thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={10} cols={7} />
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="border-0 py-0"><EmptyState icon={<ClipboardList size={24} />} title="No audit logs" description="System activity will be recorded here" /></td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-text-muted whitespace-nowrap">{formatDate(log.createdAt, 'datetime')}</td>
                    <td><p className="text-sm font-semibold text-text-primary">{log.user?.name ?? `User #${log.userId}`}</p><p className="text-xs text-text-muted">{log.user?.email}</p></td>
                    <td><StatusBadge label={log.action} variant={ACTION_COLORS[log.action] ?? 'neutral'} /></td>
                    <td><span className="badge-neutral capitalize">{log.module}</span></td>
                    <td className="text-sm text-text-secondary capitalize">{log.entityType}</td>
                    <td className="text-xs font-mono text-text-muted">{log.entityId ? `#${log.entityId}` : '—'}</td>
                    <td className="text-xs font-mono text-text-muted">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={30} onPageChange={setPage} />}
      </div>
    </div>
  )
}
