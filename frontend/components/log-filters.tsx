'use client'

import { Search, Download, RefreshCw, Pause, Play } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LogFiltersProps {
  onSearch: (value: string) => void
  onLevelChange: (value: string) => void
  onExport: () => void
  isAutoRefresh: boolean
  onToggleAutoRefresh: () => void
  onManualRefresh: () => void
}

export function LogFilters({
  onSearch,
  onLevelChange,
  onExport,
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
}: LogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-3 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les logs..."
            className="pl-10"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={onLevelChange} defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAutoRefresh}
          className={isAutoRefresh ? 'bg-primary/10 border-primary/50' : ''}
        >
          {isAutoRefresh ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Auto
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" onClick={onManualRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>

        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  )
}
