export default function CaseRedFlagsTab({ flags }) {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Red flag detection logic is implemented in Phase 2. For now this tab shows any existing
        `case_red_flags` records for the case.
      </p>
      {(!flags || flags.length === 0) ? (
        <p className="text-sm text-gray-500">No red flags recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Severity</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Detected</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-2">{f.flag_type}</td>
                  <td className="px-4 py-2 capitalize">{f.severity}</td>
                  <td className="px-4 py-2">
                    {f.detected_at ? new Date(f.detected_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2 capitalize">{f.resolved_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

