import type { RouteObject } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import Dashboard from "../pages/Dashboard";
import DNAPage from "../pages/DNAPage";
import WrappedPage from "../pages/WrappedPage";
import ArenaLobby from "../pages/ArenaLobby";
import BattleRoom from "../pages/BattleRoom";
import BattleResult from "../pages/BattleResult";
import Leaderboard from "../pages/Leaderboard";
import PublicProfile from "../pages/PublicProfile";
import AuthPage from "../pages/AuthPage";
import { MainLayout } from "../layout/MainLayout";

export default [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <AuthPage /> },
  {
    element: <MainLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/dna", element: <DNAPage /> },
      { path: "/wrapped", element: <WrappedPage /> },
      { path: "/arena", element: <ArenaLobby /> },
      { path: "/battle/:roomCode", element: <BattleRoom /> },
      { path: "/battle/:roomCode/result", element: <BattleResult /> },
      { path: "/leaderboard", element: <Leaderboard /> },
      { path: "/u/:username", element: <PublicProfile /> },
    ],
  },
] satisfies RouteObject[];
