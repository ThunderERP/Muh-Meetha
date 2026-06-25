'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, User, Lock, Briefcase } from 'lucide-react'
import { usersApi } from '@/lib/users-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { cn, initials, roleLabel } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

// Matches backend: password requires currentPassword (enforced server-side too)
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const setUser = useAuthStore((s) => s.setUser)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', jobTitle: user?.jobTitle ?? '' },
    })

  const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErrors, isSubmitting: pwdSubmitting } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const updateMutation = useMutation({
    mutationFn: (d: ProfileForm) => usersApi.updateMe(d),
    onSuccess: (updated) => { setUser(updated); toast.success('Profile updated successfully') },
    onError: (e) => toast.error((e as Error).message),
  })

  const passwordMutation = useMutation({
    // Matches backend UpdateMeDto: password + currentPassword fields
    mutationFn: (d: PasswordForm) => usersApi.updateMe({ currentPassword: d.currentPassword, password: d.newPassword }),
    onSuccess: () => { toast.success('Password changed successfully'); resetPwd() },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div>
      <PageHeader title="Profile & Account" subtitle="Manage your personal information and security settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="erp-card p-6 flex flex-col items-center text-center gap-3">
          <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{user ? initials(user.name) : '?'}</span>
          </div>
          <div><p className="text-lg font-bold text-text-primary">{user?.name}</p><p className="text-sm text-text-secondary">{user?.email}</p></div>
          <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-text-muted"><Briefcase size={12} /><span>{user?.role ? roleLabel(user.role) : '—'}</span></div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted"><User size={12} /><span>{tenant?.name}</span></div>
          </div>
          <div className="w-full pt-2 border-t border-border">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${user?.isActive ? 'bg-success-light text-success-text' : 'bg-danger-light text-danger-text'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive ? 'bg-success' : 'bg-danger'}`} />
              {user?.isActive ? 'Account Active' : 'Account Inactive'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="erp-card p-6">
            <div className="flex items-center gap-2 mb-5"><User size={16} className="text-primary-600" /><h2 className="text-base font-bold text-text-primary">Personal Information</h2></div>
            <form onSubmit={submitProfile((d) => updateMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="erp-label">Full Name *</label>
                  <input {...regProfile('name')} className={cn('erp-input', profileErrors.name && 'border-danger')} />
                  {profileErrors.name && <p className="mt-1 text-xs text-danger">{profileErrors.name.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Email Address *</label>
                  <input {...regProfile('email')} type="email" className={cn('erp-input', profileErrors.email && 'border-danger')} />
                  {profileErrors.email && <p className="mt-1 text-xs text-danger">{profileErrors.email.message}</p>}
                </div>
                <div><label className="erp-label">Phone Number</label><input {...regProfile('phone')} type="tel" placeholder="+91 98765 43210" className="erp-input" /></div>
                <div><label className="erp-label">Job Title</label><input {...regProfile('jobTitle')} placeholder="e.g. Inventory Manager" className="erp-input" /></div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updateMutation.isPending || profileSubmitting} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
                  {updateMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="erp-card p-6">
            <div className="flex items-center gap-2 mb-5"><Lock size={16} className="text-primary-600" /><h2 className="text-base font-bold text-text-primary">Change Password</h2></div>
            <form onSubmit={submitPwd((d) => passwordMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="erp-label">Current Password</label>
                <div className="relative">
                  <input {...regPwd('currentPassword')} type={showCurrent ? 'text' : 'password'} className={cn('erp-input pr-10', pwdErrors.currentPassword && 'border-danger')} />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-3 flex items-center text-text-muted">{showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {pwdErrors.currentPassword && <p className="mt-1 text-xs text-danger">{pwdErrors.currentPassword.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="erp-label">New Password</label>
                  <div className="relative">
                    <input {...regPwd('newPassword')} type={showNew ? 'text' : 'password'} className={cn('erp-input pr-10', pwdErrors.newPassword && 'border-danger')} />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-3 flex items-center text-text-muted">{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {pwdErrors.newPassword && <p className="mt-1 text-xs text-danger">{pwdErrors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="erp-label">Confirm New Password</label>
                  <div className="relative">
                    <input {...regPwd('confirmPassword')} type={showConfirm ? 'text' : 'password'} className={cn('erp-input pr-10', pwdErrors.confirmPassword && 'border-danger')} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-3 flex items-center text-text-muted">{showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {pwdErrors.confirmPassword && <p className="mt-1 text-xs text-danger">{pwdErrors.confirmPassword.message}</p>}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={passwordMutation.isPending || pwdSubmitting} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
                  {passwordMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
