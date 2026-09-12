import type { RouteObject } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import Dashboard from "../pages/Dashboard";
import DNAPage from "../pages/DNAPage";
import WrappedPage from "../pages/WrappedPage";
import WrappedShared from "../pages/WrappedShared";
import ArenaLobby from "../pages/ArenaLobby";
import BattleRoom from "../pages/BattleRoom";
import BattleResult from "../pages/BattleResult";
import BattleDetails from "../pages/BattleDetails";
import Leaderboard from "../pages/Leaderboard";
import PublicProfile from "../pages/PublicProfile";
import AuthPage from "../pages/AuthPage";
import Challenges from "../pages/Challenges";
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
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/dna", element: <DNAPage /> },
      { path: "/wrapped", element: <WrappedPage /> },
      { path: "/wrapped/:username", element: <WrappedShared /> },
      { path: "/arena", element: <ArenaLobby /> },
      { path: "/challenges", element: <Challenges /> },
      { path: "/battle/:roomCode", element: <BattleRoom /> },
      { path: "/battle/:roomCode/result", element: <BattleResult /> },
      { path: "/battle/:roomCode/details", element: <BattleDetails /> },
      { path: "/leaderboard", element: <Leaderboard /> },
      { path: "/u/:username", element: <PublicProfile /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
] satisfies RouteObject[];
