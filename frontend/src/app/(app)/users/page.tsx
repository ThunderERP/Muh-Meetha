'use client'

import { useUrlSearch } from '@/hooks/use-url-search'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, UserX, UserCheck, Users, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { usersApi } from '@/lib/users-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Drawer } from '@/components/shared/drawer'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { cn, initials, roleLabel, formatDate, permissions } from '@/lib/utils'
import { CREATABLE_ROLES } from '@/types'

// Matches backend CreateUserDto exactly — role @IsIn excludes DEVELOPER_ADMIN
const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
})
type CreateUserForm = z.infer<typeof createUserSchema>

export default function UsersPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const canManage = user ? permissions.canManageUsers(user.role) : false

  const [search, setSearch] = useUrlSearch()
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawer] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'INVENTORY_MANAGER' },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User created successfully'); setDrawer(false); reset() },
    // Surfaces backend's max-users-per-plan message directly
    onError: (e) => toast.error((e as Error).message),
  })

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated') },
    onError: (e) => toast.error((e as Error).message),
  })

  const activateMutation = useMutation({
    mutationFn: usersApi.activate,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User reactivated') },
    onError: (e) => toast.error((e as Error).message),
  })

  const users = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${meta?.total ?? 0} of ${tenant?.maxUsers ?? '—'} user seats used`}
        actions={canManage ? <button onClick={() => { reset(); setDrawer(true) }} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"><Plus size={15} /> Create User</button> : null}
      />

      <div className="erp-card px-4 py-3 mb-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search users…" className="erp-input pl-8 h-8 text-sm" />
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Job Title</th><th>Status</th><th>Joined</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={canManage ? 7 : 6} />
              ) : users.length === 0 ? (
                <tr><td colSpan={99} className="border-0 py-0">
                  <EmptyState icon={<Users size={24} />} title="No users found" description="Create the first user for your workspace"
                    action={canManage ? <button onClick={() => { reset(); setDrawer(true) }} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg"><Plus size={14} /> Create User</button> : undefined} />
                </td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-primary-700 text-xs font-bold">{initials(u.name)}</span></div>
                        <div><p className="font-semibold text-text-primary">{u.name}</p>{u.phone && <p className="text-xs text-text-muted">{u.phone}</p>}</div>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">{u.email}</td>
                    <td><span className="badge-neutral">{roleLabel(u.role)}</span></td>
                    <td className="text-sm text-text-secondary">{u.jobTitle ?? '—'}</td>
                    <td><StatusBadge label={u.isActive ? 'Active' : 'Inactive'} variant={u.isActive ? 'success' : 'neutral'} dot /></td>
                    <td className="text-xs text-text-muted">{formatDate(u.createdAt)}</td>
                    {canManage && (
                      <td>
                        {u.id !== user?.id && (
                          u.isActive ? (
                            <button onClick={() => deactivateMutation.mutate(u.id)} disabled={deactivateMutation.isPending} className="flex items-center gap-1 h-7 px-2.5 text-xs text-danger font-medium border border-danger/30 rounded-md hover:bg-danger-light transition-colors"><UserX size={12} /> Deactivate</button>
                          ) : (
                            <button onClick={() => activateMutation.mutate(u.id)} disabled={activateMutation.isPending} className="flex items-center gap-1 h-7 px-2.5 text-xs text-success font-medium border border-success/30 rounded-md hover:bg-success-light transition-colors"><UserCheck size={12} /> Activate</button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPageChange={setPage} />}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawer(false); reset() }}
        title="Create New User"
        subtitle="Add a user to your ThunderERP workspace"
        width="w-[480px]"
        footer={
          <>
            <button onClick={() => { setDrawer(false); reset() }} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle">Cancel</button>
            <button onClick={handleSubmit((d) => createMutation.mutate(d))} disabled={createMutation.isPending || isSubmitting} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
              {createMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create User
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="erp-label">Full Name *</label>
              <input {...register('name')} placeholder="e.g. Priya Sharma" className={cn('erp-input', errors.name && 'border-danger')} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="erp-label">Work Email *</label>
              <input {...register('email')} type="email" placeholder="priya@company.com" className={cn('erp-input', errors.email && 'border-danger')} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="erp-label">Password *</label>
              <div className="relative">
                <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" className={cn('erp-input pr-10', errors.password && 'border-danger')} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-text-muted">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="erp-label">Role *</label>
              <select {...register('role')} className={cn('erp-input', errors.role && 'border-danger')}>
                {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
            </div>
            <div><label className="erp-label">Phone</label><input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="erp-input" /></div>
            <div><label className="erp-label">Job Title</label><input {...register('jobTitle')} placeholder="e.g. Inventory Manager" className="erp-input" /></div>
          </div>
          <div className="bg-surface-muted rounded-xl p-4 text-xs text-text-secondary">
            The user will log in using your company ID <span className="font-semibold text-text-primary">({tenant?.slug})</span>, their email, and the password you set above.
          </div>
        </form>
      </Drawer>
    </div>
  )
}
