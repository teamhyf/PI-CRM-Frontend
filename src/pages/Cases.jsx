/**
 * Cases Page
 * Dedicated page for viewing and managing all cases
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIntake } from '../context/IntakeContext';
import { CaseSummaryModal } from '../components/CaseSummaryModal';

export function Cases() {
  const { cases } = useIntake();
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterViability, setFilterViability] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, score, name
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter((caseData) => {
      const matchesSearch =
        searchTerm === '' ||
        caseData.contact?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseData.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseData.accident?.accidentType?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesViability =
        filterViability === 'all' ||
        caseData.aiEvaluation?.viabilityLevel?.includes(filterViability);

      const matchesStatus =
        filterStatus === 'all' ||
        caseData.status === filterStatus;

      return matchesSearch && matchesViability && matchesStatus;
    });

    // Sort cases
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.accident?.dateOfLoss || a.createdAt || 0);
          const dateB = new Date(b.accident?.dateOfLoss || b.createdAt || 0);
          comparison = dateA - dateB;
          break;
        case 'score':
          comparison = (a.aiEvaluation?.score || 0) - (b.aiEvaluation?.score || 0);
          break;
        case 'name':
          comparison = (a.contact?.fullName || '').localeCompare(b.contact?.fullName || '');
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [cases, searchTerm, filterViability, filterStatus, sortBy, sortOrder]);

  const getViabilityBadgeClass = (level) => {
    if (!level) return 'badge-low';
    if (level.includes('High')) return 'badge-high';
    if (level.includes('Moderate')) return 'badge-moderate';
    return 'badge-low';
  };

  const handleRowClick = (caseData) => {
    setSelectedCase(caseData);
    setIsModalOpen(true);
  };

  const getInsuranceStatus = (insurance) => {
    if (!insurance) return 'Unknown';
    const client = insurance.clientAutoInsurance === 'Yes' ? 'Yes' : 'No';
    const other = insurance.otherPartyInsurance === 'Yes' ? 'Yes' : 'No';
    return `${client}/${other}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Cases</h1>
            <p className="mt-2 text-gray-600">View and manage all personal injury cases</p>
          </div>
          <Link to="/intake" className="btn-primary">
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Case Intake
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Cases</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{cases.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Filtered Results</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredAndSortedCases.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {cases.filter(c => c.status === 'Pending Attorney Review').length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cases by name, ID, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterViability}
              onChange={(e) => setFilterViability(e.target.value)}
              className="input-field"
            >
              <option value="all">All Viability</option>
              <option value="High">High Viability</option>
              <option value="Moderate">Moderate Viability</option>
              <option value="Low">Low Viability</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Pending Attorney Review">Pending Review</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order);
              }}
              className="input-field"
            >
              <option value="date-desc">Sort: Newest First</option>
              <option value="date-asc">Sort: Oldest First</option>
              <option value="score-desc">Sort: Highest Score</option>
              <option value="score-asc">Sort: Lowest Score</option>
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Cases ({filteredAndSortedCases.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accident Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Injury
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || filterViability !== 'all' || filterStatus !== 'all' ? (
                      <>
                        No cases match your filters.{' '}
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterViability('all');
                            setFilterStatus('all');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        No cases found.{' '}
                        <Link to="/intake" className="text-blue-600 hover:underline">
                          Create your first case
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((caseData) => (
                  <tr
                    key={caseData.caseId}
                    onClick={() => handleRowClick(caseData)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseData.caseId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseData.contact?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseData.contact?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseData.accident?.accidentType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseData.accident?.dateOfLoss
                        ? new Date(caseData.accident.dateOfLoss).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          caseData.injury?.injured === 'Yes'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {caseData.injury?.injured || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={getViabilityBadgeClass(caseData.aiEvaluation?.viabilityLevel)}
                      >
                        {caseData.aiEvaluation?.viabilityLevel || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseData.aiEvaluation?.score || 0}/100
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            (caseData.aiEvaluation?.score || 0) >= 70
                              ? 'bg-green-500'
                              : (caseData.aiEvaluation?.score || 0) >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${caseData.aiEvaluation?.score || 0}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {caseData.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Summary Modal */}
      <CaseSummaryModal
        caseData={selectedCase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
