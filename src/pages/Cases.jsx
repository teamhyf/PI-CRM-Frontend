/**
 * Cases Page
 * Dedicated page for viewing and managing all cases
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIntake } from '../context/IntakeContext';
import { CaseSummaryModal } from '../components/CaseSummaryModal';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';

export function Cases() {
  const { cases, deleteCase, loadCaseForEdit } = useIntake();
  const navigate = useNavigate();
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

  const handleRowClick = (caseData, e) => {
    // Don't open modal if clicking on action buttons
    if (e.target.closest('.action-buttons')) {
      return;
    }
    setSelectedCase(caseData);
    setIsModalOpen(true);
  };

  const handleView = (caseData, e) => {
    e.stopPropagation();
    setSelectedCase(caseData);
    setIsModalOpen(true);
  };

  const handleEdit = (caseData, e) => {
    e.stopPropagation();
    loadCaseForEdit(caseData);
    navigate('/intake');
  };

  const handleDelete = async (caseData, e) => {
    e.stopPropagation();
    // Don't allow deleting sample cases
    const isSampleCase = sampleCases.some(sc => sc.caseId === caseData.caseId);
    if (isSampleCase) {
      alert('Sample cases cannot be deleted.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete case ${caseData.caseId}? This action cannot be undone.`)) {
      try {
        await deleteCase(caseData.caseId);
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete case. Please try again.');
      }
    }
  };

  const getInsuranceStatus = (insurance) => {
    if (!insurance) return 'Unknown';
    const client = insurance.clientAutoInsurance === 'Yes' ? 'Yes' : 'No';
    const other = insurance.otherPartyInsurance === 'Yes' ? 'Yes' : 'No';
    return `${client}/${other}`;
  };

  return (
    <div className="w-full px-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">All Cases</h1>
              <AIBadge size="sm" />
            </div>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <AISparklesIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
              View and manage all personal injury cases
            </p>
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
        <div className="stat-card border-l-4 border-blue-500 hover:border-blue-600 animate-fade-in group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Cases</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{cases.length}</p>
              <p className="text-xs text-gray-500 mt-1">All cases in system</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-purple-500 hover:border-purple-600 animate-fade-in group" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Filtered Results</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{filteredAndSortedCases.length}</p>
              <p className="text-xs text-gray-500 mt-1">Matching filters</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-amber-500 hover:border-amber-600 animate-fade-in group" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending Review</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {cases.filter(c => c.status === 'Pending Attorney Review').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
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
        <div className="w-full">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accident Type
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Loss
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Injury
                </th>
                <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viability
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
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
                filteredAndSortedCases.map((caseData) => {
                  const isSampleCase = sampleCases.some(sc => sc.caseId === caseData.caseId);
                  return (
                    <tr
                      key={caseData.caseId}
                      onClick={(e) => handleRowClick(caseData, e)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                      {caseData.caseId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {caseData.contact?.fullName || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {caseData.contact?.email || ''}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 truncate">
                      {caseData.accident?.accidentType || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 truncate">
                      {caseData.accident?.dateOfLoss
                        ? new Date(caseData.accident.dateOfLoss).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          caseData.injury?.injured === 'Yes'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {caseData.injury?.injured || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={getViabilityBadgeClass(caseData.aiEvaluation?.viabilityLevel)}
                      >
                        {caseData.aiEvaluation?.viabilityLevel || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {caseData.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2 action-buttons">
                        <button
                          onClick={(e) => handleView(caseData, e)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleEdit(caseData, e)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Case"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!isSampleCase && (
                          <button
                            onClick={(e) => handleDelete(caseData, e)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Case"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
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
