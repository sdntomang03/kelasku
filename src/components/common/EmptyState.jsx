export default function EmptyState({ children = 'Belum ada data.' }) {
  return <div className="empty-state">{children}</div>
}
