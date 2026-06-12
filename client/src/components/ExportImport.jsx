import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";

export default function ExportImport({ onClose }) {
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleExport() {
    setExportStatus("Exporting…");
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldcuplog-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus(`Exported ${data.personal.length} records`);
    } catch (e) {
      setExportStatus("Export failed: " + e.message);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Reading file…");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.personal || !Array.isArray(data.personal)) {
          setImportStatus('Invalid file format — missing "personal" array');
          return;
        }
        setImportStatus("Importing…");
        const result = await api.importData(data);
        setImportStatus(
          `Imported ${result.imported} records (${result.skipped} skipped — fetch matches first if skipped > 0)`,
        );
      } catch (e) {
        setImportStatus("Import failed: " + e.message);
      }
      fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 shadow-xl space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
            Export / Import
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your watched history and notes — keyed by match ID
          </p>
        </div>

        {/* Export */}
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent transition-colors"
          >
            Download JSON backup
          </button>
          {exportStatus && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {exportStatus}
            </p>
          )}
        </div>

        <hr className="border-gray-200 dark:border-neutral-800" />

        {/* Import */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Restore from a previously exported file. Re-importing the same file
            is safe — it won't duplicate data.
          </p>
          <label className="block">
            <span className="sr-only">Choose backup file</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 dark:file:bg-neutral-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-neutral-700 file:cursor-pointer"
            />
          </label>
          {importStatus && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {importStatus}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
