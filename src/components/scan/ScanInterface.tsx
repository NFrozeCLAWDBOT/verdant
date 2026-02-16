import { useState } from 'react'
import { motion } from 'framer-motion'
import { OfflineTab } from './OfflineTab'
import { OnlineTab } from './OnlineTab'
import type { AWSSnapshot } from '@/types/scan'

interface ScanInterfaceProps {
  onScanComplete: (snapshot: AWSSnapshot, region: string) => void
  isScanning: boolean
  setIsScanning: (v: boolean) => void
}

export function ScanInterface({ onScanComplete, isScanning, setIsScanning }: ScanInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline')

  return (
    <motion.section
      id="scan-interface"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-8">
          Scan Your Environment
        </h2>

        <div className="glass-panel overflow-hidden">
          <div className="flex border-b border-emerald-vivid/15">
            <button
              onClick={() => setActiveTab('offline')}
              className={`flex-1 py-4 px-6 font-heading font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'offline'
                  ? 'text-emerald-vivid border-b-2 border-emerald-vivid bg-emerald-vivid/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Offline Mode
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 py-4 px-6 font-heading font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'online'
                  ? 'text-emerald-vivid border-b-2 border-emerald-vivid bg-emerald-vivid/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Online Mode
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'offline' ? (
              <OfflineTab onScanComplete={onScanComplete} />
            ) : (
              <OnlineTab
                onScanComplete={onScanComplete}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
              />
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
