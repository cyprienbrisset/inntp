'use client'

import { Search, Filter, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmailFiltersProps {
  onSearch: (value: string) => void
  onStatusChange: (value: string) => void
  onExport: () => void
}

export function EmailFilters({ onSearch, onStatusChange, onExport }: EmailFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-3 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par expéditeur, destinataire ou sujet..."
            className="pl-10"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={onStatusChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyés</SelectItem>
            <SelectItem value="failed">Échecs</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="queued">En file</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Exporter
      </Button>
    </div>
  )
}
