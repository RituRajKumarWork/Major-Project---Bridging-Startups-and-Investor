import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/MainLayout';

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['investor']}>
      <MainLayout>
        <div className="p-6">{children}</div>
      </MainLayout>
    </ProtectedRoute>
  );
}

