import { type Bot, type LogEntry, type CreateBot, type CreateLogEntry, BotStatus, LogLevel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Bot management
  getBots(): Promise<Bot[]>;
  getBot(id: string): Promise<Bot | undefined>;
  getBotByUsername(username: string): Promise<Bot | undefined>;
  createBot(bot: CreateBot): Promise<Bot>;
  updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;
  
  // Log management
  getLogs(limit?: number): Promise<LogEntry[]>;
  getBotLogs(botId: string, limit?: number): Promise<LogEntry[]>;
  addLog(log: CreateLogEntry): Promise<LogEntry>;
  clearLogs(): Promise<void>;
}

export class MemStorage implements IStorage {
  private bots: Map<string, Bot>;
  private logs: LogEntry[];

  constructor() {
    this.bots = new Map();
    this.logs = [];
  }

  async getBots(): Promise<Bot[]> {
    return Array.from(this.bots.values()).sort((a, b) => a.username.localeCompare(b.username));
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotByUsername(username: string): Promise<Bot | undefined> {
    return Array.from(this.bots.values()).find(bot => bot.username === username);
  }

  async createBot(createBot: CreateBot): Promise<Bot> {
    const id = randomUUID();
    const bot: Bot = {
      ...createBot,
      id,
      lastSeen: new Date(),
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;

    const updatedBot = { ...bot, ...updates, lastSeen: new Date() };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    return this.bots.delete(id);
  }

  async getLogs(limit: number = 50): Promise<LogEntry[]> {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getBotLogs(botId: string, limit: number = 20): Promise<LogEntry[]> {
    return this.logs
      .filter(log => log.botId === botId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addLog(createLog: CreateLogEntry): Promise<LogEntry> {
    const log: LogEntry = {
      ...createLog,
      id: randomUUID(),
      timestamp: new Date(),
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    return log;
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
  }
}

export const storage = new MemStorage();
