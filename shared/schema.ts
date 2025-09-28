import { z } from "zod";

export enum BotStatus {
  OFFLINE = "offline",
  CONNECTING = "connecting", 
  ONLINE = "online",
  RECONNECTING = "reconnecting"
}

export enum LogLevel {
  INFO = "info",
  SUCCESS = "success", 
  WARNING = "warning",
  ERROR = "error"
}

export enum BotAction {
  IDLE = "idle",
  FOLLOWING = "following",
  ATTACKING = "attacking", 
  ANTI_AFK = "anti_afk",
  DISCONNECTED = "disconnected"
}

export const botSchema = z.object({
  id: z.string(),
  username: z.string(),
  status: z.nativeEnum(BotStatus),
  action: z.nativeEnum(BotAction),
  health: z.number().default(20),
  maxHealth: z.number().default(20),
  uptime: z.number().default(0),
  lastSeen: z.date(),
  target: z.string().optional(),
  isRegistered: z.boolean().default(false),
  position: z.object({
    x: z.number(),
    y: z.number(), 
    z: z.number()
  }).optional()
});

export const logEntrySchema = z.object({
  id: z.string(),
  botId: z.string(),
  botName: z.string(),
  message: z.string(),
  level: z.nativeEnum(LogLevel),
  timestamp: z.date()
});

export const commandSchema = z.object({
  type: z.enum(['individual', 'global']),
  botId: z.string().optional(),
  command: z.string(),
  target: z.string().optional()
});

export const chatMessageSchema = z.object({
  username: z.string(),
  message: z.string(),
  timestamp: z.date()
});

export type Bot = z.infer<typeof botSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type Command = z.infer<typeof commandSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const createBotSchema = botSchema.omit({ id: true, lastSeen: true });
export const createLogEntrySchema = logEntrySchema.omit({ id: true, timestamp: true });

export type CreateBot = z.infer<typeof createBotSchema>;
export type CreateLogEntry = z.infer<typeof createLogEntrySchema>;
