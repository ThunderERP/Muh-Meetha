'use client'


import { useUrlSearch } from '@/hooks/use-url-search'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { suppliersApi } from '@/lib/inventory-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Drawer } from '@/components/shared/drawer'
import { Modal } from '@/components/shared/modal'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { cn, permissions, formatDate, initials } from '@/lib/utils'
import { Supplier } from '@/types'

// Matches CreateSupplierDto exactly
const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(255),
  code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
})
type SupplierForm = z.infer<typeof supplierSchema>

export default function SuppliersPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canWrite = user ? permissions.canWriteInventory(user.role) : false

  const [search, setSearch] = useUrlSearch()
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawer] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => suppliersApi.list({ page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: (d: SupplierForm) => suppliersApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier added'); closeDrawer() },
    onError: (e) => toast.error((e as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierForm }) => suppliersApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier updated'); closeDrawer() },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier removed'); setDeleting(null) },
    onError: (e) => toast.error((e as Error).message),
  })

  const openCreate = () => { setEditing(null); reset({}); setDrawer(true) }
  const openEdit = (s: Supplier) => {
    setEditing(s)
    reset({ name: s.name, code: s.code ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', city: s.city ?? '', state: s.state ?? '', pincode: s.pincode ?? '', gstin: s.gstin ?? '' })
    setDrawer(true)
  }
  const closeDrawer = () => { setDrawer(false); setEditing(null) }
  const onSubmit = (d: SupplierForm) => editing ? updateMutation.mutate({ id: editing.id, data: d }) : createMutation.mutate(d)

  const suppliers = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${meta?.total ?? 0} suppliers on record`}
        actions={canWrite ? <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"><Plus size={15} /> Add Supplier</button> : null}
      />

      <div className="erp-card px-4 py-3 mb-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search suppliers…" className="erp-input pl-8 h-8 text-sm" />
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>Supplier</th><th>Contact</th><th>Email</th><th>GSTIN</th><th>City</th><th>Status</th><th>Added</th>{canWrite && <th>Actions</th>}</tr></thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={canWrite ? 8 : 7} />
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={99} className="border-0 py-0">
                  <EmptyState icon={<Users size={24} />} title="No suppliers yet" description="Add your first supplier to start tracking purchases"
                    action={canWrite ? <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg"><Plus size={14} /> Add Supplier</button> : undefined} />
                </td></tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-primary-700 text-xs font-bold">{initials(s.name)}</span></div>
                        <span className="font-semibold text-text-primary">{s.name}</span>
                      </div>
                    </td>
                    <td>{s.phone ? <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600"><Phone size={12} /> {s.phone}</a> : '—'}</td>
                    <td>{s.email ? <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600"><Mail size={12} /> {s.email}</a> : '—'}</td>
                    <td><span className="font-mono text-xs text-text-muted">{s.gstin ?? '—'}</span></td>
                    <td className="text-sm text-text-secondary">{s.city ?? '—'}</td>
                    <td><StatusBadge label={s.isActive ? 'Active' : 'Inactive'} variant={s.isActive ? 'success' : 'neutral'} dot /></td>
                    <td className="text-xs text-text-muted">{formatDate(s.createdAt)}</td>
                    {canWrite && (
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => setDeleting(s)} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger-light transition-colors"><Trash2 size={13} /></button>
                        </div>
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
        onClose={closeDrawer}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        width="w-[480px]"
        footer={
          <>
            <button onClick={closeDrawer} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
              {(createMutation.isPending || updateMutation.isPending) && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Add Supplier'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="erp-label">Supplier Name *</label>
            <input {...register('name')} placeholder="e.g. ABC Traders" className={cn('erp-input', errors.name && 'border-danger')} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="erp-label">Supplier Code</label>
            <input {...register('code')} placeholder="e.g. SUP-001" className="erp-input font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="erp-label">Phone</label><input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="erp-input" /></div>
            <div>
              <label className="erp-label">Email</label>
              <input {...register('email')} type="email" placeholder="supplier@email.com" className={cn('erp-input', errors.email && 'border-danger')} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="erp-label">City</label><input {...register('city')} className="erp-input" /></div>
            <div><label className="erp-label">State</label><input {...register('state')} className="erp-input" /></div>
            <div><label className="erp-label">Pincode</label><input {...register('pincode')} className="erp-input" /></div>
          </div>
          <div><label className="erp-label">GSTIN</label><input {...register('gstin')} placeholder="27AADCB2230M1ZV" className="erp-input uppercase font-mono" /></div>
          <div><label className="erp-label">Address</label><textarea {...register('address')} rows={3} placeholder="Full address…" className="erp-input h-auto py-2 resize-none" /></div>
        </form>
      </Drawer>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove Supplier"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleting(null)} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle">Cancel</button>
            <button onClick={() => deleting && deleteMutation.mutate(deleting.id)} disabled={deleteMutation.isPending} className="h-9 px-4 text-sm bg-danger text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-70">
              {deleteMutation.isPending ? 'Removing…' : 'Remove Supplier'}
            </button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">Remove <span className="font-semibold text-text-primary">{deleting?.name}</span> from your supplier list? This deactivates them — existing purchase history is retained.</p>
      </Modal>
    </div>
  )
}
