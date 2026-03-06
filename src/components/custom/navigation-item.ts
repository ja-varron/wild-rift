export interface NavigationItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}