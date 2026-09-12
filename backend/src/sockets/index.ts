import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { User } from "../models/user.model.js";

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

/**
 * Realtime layer for the Battle Zone.
 * Event names follow DEVARENA_SPEC §6 (`challenge:received`, `presence:*`, …).
 * A single namespace is used with per-user rooms; splitting into /challenge,
 * /presence, /battle namespaces later needs no client event-name changes.
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

    socket.on("disconnect", async () => {
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
  });

  return io;
}
