import ClaimantsManagementCard from '../components/ClaimantsManagementCard';

export function Claimants() {
  return (
    <div className="w-full max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claimants</h1>
          <p className="text-gray-600 mt-2">Manage claimant portal access and activation.</p>
        </div>
      </div>
      <ClaimantsManagementCard />
    </div>
  );
}
