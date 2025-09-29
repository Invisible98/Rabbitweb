import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bot management enums
export enum BotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline', 
  CONNECTING = 'connecting',
  RECONNECTING = 'reconnecting'
}

export enum BotAction {
  IDLE = 'idle',
  FOLLOWING = 'following',
  ATTACKING = 'attacking',
  ANTI_AFK = 'anti_afk',
  DISCONNECTED = 'disconnected'
}

export enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Bot interface for in-memory storage
export interface Bot {
  id: string;
  username: string;
  status: BotStatus;
  health: number;
  maxHealth: number;
  uptime: number;
  action: BotAction;
  target?: string;
  connectedAt?: Date;
  lastActivity?: Date;
}

// Log entry interface
export interface LogEntry {
  id: string;
  botName: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sender?: string;
}

// Insert schemas for validation
export const insertBotSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const insertChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  isUser: z.boolean().default(true),
});

export type InsertBot = z.infer<typeof insertBotSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
