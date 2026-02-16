import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function SessionToken({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 glass-panel px-4 py-2.5 rounded-lg">
      <span className="text-xs text-muted-foreground font-body">Session:</span>
      <code className="text-xs text-emerald-vivid font-mono">{token}</code>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="Copy session token"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-vivid" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
