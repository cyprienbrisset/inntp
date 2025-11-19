import { Type as type, LucideIcon } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description: string
  icon: LucideIcon
  children: React.ReactNode
}

export function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
