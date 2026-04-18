import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/MainLayout';

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['founder']}>
      <MainLayout>
        <div className="p-6 h-full flex flex-col">{children}</div>
      </MainLayout>
    </ProtectedRoute>
  );
}

