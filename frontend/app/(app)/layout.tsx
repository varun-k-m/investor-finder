export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Protected layout with sidebar — auth guard wired in S1-002 */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
