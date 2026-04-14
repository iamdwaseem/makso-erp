import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  createdAt: string;
  warehouses?: { warehouse: { id: string; name: string } }[];
}

interface Warehouse {
  id: string;
  name: string;
  code?: string;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "MANAGER" | "STAFF">("STAFF");
  const [editBusy, setEditBusy] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdBusy, setResetPwdBusy] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "MANAGER" | "STAFF">("STAFF");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [assignCandidate, setAssignCandidate] = useState<{
    userId: string;
    userName: string;
    warehouseId: string;
    warehouseName: string;
  } | null>(null);
  const [assignConfirmText, setAssignConfirmText] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [unassignCandidate, setUnassignCandidate] = useState<{
    userId: string;
    userName: string;
    warehouseId: string;
    warehouseName: string;
  } | null>(null);
  const [unassignConfirmText, setUnassignConfirmText] = useState("");
  const [unassignBusy, setUnassignBusy] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/warehouses");
      setWarehouses(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch warehouses", err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/users", { name: newName, email: newEmail, role: newRole, password: newPassword });
      setShowAddModal(false);
      setNewName(""); setNewEmail(""); setNewPassword("");
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditUserModal = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setEditBusy(true);
    try {
      const payload: any = { name: editName, email: editEmail };
      if (isAdmin) payload.role = editRole;
      await api.put(`/users/${editUser.id}`, payload);
      setEditUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update user");
    } finally {
      setEditBusy(false);
    }
  };

  const handleResetPasswordForUser = async () => {
    if (!resetPwdUser) return;
    if (resetPwd.trim().length < 8) return;
    if (resetPwd !== resetPwdConfirm) return;
    setResetPwdBusy(true);
    try {
      await api.post(`/users/${resetPwdUser.id}/reset-password`, { newPassword: resetPwd });
      setResetPwdUser(null);
      setResetPwd("");
      setResetPwdConfirm("");
      alert("Password reset successfully.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reset password");
    } finally {
      setResetPwdBusy(false);
    }
  };

  const openDeleteUserModal = (user: User) => {
    setDeleteCandidate(user);
    setDeleteConfirmText("");
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    if (deleteConfirmText.trim().toLowerCase() !== deleteCandidate.email.toLowerCase()) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/users/${deleteCandidate.id}`);
      fetchUsers();
      setDeleteCandidate(null);
      setDeleteConfirmText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
    } finally {
      setDeleteBusy(false);
    }
  };

  const openAssignConfirmModal = (warehouse: Warehouse) => {
    if (!showAssignModal) return;
    setAssignCandidate({
      userId: showAssignModal.id,
      userName: showAssignModal.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
    });
    setAssignConfirmText("");
    setShowAssignModal(null);
  };

  const handleAssignWarehouse = async () => {
    if (!assignCandidate) return;
    if (assignConfirmText.trim().toLowerCase() !== assignCandidate.warehouseName.toLowerCase()) return;
    setAssignBusy(true);
    try {
      await api.post(`/users/${assignCandidate.userId}/warehouses`, { warehouseId: assignCandidate.warehouseId });
      fetchUsers();
      setAssignCandidate(null);
      setAssignConfirmText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to assign warehouse");
    } finally {
      setAssignBusy(false);
    }
  };

  const openUnassignConfirmModal = (user: User, warehouse: { id: string; name: string }) => {
    setUnassignCandidate({
      userId: user.id,
      userName: user.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
    });
    setUnassignConfirmText("");
  };

  const handleUnassignWarehouse = async () => {
    if (!unassignCandidate) return;
    if (unassignConfirmText.trim().toLowerCase() !== unassignCandidate.warehouseName.toLowerCase()) return;
    setUnassignBusy(true);
    try {
      await api.delete(`/users/${unassignCandidate.userId}/warehouses/${unassignCandidate.warehouseId}`);
      fetchUsers();
      setUnassignCandidate(null);
      setUnassignConfirmText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to unassign warehouse");
    } finally {
      setUnassignBusy(false);
    }
  };

  const canAccess = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isAdmin = currentUser?.role === "ADMIN";
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-4xl mb-4">🚫</span>
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500">Managers and administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage your team and their workspace access.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
        >
          <span>➕</span> Add New User
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading your team...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${user.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Warehouses</p>
                  <div className="flex flex-wrap gap-2">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg">Full access to all warehouses</span>
                    ) : (isAdmin || user.role === "STAFF") ? (
                      <>
                        {user.warehouses?.map(w => (
                          <div key={w.warehouse.id} className="group flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                            <span className="text-xs text-gray-700">{w.warehouse.name}</span>
                            {(isAdmin || user.role === "STAFF") && (
                              <button
                                onClick={() => openUnassignConfirmModal(user, { id: w.warehouse.id, name: w.warehouse.name })}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setShowAssignModal(user)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          + Assign
                        </button>
                      </>
                    ) : (
                      <>
                        {user.warehouses?.map(w => (
                          <span key={w.warehouse.id} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">{w.warehouse.name}</span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => openEditUserModal(user)}
                  className="text-xs text-blue-700 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setResetPwdUser(user);
                    setResetPwd("");
                    setResetPwdConfirm("");
                  }}
                  className="text-xs text-amber-700 font-semibold hover:bg-amber-50 px-3 py-1.5 rounded-lg"
                >
                  Reset Password
                </button>
                {(isAdmin || user.role === "STAFF") && (
                  <button
                    disabled={user.id === currentUser?.id}
                    onClick={() => openDeleteUserModal(user)}
                    className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-30"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white shrink-0">
              <h3 className="text-lg font-bold">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  disabled={!isAdmin}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {!isAdmin && <p className="mt-1 text-xs text-gray-400">Only Admin can change roles.</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditUser(null)} className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                  Cancel
                </button>
                <button onClick={handleUpdateUser} disabled={editBusy} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {editBusy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-amber-600 text-white shrink-0">
              <h3 className="text-lg font-bold">Reset Password</h3>
              <button onClick={() => setResetPwdUser(null)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-gray-700">
                Reset password for <b>{resetPwdUser.email}</b>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input type="password" value={resetPwdConfirm} onChange={(e) => setResetPwdConfirm(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button
                onClick={handleResetPasswordForUser}
                disabled={resetPwdBusy || resetPwd.trim().length < 8 || resetPwd !== resetPwdConfirm}
                className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {resetPwdBusy ? "Saving…" : "Reset password"}
              </button>
              <p className="text-xs text-gray-400">Min 8 characters.</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Confirm User Deletion</h3>
              <p className="text-sm text-gray-500 mt-1">
                To prevent accidental deletes, type the user email to confirm.
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <p className="text-sm text-gray-700 break-words">
                Delete <b>{deleteCandidate.name}</b> ({deleteCandidate.email})
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteCandidate.email}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setDeleteCandidate(null);
                    setDeleteConfirmText("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteBusy || deleteConfirmText.trim().toLowerCase() !== deleteCandidate.email.toLowerCase()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteBusy ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddUser} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input required type="password" placeholder="Minimum 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="STAFF">User (Stock entry/exit only)</option>
                  {isAdmin && <option value="MANAGER">Moderator Admin</option>}
                  {isAdmin && <option value="ADMIN">Superior Admin (Only 1 allowed)</option>}
                </select>
              </div>
              <button disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-4">
                {submitting ? "Adding..." : "Add User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Warehouse Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Assign Warehouse</h3>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-3 px-2 break-words">Select a warehouse to assign to <b>{showAssignModal.name}</b></p>
              {warehouses.filter(w => !showAssignModal.warehouses?.some(ua => ua.warehouse.id === w.id)).length === 0 ? (
                <p className="text-center py-4 text-sm text-gray-400 italic">No more warehouses to assign.</p>
              ) : (
                warehouses
                  .filter(w => !showAssignModal.warehouses?.some(ua => ua.warehouse.id === w.id))
                  .map(w => (
                    <button
                      key={w.id}
                      onClick={() => openAssignConfirmModal(w)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-gray-800">{w.name}</span>
                      <span className="text-blue-500">→</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Warehouse Confirmation Modal */}
      {assignCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Confirm Warehouse Assignment</h3>
              <p className="text-sm text-gray-500 mt-1">Type the warehouse name to confirm assignment.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <p className="text-sm text-gray-700 break-words">
                Assign <b>{assignCandidate.warehouseName}</b> to <b>{assignCandidate.userName}</b>
              </p>
              <input
                value={assignConfirmText}
                onChange={(e) => setAssignConfirmText(e.target.value)}
                placeholder={assignCandidate.warehouseName}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setAssignCandidate(null);
                    setAssignConfirmText("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignWarehouse}
                  disabled={assignBusy || assignConfirmText.trim().toLowerCase() !== assignCandidate.warehouseName.toLowerCase()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignBusy ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Warehouse Confirmation Modal */}
      {unassignCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Confirm Warehouse Unassignment</h3>
              <p className="text-sm text-gray-500 mt-1">Type the warehouse name to confirm unassignment.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <p className="text-sm text-gray-700 break-words">
                Remove <b>{unassignCandidate.warehouseName}</b> from <b>{unassignCandidate.userName}</b>
              </p>
              <input
                value={unassignConfirmText}
                onChange={(e) => setUnassignConfirmText(e.target.value)}
                placeholder={unassignCandidate.warehouseName}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setUnassignCandidate(null);
                    setUnassignConfirmText("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnassignWarehouse}
                  disabled={unassignBusy || unassignConfirmText.trim().toLowerCase() !== unassignCandidate.warehouseName.toLowerCase()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {unassignBusy ? "Removing..." : "Confirm Unassignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
