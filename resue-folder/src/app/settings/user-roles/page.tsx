"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type UserRow = { id: string; name: string; email: string; role: string };

const ROLES = [
  { value: "ADMIN", label: "Admin", description: "Full access. Can manage users and all modules. Only one admin per organization." },
  { value: "MANAGER", label: "Manager", description: "Can manage day-to-day operations and reports in assigned areas." },
  { value: "STAFF", label: "Staff", description: "Standard access. Can create and edit transactions as allowed." },
];

export default function SettingsUserRolesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const byRole = ROLES.map((r) => ({
    ...r,
    users: users.filter((u) => u.role === r.value),
  }));

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">USER ROLES</h1>
      <p className="mb-6 text-sm text-gray-600">
        Roles define what users can do. Assign roles from the Users page when creating a user.
      </p>

      <div className="space-y-6">
        {byRole.map((role) => (
          <div key={role.value} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">{role.label}</h2>
            <p className="mb-3 text-xs text-gray-600">{role.description}</p>
            {loading ? (
              <p className="text-xs text-gray-500">Loading…</p>
            ) : role.users.length === 0 ? (
              <p className="text-xs text-gray-500">No users with this role.</p>
            ) : (
              <ul className="text-sm text-gray-700">
                {role.users.map((u) => (
                  <li key={u.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-gray-500">({u.email})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
