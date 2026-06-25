'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Shield, Package } from 'lucide-react'
import { companyApi } from '@/lib/users-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn, formatDate, permissions } from '@/lib/utils'

// Matches backend UpdateTenantDto exactly
const companySchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  cin: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
})
type CompanyForm = z.infer<typeof companySchema>

const INDUSTRIES = ['Retail', 'Manufacturing', 'Distribution & Wholesale', 'Healthcare', 'Food & Beverage', 'Electronics', 'Apparel & Fashion', 'Construction', 'Automotive', 'Agriculture', 'Jewellery', 'Pharmaceuticals', 'Other']

export default function CompanyPage() {
  const setTenant = useAuthStore((s) => s.setTenant)
  const user = useAuthStore((s) => s.user)
  const canManage = user ? permissions.canManageCompany(user.role) : false

  const { data, isLoading } = useQuery({ queryKey: ['company'], queryFn: companyApi.get })
  const { data: modules } = useQuery({ queryKey: ['company-modules'], queryFn: companyApi.modules })
  const { data: subscription } = useQuery({ queryKey: ['company-subscription'], queryFn: companyApi.subscription })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    values: {
      name: data?.name ?? '', legalName: data?.legalName ?? '', phone: data?.phone ?? '',
      email: data?.email ?? '', website: data?.website ?? '', gstin: data?.gstin ?? '',
      pan: data?.pan ?? '', cin: data?.cin ?? '', industry: data?.industry ?? '',
      businessType: data?.businessType ?? '', country: data?.country ?? 'India',
      state: data?.state ?? '', city: data?.city ?? '', pincode: data?.pincode ?? '',
      address: data?.address ?? '', timezone: data?.timezone ?? 'Asia/Kolkata', currency: data?.currency ?? 'INR',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (d: CompanyForm) => companyApi.update(d),
    onSuccess: (updated) => { setTenant(updated); toast.success('Company details updated') },
    // Surfaces backend's "Only admins can update company details" ForbiddenException
    onError: (e) => toast.error((e as Error).message),
  })

  const planColor = (plan: string) => (plan === 'ENTERPRISE' ? 'success' : plan === 'GROWTH' ? 'info' : 'neutral')

  const MODULE_LABELS: Record<string, string> = {
    INVENTORY: 'Inventory', SALES: 'Sales', PURCHASE: 'Purchase', ACCOUNTING: 'Accounting',
    CRM: 'CRM', HRMS: 'HRMS', PAYROLL: 'Payroll', MANUFACTURING: 'Manufacturing', POS: 'POS',
    ASSET_MANAGEMENT: 'Asset Management', SERVICE_MANAGEMENT: 'Service Management',
    PROJECT_MANAGEMENT: 'Project Management', ANALYTICS: 'Analytics', COMPLIANCE: 'Compliance',
    WORKFLOW_AUTOMATION: 'Workflow Automation',
  }

  return (
    <div>
      <PageHeader title="Company Settings" subtitle="Manage your company information and subscription" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="erp-card p-5">
            <div className="flex items-center gap-2 mb-3"><Shield size={15} className="text-primary-600" /><h3 className="text-sm font-bold text-text-primary">Subscription</h3></div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Plan</span><StatusBadge label={data?.plan ?? 'STARTER'} variant={planColor(data?.plan ?? '')} /></div>
              <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Max Users</span><span className="text-xs font-semibold text-text-primary">{data?.maxUsers ?? subscription?.maxUsers ?? 10}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Storage</span><span className="text-xs font-semibold text-text-primary">{data?.storageQuotaMb ?? subscription?.storageMb ?? 500} MB</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Since</span><span className="text-xs font-semibold text-text-primary">{formatDate(subscription?.startsAt ?? data?.createdAt ?? '')}</span></div>
            </div>
          </div>

          <div className="erp-card p-5">
            <div className="flex items-center gap-2 mb-3"><Package size={15} className="text-primary-600" /><h3 className="text-sm font-bold text-text-primary">Activated Modules</h3></div>
            <div className="space-y-2">
              {modules?.length ? modules.map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{MODULE_LABELS[m.moduleKey] ?? m.moduleKey}</span>
                  <StatusBadge label={m.status === 'ACTIVE' ? 'Active' : m.status === 'TRIAL' ? 'Trial' : 'Inactive'} variant={m.status === 'ACTIVE' ? 'success' : m.status === 'TRIAL' ? 'info' : 'neutral'} dot={m.status === 'ACTIVE'} />
                </div>
              )) : <p className="text-sm text-text-muted">No modules activated yet</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="erp-card p-6">
            <div className="flex items-center gap-2 mb-5"><Building2 size={16} className="text-primary-600" /><h2 className="text-base font-bold text-text-primary">Company Information</h2></div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-text-muted">Loading company details…</div>
            ) : !canManage ? (
              <div className="space-y-3 text-sm text-text-secondary">
                <p>You don't have permission to edit company details. Contact a Business Owner or Manager.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="erp-label">Company Name</label><input {...register('name')} className={cn('erp-input', errors.name && 'border-danger')} /></div>
                  <div className="col-span-2"><label className="erp-label">Legal Name</label><input {...register('legalName')} className="erp-input" /></div>
                  <div><label className="erp-label">Company ID (Slug)</label><input value={data?.slug ?? ''} disabled className="erp-input bg-surface-subtle cursor-not-allowed font-mono text-text-muted" /><p className="text-2xs text-text-muted mt-1">Cannot be changed</p></div>
                  <div><label className="erp-label">Phone</label><input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="erp-input" /></div>
                  <div><label className="erp-label">Email</label><input {...register('email')} type="email" className="erp-input" /></div>
                  <div><label className="erp-label">Website</label><input {...register('website')} placeholder="https://yourcompany.com" className="erp-input" /></div>
                  <div><label className="erp-label">GSTIN</label><input {...register('gstin')} placeholder="27AADCB2230M1ZV" className="erp-input uppercase font-mono" /></div>
                  <div><label className="erp-label">PAN</label><input {...register('pan')} placeholder="AADCB2230M" className="erp-input uppercase font-mono" /></div>
                  <div><label className="erp-label">CIN</label><input {...register('cin')} className="erp-input uppercase font-mono" /></div>
                  <div>
                    <label className="erp-label">Industry</label>
                    <select {...register('industry')} className="erp-input"><option value="">Select industry</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select>
                  </div>
                  <div><label className="erp-label">City</label><input {...register('city')} className="erp-input" /></div>
                  <div><label className="erp-label">State</label><input {...register('state')} className="erp-input" /></div>
                  <div><label className="erp-label">Pincode</label><input {...register('pincode')} className="erp-input" /></div>
                  <div>
                    <label className="erp-label">Country</label>
                    <select {...register('country')} className="erp-input">
                      <option value="India">India</option><option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option><option value="Singapore">Singapore</option><option value="UAE">UAE</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Timezone</label>
                    <select {...register('timezone')} className="erp-input">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (ET)</option><option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className="erp-label">Address</label><textarea {...register('address')} rows={2} className="erp-input h-auto py-2 resize-none" /></div>
                </div>
                <div className="flex justify-end pt-3">
                  <button type="submit" disabled={updateMutation.isPending || isSubmitting} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
                    {updateMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Save Company Details
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
