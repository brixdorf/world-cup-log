import { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useMatches } from "./hooks/useMatches";
import { api } from "./lib/api";
import NavBar from "./components/NavBar";
import StageNav from "./components/StageNav";
import Dashboard from "./components/Dashboard";
import GroupStage from "./components/GroupStage";
import KnockoutStage from "./components/KnockoutStage";
import LoginModal from "./components/LoginModal";

export default function App() {
  const { isLoggedIn, checking, login, logout } = useAuth();
  const { matches, dashboard, loading, error, refresh, updatePersonal } =
    useMatches();
  const [showLogin, setShowLogin] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'played' (watched) | 'towatch' (unwatched)

  // Refresh: re-fetch from football-data.org on the server, then reload local state
  const handleRefresh = useCallback(async () => {
    await api.refreshMatches();
    await refresh();
  }, [refresh]);

  const filteredMatches = (() => {
    if (filter === "played")
      return matches.filter(
        (m) =>
          m.status === "FINISHED" &&
          (m.highlights_watched ||
            m.extended_highlights_watched ||
            m.full_match_watched),
      );
    if (filter === "towatch")
      return matches.filter(
        (m) =>
          m.status === "FINISHED" &&
          !m.highlights_watched &&
          !m.extended_highlights_watched &&
          !m.full_match_watched,
      );
    return matches;
  })();

  const groupMatches = filteredMatches.filter((m) => m.stage === "GROUP_STAGE");
  const knockoutMatches = filteredMatches.filter(
    (m) => m.stage !== "GROUP_STAGE",
  );

  if (checking) return null;

  return (
    <div className="min-h-screen">
      <NavBar
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
        onRefresh={handleRefresh}
      />

      <StageNav matches={matches} filter={filter} onFilterChange={setFilter} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-14">
        {dashboard && <Dashboard stats={dashboard} />}

        {loading && (
          <div className="py-20 text-center text-gray-400 dark:text-gray-600 text-sm">
            Loading matches…
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <>
            <GroupStage
              matches={groupMatches}
              isLoggedIn={isLoggedIn}
              onUpdate={updatePersonal}
            />
            <KnockoutStage
              matches={knockoutMatches}
              isLoggedIn={isLoggedIn}
              onUpdate={updatePersonal}
            />
            {matches.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-20">
                No match data yet — the server will fetch it on startup.
              </p>
            )}
            {matches.length > 0 && filteredMatches.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-20">
                No matches match the current filter.
              </p>
            )}
          </>
        )}
      </main>

      {showLogin && (
        <LoginModal onLogin={login} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
