"use client";

type SettingsFormProps = {
  title: string;
  children: React.ReactNode;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function SettingsForm({
  title,
  children,
  onSave,
  onCancel,
}: SettingsFormProps) {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <form onSubmit={onSave} className="flex flex-wrap gap-4">
        {children}
        <div className="flex w-full gap-2 border-t border-gray-100 pt-4">
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
