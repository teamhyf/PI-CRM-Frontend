/**
 * User Management Page (Admin Only)
 * Create, update, delete users
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const actionIconBtn =
  'inline-flex items-center justify-center rounded-lg p-2 border border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent';

function IconPencil({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function IconTrash({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function IconSpinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const emptyCreateForm = () => ({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: 'attorney',
});

export function UserManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyCreateForm);
  const [createShowPassword, setCreateShowPassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
    role: 'attorney',
    isActive: true,
    password: '',
    confirmPassword: '',
  });
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // all | admin | attorney | staff
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | inactive

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchUsers = async (showFullPageSpinner = true) => {
    const base = getBaseUrl();
    if (showFullPageSpinner) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${base}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      if (showFullPageSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleUsers = useMemo(() => {
    let list = users;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const email = String(u.email || '').toLowerCase();
        const fullName = String(u.fullName || '').toLowerCase();
        const role = String(u.role || '').toLowerCase();
        const idStr = u.id != null ? String(u.id) : '';
        return email.includes(q) || fullName.includes(q) || role.includes(q) || idStr.includes(q);
      });
    }
    if (filterRole !== 'all') {
      const want = filterRole.toLowerCase();
      list = list.filter((u) => String(u.role || '').toLowerCase() === want);
    }
    if (filterStatus === 'active') {
      list = list.filter((u) => Boolean(u.isActive));
    } else if (filterStatus === 'inactive') {
      list = list.filter((u) => !u.isActive);
    }
    return list;
  }, [users, searchQuery, filterRole, filterStatus]);

  const openEdit = (u, e) => {
    if (e) e.stopPropagation();
    setError('');
    setEditError('');
    setEditTarget(u);
    setEditForm({
      email: u.email || '',
      fullName: u.fullName || '',
      role: u.role || 'attorney',
      isActive: Boolean(u.isActive),
      password: '',
      confirmPassword: '',
    });
    setEditShowPassword(false);
    setEditorOpen(true);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const id = Number(editTarget.id);
    const base = getBaseUrl();
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {
        email: editForm.email.trim(),
        fullName: editForm.fullName.trim() || null,
        role: editForm.role,
        isActive: editForm.isActive,
      };
      const pw = editForm.password.trim();
      const confirm = editForm.confirmPassword.trim();
      if (pw || confirm) {
        if (pw !== confirm) {
          throw new Error('New password and confirmation do not match');
        }
        if (pw.length < 8) {
          throw new Error('New password must be at least 8 characters');
        }
        payload.password = pw;
      }

      const res = await fetch(`${base}/api/auth/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setEditorOpen(false);
      setEditTarget(null);
      await fetchUsers(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirmation do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const base = getBaseUrl();
    setCreateSubmitting(true);
    try {
      const res = await fetch(`${base}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim() || undefined,
          role: formData.role,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setFormData(emptyCreateForm());
      setShowForm(false);
      await fetchUsers(false);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id;
    const base = getBaseUrl();
    setDeleteBusy(true);
    setError('');
    try {
      const res = await fetch(`${base}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete user');
      }
      setDeleteTarget(null);
      await fetchUsers(false);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading && users.length === 0) {
    return <LoadingScreen message="Loading users…" />;
  }

  const isSelf = (u) => user && Number(u.id) === Number(user.id);

  return (
    <div className="w-full max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage team members and their roles</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            setShowForm(!showForm);
            if (showForm) setFormData(emptyCreateForm());
          }}
          className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Close form' : 'Add user'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create user</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={createShowPassword}
                      onChange={(e) => setCreateShowPassword(e.target.checked)}
                    />
                    Show
                  </label>
                </div>
                <input
                  type={createShowPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type={createShowPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md"
                >
                  <option value="attorney">Attorney</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={createSubmitting}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {createSubmitting ? 'Creating…' : 'Create user'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(emptyCreateForm());
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Users{' '}
            <span className="text-gray-500 font-normal">
              (
              {visibleUsers.length === users.length
                ? users.length
                : `${visibleUsers.length} of ${users.length}`}
              )
            </span>
          </h2>
        </div>
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
          <div className="flex-1 min-w-[12rem]">
            <label htmlFor="users-search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Search
            </label>
            <input
              id="users-search"
              type="search"
              placeholder="Email, name, role, user id…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[10rem]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="attorney">Attorney</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[10rem]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No users yet.
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No users match your search or filters.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openEdit(u)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 text-gray-600">{u.fullName || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-gray-700 hover:text-gray-900`}
                          onClick={(e) => openEdit(u, e)}
                          title="Edit user"
                          aria-label="Edit user"
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-red-600 hover:text-red-800`}
                          disabled={isSelf(u) || deleteBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelf(u)) setDeleteTarget(u);
                          }}
                          title={isSelf(u) ? 'You cannot delete your own account' : 'Delete user'}
                          aria-label="Delete user"
                        >
                          {deleteBusy && deleteTarget?.id === u.id ? (
                            <IconSpinner className="w-5 h-5 text-red-600" />
                          ) : (
                            <IconTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget ? `Delete user "${deleteTarget.email}"?` : ''}
        message="This permanently removes the user from the system."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => !deleteBusy && setDeleteTarget(null)}
      />

      {editorOpen && editTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !editSaving && setEditorOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit user</h2>
                  <p className="text-sm text-gray-600 mt-1">Update profile, role, and optional new password.</p>
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => !editSaving && setEditorOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="attorney">Attorney</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="user-active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="user-active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-800 mb-2">Change password (optional)</p>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-gray-500">Leave blank to keep current password</span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={editShowPassword}
                        onChange={(e) => setEditShowPassword(e.target.checked)}
                      />
                      Show
                    </label>
                  </div>
                  <input
                    type={editShowPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="New password (min 8 characters)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  />
                  <input
                    type={editShowPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {editError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">{editError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setEditorOpen(false);
                    setEditError('');
                  }}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  onClick={submitEdit}
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
