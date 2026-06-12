import { useState } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import ExportImport from "./ExportImport";

export default function NavBar({
  isLoggedIn,
  onLoginClick,
  onLogout,
  onRefresh,
}) {
  const [refreshState, setRefreshState] = useState("idle"); // 'idle'|'loading'|'success'|'error'
  const [refreshError, setRefreshError] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleRefresh() {
    if (refreshState === "loading") return;
    setRefreshState("loading");
    setRefreshError(null);
    try {
      await onRefresh();
      setRefreshState("success");
      setTimeout(() => setRefreshState("idle"), 1500);
    } catch {
      setRefreshState("error");
      setRefreshError("Refresh failed");
      setTimeout(() => {
        setRefreshState("idle");
        setRefreshError(null);
      }, 1500);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } catch {
      // swallow — the worst case is the user stays logged in visually; they can retry
    } finally {
      setLoggingOut(false);
    }
  }

  function RefreshIcon() {
    if (refreshState === "loading")
      return <RefreshCw size={16} className="animate-spin" />;
    if (refreshState === "success")
      return <Check size={16} className="text-green-500" />;
    if (refreshState === "error")
      return <X size={16} className="text-red-500" />;
    return <RefreshCw size={16} />;
  }

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-gray-50/80 dark:bg-neutral-950/80 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand mark — uses light/dark logo variants */}
          <div className="flex items-center gap-2.5 min-w-0">
            <picture className="flex-shrink-0">
              <source
                srcSet="/fifa_logo_dark_mode.svg"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="/fifa_logo_light_mode.svg"
                alt="FIFA World Cup 2026"
                className="h-8 w-auto"
              />
            </picture>
            <span className="font-display text-lg font-bold tracking-tight truncate">
              World Cup Log
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={refreshState === "loading"}
                  aria-label="Refresh match data"
                  title="Re-fetch match data from football-data.org"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-40 p-1.5"
                >
                  <RefreshIcon />
                </button>
                <button
                  onClick={() => setShowExport(true)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors px-2 py-1"
                >
                  Export / Import
                </button>
              </>
            )}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-neutral-500 disabled:opacity-50 transition-colors"
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-sm px-3 py-1.5 rounded-md bg-accent text-white font-medium hover:bg-accent-dim transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {refreshError && (
          <div className="max-w-4xl mx-auto px-4 pb-2 text-sm text-red-500">
            {refreshError}
          </div>
        )}
      </header>

      {showExport && <ExportImport onClose={() => setShowExport(false)} />}
    </>
  );
}
