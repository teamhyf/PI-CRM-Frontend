export default function CaseDocumentsTab({ documents }) {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Document upload and AI extraction are implemented in a later phase. This tab currently
        lists any existing `case_documents` records.
      </p>
      {(!documents || documents.length === 0) ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">File</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.document_type}</td>
                  <td className="px-4 py-2">{d.file_name}</td>
                  <td className="px-4 py-2 capitalize">{d.document_status}</td>
                  <td className="px-4 py-2">
                    {d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

