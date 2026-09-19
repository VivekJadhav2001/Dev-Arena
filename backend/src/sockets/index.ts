import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function battleRoom(roomCode: string): string {
  return `battle:${String(roomCode).toUpperCase()}`;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

/**
 * Notify room members that synchronized battle state changed
 * (selection saved, question locked, code saved/run). Clients refetch
 * the authoritative room snapshot over REST — no game facts travel here.
 */
export function emitBattleUpdated(roomCode: string): void {
  io?.to(battleRoom(roomCode)).emit("battle:updated", { roomCode: String(roomCode).toUpperCase() });
}

export interface BattleCheerPayload {
  roomCode: string;
  targetUserId: string;
  emoji: string;
  fromUserId: string;
  fromUsername: string;
  totalForTarget: number;
  totalCheers: number;
}

/** Live-spectate fan-out: reactions are broadcast, never trusted for scoring. */
export function emitBattleCheer(roomCode: string, payload: BattleCheerPayload): void {
  io?.to(battleRoom(roomCode)).emit("battle:cheer", payload);
}

export function emitSpectators(roomCode: string): void {
  const code = String(roomCode).toUpperCase();
  io?.to(battleRoom(code)).emit("battle:spectators", {
    roomCode: code,
    spectatorCount: getSpectatorCount(code),
  });
}

export interface BattleLivePayload {
  roomCode: string;
  mode: string;
  difficulty: string;
  language: string | null;
  playersCount: number;
  maxPlayers: number;
  hostUsername: string;
  playerIds: string[];
  totalQuestions: number;
  startedAt: string | null;
}

/**
 * Global fan-out: a battle just went live. Broadcast to EVERY connected
 * socket (not just the room) so active users can catch the stream.
 * Safe summary only — spectators fetch details over REST (`/arena/:code/spectate`).
 */
export function emitBattleLive(payload: BattleLivePayload): void {
  io?.emit("battle:live", payload);
}

export interface JoinRequestPayload {
  requestId: string;
  roomCode: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatarUrl: string | null;
  mode: string;
  difficulty: string;
  language: string | null;
  playersCount: number;
  maxPlayers: number;
  /** ISO timestamp when the host's 10s decision window closes. */
  expiresAt: string;
}

export interface JoinResolutionPayload {
  requestId: string;
  roomCode: string;
  battleId?: string;
  reason?: string;
}

/**
 * Global fan-out: the watchable lobby list changed (slot filled, battle
 * started, …). Live cards poll every few seconds; this ping makes the Join
 * button disable and the start animation trigger immediately.
 */
export function emitLiveBattlesUpdated(roomCode: string): void {
  io?.emit("live:battles-updated", { roomCode: String(roomCode).toUpperCase() });
}

/** Host-only ping: someone wants to fill the open 1v1 slot. */
export function emitJoinRequest(hostId: string, payload: JoinRequestPayload): void {
  emitToUser(hostId, "battle:join-request", payload);
}

export function emitJoinAccepted(userId: string, payload: JoinResolutionPayload): void {
  emitToUser(userId, "battle:join-accepted", payload);
}

export function emitJoinDeclined(userId: string, payload: JoinResolutionPayload): void {
  emitToUser(userId, "battle:join-declined", payload);
}

export function emitJoinExpired(userId: string, payload: JoinResolutionPayload): void {
  emitToUser(userId, "battle:join-expired", payload);
}

export interface PlayerRemovedPayload {
  roomCode: string;
  removedUserId: string;
  reason?: string;
}

/** Direct ping to the removed developer so their lobby exits immediately. */
export function emitPlayerRemoved(userId: string, payload: PlayerRemovedPayload): void {
  emitToUser(userId, "battle:removed", payload);
}

export interface BattleCancelledPayload {
  roomCode: string;
  reason?: string;
}

/**
 * Room fan-out: the host cancelled a waiting lobby. Members refetch over
 * REST (authoritative) and leave; spectators drop back to the live list.
 */
export function emitBattleCancelled(roomCode: string, payload: BattleCancelledPayload): void {
  const code = String(roomCode).toUpperCase();
  io?.to(battleRoom(code)).emit("battle:cancelled", payload);
}

// Spectator presence is intentionally in-memory (best-effort, like presence).
// Cheers are the persisted signal; viewer counts just make the stream feel alive.
const spectateMembers = new Map<string, Set<string>>();

export function getSpectatorCount(roomCode: string): number {
  return spectateMembers.get(String(roomCode).toUpperCase())?.size ?? 0;
}

function trackSpectateJoin(roomCode: string, socketId: string): number {
  const code = String(roomCode).toUpperCase();
  let members = spectateMembers.get(code);
  if (!members) {
    members = new Set<string>();
    spectateMembers.set(code, members);
  }
  members.add(socketId);
  return members.size;
}

function trackSpectateLeave(roomCode: string, socketId: string): number {
  const code = String(roomCode).toUpperCase();
  const members = spectateMembers.get(code);
  if (members) {
    members.delete(socketId);
    if (members.size === 0) spectateMembers.delete(code);
    return members.size;
  }
  return 0;
}

function trackSocketDisconnect(socketId: string): string[] {
  const touched: string[] = [];
  for (const [code, members] of spectateMembers) {
    if (members.delete(socketId)) touched.push(code);
    if (members.size === 0) spectateMembers.delete(code);
  }
  return touched;
}

/**
 * Realtime layer for the Battle Zone.
 * A single namespace is used with per-user rooms (`presence:*`,
 * `battle:*`, `live:*`); game facts always travel over REST.
 */
export function initSockets(httpServer: HttpServer, frontendUrl: string): Server {
  io = new Server(httpServer, {
    cors: { origin: frontendUrl || "*", credentials: true },
  });

  io.on("connection", (socket) => {
    const authUserId =
      typeof socket.handshake.auth?.userId === "string" ? socket.handshake.auth.userId : null;

    if (authUserId) {
      void (async () => {
        try {
          const user = await User.findById(authUserId);
          if (!user) return;
          await socket.join(userRoom(user.id));
          socket.data.userId = user.id;
          user.presence.isOnline = true;
          user.presence.socketConnectedAt = new Date();
          user.presence.lastSeenAt = new Date();
          await user.save();
          socket.broadcast.emit("presence:developer_online", { userId: user.id });
        } catch {
          // Presence is best-effort; REST remains the source of truth.
        }
      })();
    }

    socket.on("presence:join", async (payload: { userId?: string }) => {
      try {
        const userId = payload?.userId ?? authUserId;
        if (!userId) return;
        await socket.join(userRoom(userId));
        socket.data.userId = userId;
        await User.findByIdAndUpdate(userId, {
          "presence.isOnline": true,
          "presence.socketConnectedAt": new Date(),
          "presence.lastSeenAt": new Date(),
        });
        socket.broadcast.emit("presence:developer_online", { userId });
      } catch {
        // best-effort
      }
    });

    socket.on("presence:heartbeat", async () => {
      try {
        const userId = socket.data.userId ?? authUserId;
        if (!userId) return;
        await User.findByIdAndUpdate(userId, {
          "presence.isOnline": true,
          "presence.lastSeenAt": new Date(),
        });
      } catch {
        // best-effort
      }
    });

    socket.on("presence:leave", async () => {
      try {
        const userId = socket.data.userId ?? authUserId;
        if (!userId) return;
        await User.findByIdAndUpdate(userId, {
          "presence.isOnline": false,
          "presence.lastSeenAt": new Date(),
        });
        socket.broadcast.emit("presence:developer_offline", { userId });
      } catch {
        // best-effort
      }
    });

    // Synchronized battle rooms: members join to receive `battle:updated`
    // pings and refetch authoritative state over REST.
    socket.on("battle:join", async (payload: { roomCode?: string }) => {
      try {
        const roomCode = String(payload?.roomCode ?? "").toUpperCase();
        const userId = socket.data.userId ?? authUserId;
        if (!roomCode || !userId) return;
        const battle = await Battle.findOne({ roomCode }).lean();
        const member = battle?.players.some((p) => String(p.userId) === String(userId)) ?? false;
        if (!member) return;
        await socket.join(battleRoom(roomCode));
      } catch {
        // best-effort
      }
    });

    socket.on("battle:leave", async (payload: { roomCode?: string }) => {
      try {
        const roomCode = String(payload?.roomCode ?? "").toUpperCase();
        if (!roomCode) return;
        await socket.leave(battleRoom(roomCode));
      } catch {
        // best-effort
      }
    });

    // Live-spectate: any authenticated user may watch a waiting/active room.
    // Spectators join the same room channel so `battle:updated` pings keep the
    // stream in sync; game facts still travel over REST (`/arena/:code/spectate`).
    socket.on("battle:spectate:join", async (payload: { roomCode?: string }) => {
      try {
        const roomCode = String(payload?.roomCode ?? "").toUpperCase();
        const userId = socket.data.userId ?? authUserId;
        if (!roomCode || !userId) return;
        const battle = await Battle.findOne({ roomCode }).lean();
        if (!battle || (battle.status !== "active" && battle.status !== "waiting")) return;
        await socket.join(battleRoom(roomCode));
        const spectatorCount = trackSpectateJoin(roomCode, socket.id);
        io?.to(battleRoom(roomCode)).emit("battle:spectators", { roomCode, spectatorCount });
      } catch {
        // best-effort
      }
    });

    socket.on("battle:spectate:leave", async (payload: { roomCode?: string }) => {
      try {
        const roomCode = String(payload?.roomCode ?? "").toUpperCase();
        if (!roomCode) return;
        await socket.leave(battleRoom(roomCode));
        const spectatorCount = trackSpectateLeave(roomCode, socket.id);
        io?.to(battleRoom(roomCode)).emit("battle:spectators", { roomCode, spectatorCount });
      } catch {
        // best-effort
      }
    });

    socket.on("disconnect", async () => {
      try {
        const touched = trackSocketDisconnect(socket.id);
        for (const code of touched) {
          io?.to(battleRoom(code)).emit("battle:spectators", {
            roomCode: code,
            spectatorCount: getSpectatorCount(code),
          });
        }
        const userId = socket.data.userId ?? authUserId;
        if (!userId) return;
        await User.findByIdAndUpdate(userId, {
          "presence.isOnline": false,
          "presence.lastSeenAt": new Date(),
        });
        socket.broadcast.emit("presence:developer_offline", { userId });
      } catch {
        // best-effort
      }
    });
  });

  return io;
}
