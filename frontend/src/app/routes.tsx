import { Outlet, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import Dashboard from "../pages/Dashboard";
import DNAPage from "../pages/DNAPage";
import WrappedPage from "../pages/WrappedPage";
import WrappedShared from "../pages/WrappedShared";
import ArenaLobby from "../pages/ArenaLobby";
import BattleRoom from "../pages/BattleRoom";
import BattleResult from "../pages/BattleResult";
import BattleDetails from "../pages/BattleDetails";
import LiveBattles from "../pages/LiveBattles";
import LiveBattleView from "../pages/LiveBattleView";
import Leaderboard from "../pages/Leaderboard";
import PublicProfile from "../pages/PublicProfile";
import AuthPage from "../pages/AuthPage";
import Settings from "../pages/Settings";
import { MainLayout } from "../layout/MainLayout";
import { RouteError } from "./RouteError";

export default [
  { path: "/", element: <LandingPage />, errorElement: <RouteError /> },
  { path: "/login", element: <AuthPage />, errorElement: <RouteError /> },
  {
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      // Public share targets: logged-out visitors (and link previews that
      // redirect here) must be able to view them without signing in.
      { path: "/wrapped/:username", element: <WrappedShared /> },
      { path: "/battle/:roomCode/details", element: <BattleDetails /> },
      { path: "/u/:username", element: <PublicProfile /> },
      // Everything else inside the app shell is logged-in-only: logged-out
      // visitors are redirected to /login by ProtectedRoute.
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/dna", element: <DNAPage /> },
          { path: "/wrapped", element: <WrappedPage /> },
          { path: "/arena", element: <ArenaLobby /> },
          { path: "/live", element: <LiveBattles /> },
          { path: "/live/:roomCode", element: <LiveBattleView /> },
          { path: "/battle/:roomCode", element: <BattleRoom /> },
          { path: "/battle/:roomCode/result", element: <BattleResult /> },
          { path: "/leaderboard", element: <Leaderboard /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
] satisfies RouteObject[];
