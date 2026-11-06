import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin('/admin');
  return <>{children}</>;
}
