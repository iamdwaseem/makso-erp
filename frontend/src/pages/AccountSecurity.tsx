import { useState } from "react";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";

export function AccountSecurity() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = async () => {
    if (!user?.id) return;
    if (newPassword.trim().length < 8) {
      setNotice({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirm) {
      setNotice({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.post(`/users/${encodeURIComponent(user.id)}/reset-password`, { newPassword });
      setNewPassword("");
      setConfirm("");
      setNotice({ type: "success", text: "Password updated successfully." });
    } catch (e: any) {
      setNotice({ type: "error", text: e?.response?.data?.error || e?.message || "Failed to update password." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-lg space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security</h1>
          <p className="text-sm text-gray-500">Reset your password.</p>
        </div>

        {notice && (
          <div
            className={`rounded border px-4 py-2 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !user?.id}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}

