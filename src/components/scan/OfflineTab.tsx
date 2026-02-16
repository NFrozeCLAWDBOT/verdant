import { useState, useCallback } from 'react'
import { Upload, Download, FileJson } from 'lucide-react'
import type { AWSSnapshot } from '@/types/scan'

interface OfflineTabProps {
  onScanComplete: (snapshot: AWSSnapshot, region: string) => void
}

export function OfflineTab({ onScanComplete }: OfflineTabProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        if (json.snapshot) {
          onScanComplete(json.snapshot, json.region || 'eu-west-2')
        } else if (json.account_id) {
          onScanComplete(json, 'eu-west-2')
        } else {
          setError('Invalid JSON format. Expected a Verdant scan snapshot.')
          setFileName(null)
        }
      } catch {
        setError('Failed to parse JSON file.')
        setFileName(null)
      }
    }
    reader.readAsText(file)
  }, [onScanComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm font-body">
        Download the scan script, run it locally, then upload the JSON output. Your credentials never leave your machine.
      </p>

      <a
        href="/scripts/verdant-scan.sh"
        download
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-vivid/30 text-emerald-vivid font-heading font-semibold text-sm hover:bg-emerald-vivid/10 transition-all duration-200"
      >
        <Download className="h-4 w-4" />
        Download Script
      </a>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-emerald-vivid bg-emerald-vivid/5 shadow-[0_0_20px_rgba(78,197,78,0.2)]'
            : 'border-emerald-vivid/20 hover:border-emerald-vivid/40'
        }`}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {fileName ? (
          <>
            <FileJson className="h-10 w-10 text-emerald-vivid mb-3" />
            <p className="text-foreground font-medium">{fileName}</p>
            <p className="text-muted-foreground text-sm mt-1">File loaded successfully</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Drop your JSON snapshot here</p>
            <p className="text-muted-foreground text-sm mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-danger text-sm font-body">{error}</p>
      )}
    </div>
  )
}
