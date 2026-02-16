import { StatusIcon } from '@/components/common/StatusIcon'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import type { CheckResult } from '@/types/scan'

export function FindingItem({ result }: { result: CheckResult }) {
  const { check, status, detail } = result

  return (
    <div className="py-4 border-b border-emerald-vivid/10 last:border-0">
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-muted-foreground font-mono">{check.id}</span>
            <span className="text-foreground font-medium text-sm">{check.title}</span>
            <SeverityBadge severity={check.severity} />
          </div>
          <p className="text-sm text-muted-foreground mb-2">{detail}</p>

          {status !== 'pass' && (
            <div className="mt-3 p-3 rounded-lg bg-background/50 border border-emerald-vivid/10">
              <p className="text-xs font-semibold text-foreground mb-1.5">Remediation</p>
              <p className="text-xs text-muted-foreground mb-2">{check.remediation.description}</p>
              {check.remediation.command && (
                <pre className="text-xs bg-[#0A0F0A] p-2 rounded font-mono text-emerald-vivid overflow-x-auto">
                  {check.remediation.command}
                </pre>
              )}
              {check.remediation.consoleSteps && (
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
                  {check.remediation.consoleSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
