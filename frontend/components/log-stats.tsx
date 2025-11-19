import { AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react'

interface LogStatsProps {
  stats: {
    info: number
    warning: number
    error: number
    debug: number
  }
}

export function LogStats({ stats }: LogStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.info}</p>
            <p className="text-xs text-muted-foreground">Info</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.warning}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.error}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Bug className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.debug}</p>
            <p className="text-xs text-muted-foreground">Debug</p>
          </div>
        </div>
      </div>
    </div>
  )
}
