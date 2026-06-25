'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatFileSize, isImageFile } from '@/lib/utils'
import { useSignedUrl } from '@/hooks/use-signed-url'

const MAX_SIZE = 5 * 1024 * 1024 // matches backend MAX_SIZE_BYTES

interface ImageUploadProps {
  /**
   * The storageKey persisted on the entity (e.g. product.imageUrl).
   * This is NOT a URL — the component resolves it to a signed URL internally.
   * Pass null/undefined when no image is set.
   */
  value?: string | null
  onChange: (storageKey: string | null) => void
  /**
   * If productId is undefined, the product doesn't exist yet — backend requires
   * entityId for upload, so we stage the file locally and upload after create.
   */
  productId?: number
  /**
   * Called when a file is ready to upload (productId is set).
   * Must return the storageKey from the upload response.
   */
  onUpload?: (file: File) => Promise<string>
  onStageFile?: (file: File | null) => void
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  productId,
  onUpload,
  onStageFile,
  label = 'Product Image',
}: ImageUploadProps) {
  const [uploading, setUploading]   = useState(false)
  const [dragging, setDragging]     = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resolve the persisted storageKey to a signed URL.
  // Returns null while loading or if value is null — we fall back to localPreview.
  const { signedUrl, isLoading: signingLoading } = useSignedUrl(value)

  const handleFile = async (file: File) => {
    if (!isImageFile(file)) {
      toast.error('Only JPEG, PNG, WebP or GIF images are allowed')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Max ${formatFileSize(MAX_SIZE)}`)
      return
    }

    if (!productId) {
      // No product yet — stage locally, show preview, upload happens after create
      const objectUrl = URL.createObjectURL(file)
      setLocalPreview(objectUrl)
      onStageFile?.(file)
      toast.info('Image will be uploaded after the product is saved')
      return
    }

    if (!onUpload) return
    setUploading(true)
    try {
      const storageKey = await onUpload(file)
      // Clear local preview; value (storageKey) will be set and signed URL resolved
      setLocalPreview(null)
      onChange(storageKey)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    onChange(null)
    setLocalPreview(null)
    onStageFile?.(null)
  }

  // Show local blob preview while staging (new product not yet saved),
  // or the resolved signed URL once a storageKey is set.
  const displayUrl = localPreview || signedUrl

  return (
    <div className="space-y-1.5">
      <label className="erp-label">{label}</label>

      {displayUrl ? (
        <div className="relative w-full h-40 rounded-xl border border-border overflow-hidden group bg-surface-muted">
          <Image
            src={displayUrl}
            alt="Product"
            fill
            className="object-contain p-2"
            // Signed URLs are external (S3) — disable Next.js optimisation
            unoptimized
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-light"
          >
            <X size={13} className="text-danger" />
          </button>
        </div>
      ) : value && signingLoading ? (
        // storageKey is set but signed URL hasn't resolved yet
        <div className="w-full h-40 rounded-xl border border-border flex items-center justify-center bg-surface-muted">
          <Loader2 size={20} className="text-text-muted animate-spin" />
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            dragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-border hover:border-primary-400 hover:bg-surface-subtle',
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="text-primary-500 animate-spin" />
              <p className="text-xs text-text-muted">Uploading…</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-surface-subtle rounded-xl flex items-center justify-center">
                <ImageIcon size={18} className="text-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-text-primary">
                  Drop image here or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-2xs text-text-muted mt-0.5">JPG, PNG, WebP — max 5 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
