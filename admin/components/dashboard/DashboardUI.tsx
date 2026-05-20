'use client'

/* ── KPI Card ── */
interface KpiProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'flat'
  sub?: string
}
export function KpiCard({ label, value, trend, sub }: KpiProps) {
  return (
    <div className="sa-kpi">
      <div className="sa-kpi-val">{value}</div>
      <div className="sa-kpi-lbl">{label}</div>
      {sub && <div className="sa-kpi-sub">{sub}</div>}
      {trend === 'up' && <div className="sa-kpi-trend up">↑</div>}
    </div>
  )
}

/* ── Page header ── */
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="sa-page-header">
      <div>
        <div className="sa-page-title">{title}</div>
        {subtitle && <div className="sa-page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="sa-page-actions">{actions}</div>}
    </div>
  )
}

/* ── Search bar ── */
interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }: SearchBarProps) {
  return (
    <div className="sa-filter-bar">
      <div className="sa-filter-search">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

/* ── Status chip ── */
export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: 'live', upcoming: 'warn', past: 'muted',
  }
  return <span className={`sa-chip ${map[status] ?? ''}`}>{status}</span>
}

/* ── Module chip ── */
export function ModuleChip({ module }: { module: string }) {
  const map: Record<string, string> = {
    tombola: '🎟️', quiz: '🧠', quizmaster: '🎮', quizsolo: '⏱️', spin: '🎡', vote: '⭐',
  }
  return <span className="sa-chip purple">{map[module] ?? '🎮'} {module}</span>
}

/* ── Empty state ── */
export function EmptyState({ icon = '🔍', title = 'Aucun résultat', desc = '' }: { icon?: string; title?: string; desc?: string }) {
  return (
    <div className="sa-empty">
      <div className="sa-empty-icon">{icon}</div>
      <div className="sa-empty-title">{title}</div>
      {desc && <div className="sa-empty-desc">{desc}</div>}
    </div>
  )
}

/* ── Drawer tabs ── */
interface Tab { id: string; label: string; badge?: number }
interface DrawerTabsProps {
  tabs: Tab[]
  active: string
  onSelect: (id: string) => void
}
export function DrawerTabs({ tabs, active, onSelect }: DrawerTabsProps) {
  return (
    <div className="sa-drawer-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`sa-drawer-tab${active === t.id ? ' active' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
          {t.badge !== undefined && t.badge > 0 && (
            <span className="sa-tab-badge">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Field row (lecture) ── */
export function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sa-field-row">
      <div className="sa-field-label">{label}</div>
      <div className="sa-field-value">{value ?? '-'}</div>
    </div>
  )
}

/* ── Section header ── */
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="sa-section-h">{children}</div>
}
