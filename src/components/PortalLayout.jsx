import { Outlet } from 'react-router-dom';
import { useClaimantAuth } from '../context/ClaimantAuthContext';
import { ClaimantSiteHeader } from './portal/ClaimantSiteHeader';
import { ClaimantSiteFooter } from './portal/ClaimantSiteFooter';

export function PortalLayout() {
  const { claimant, logout } = useClaimantAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ClaimantSiteHeader
        variant="authenticated"
        tone="light"
        email={claimant?.email}
        onLogout={logout}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>

      <ClaimantSiteFooter />
    </div>
  );
}
