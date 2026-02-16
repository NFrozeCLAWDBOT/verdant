import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { CheckStatus } from '@/types/scan'

export function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="h-5 w-5 text-emerald-vivid flex-shrink-0" />
    case 'fail':
      return <XCircle className="h-5 w-5 text-danger flex-shrink-0" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
  }
}
