import ClaimantsManagementCard from '../components/ClaimantsManagementCard';

export function Claimants() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Claimants</h1>
        <p className="text-gray-600 mt-2">
          Manage claimant portal access and activation.
        </p>
      </div>
      <ClaimantsManagementCard />
    </div>
  );
}
