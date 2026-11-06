import { requireResident } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireResident('/dashboard');
  return <>{children}</>;
}
