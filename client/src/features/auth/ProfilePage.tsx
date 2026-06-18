import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { authApi } from "../../services/api";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs font-medium mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ["profileStats"],
    queryFn: async () => {
      const res = await authApi.stats();
      return res.data as {
        totalCheckIns: number;
        habitCount: number;
        notebookCount: number;
        noteCount: number;
      };
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: (data: { name: string }) => authApi.updateProfile(data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    if (name.trim() && name !== user?.name) {
      updateProfile.mutate({ name });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-8">Profile</h1>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">{user?.name}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          {user?.createdAt && (
            <p className="text-gray-500 text-xs mt-1">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div>
          <h3 className="text-white font-semibold mb-4">Account settings</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Email
              </label>
              <input
                value={user?.email ?? ""}
                disabled
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending || name === user?.name}
            className="mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {updateProfile.isPending
              ? "Saving..."
              : saved
                ? "✓ Saved"
                : "Save changes"}
          </button>
        </div>

        {/* Stats + logout */}
        <div>
          <h3 className="text-white font-semibold mb-4">Your stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total check-ins"
              value={stats?.totalCheckIns ?? 0}
              color="text-violet-400"
            />
            <StatCard
              label="Habits"
              value={stats?.habitCount ?? 0}
              color="text-green-400"
            />
            <StatCard
              label="Notebooks"
              value={stats?.notebookCount ?? 0}
              color="text-amber-400"
            />
            <StatCard
              label="Notes"
              value={stats?.noteCount ?? 0}
              color="text-teal-400"
            />
          </div>

          <h3 className="text-white font-semibold mb-4 mt-8">Session</h3>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-red-500/30 text-red-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            🚪 Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
