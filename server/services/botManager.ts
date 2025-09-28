import mineflayer, { Bot as MineBot } from 'mineflayer';
import { Bot, BotStatus, BotAction, LogLevel, CreateBot, CreateLogEntry } from '@shared/schema';
import { storage } from '../storage';
import { EventEmitter } from 'events';

interface BotInstance {
  bot: MineBot | null;
  data: Bot;
  reconnectTimer?: NodeJS.Timeout;
  antiAfkTimer?: NodeJS.Timeout;
  startTime: Date;
}

export class BotManager extends EventEmitter {
  private instances: Map<string, BotInstance> = new Map();
  private readonly serverHost = 'tbcraft.cbu.net';
  private readonly serverPort = 25569;
  private readonly password = '12345678P';

  constructor() {
    super();
  }

  async spawnAllBots(): Promise<void> {
    const botNames = this.generateBotNames(10);
    
    for (const username of botNames) {
      await this.createBot(username);
    }
  }

  private generateBotNames(count: number): string[] {
    const prefixes = ['Craft', 'Mine', 'Build', 'Guard', 'Farm', 'Battle', 'Scout', 'Helper', 'Worker', 'Digger'];
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const prefix = prefixes[i % prefixes.length];
      const suffix = Math.floor(Math.random() * 9000) + 1000;
      names.push(`${prefix}Bot_${suffix}`);
    }
    
    return names;
  }

  async createBot(username: string): Promise<Bot> {
    const existingBot = await storage.getBotByUsername(username);
    if (existingBot) {
      return existingBot;
    }

    const createBotData: CreateBot = {
      username,
      status: BotStatus.OFFLINE,
      action: BotAction.IDLE,
      health: 20,
      maxHealth: 20,
      uptime: 0,
      isRegistered: false
    };

    const bot = await storage.createBot(createBotData);
    
    const instance: BotInstance = {
      bot: null,
      data: bot,
      startTime: new Date()
    };
    
    this.instances.set(bot.id, instance);
    
    // Start connection
    await this.connectBot(bot.id);
    
    return bot;
  }

  async connectBot(botId: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance) throw new Error('Bot not found');

    if (instance.bot) {
      instance.bot.quit();
    }

    await this.updateBotStatus(botId, BotStatus.CONNECTING, BotAction.IDLE);
    await this.addLog(botId, `Connecting to ${this.serverHost}:${this.serverPort}`, LogLevel.INFO);

    try {
      const bot = mineflayer.createBot({
        host: this.serverHost,
        port: this.serverPort,
        username: instance.data.username,
        version: '1.20.1'
      });

      instance.bot = bot;
      instance.startTime = new Date();

      this.setupBotEventHandlers(botId, bot);
      
    } catch (error) {
      await this.addLog(botId, `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, LogLevel.ERROR);
      await this.updateBotStatus(botId, BotStatus.OFFLINE, BotAction.DISCONNECTED);
      this.scheduleReconnect(botId);
    }
  }

  private setupBotEventHandlers(botId: string, bot: MineBot): void {
    const instance = this.instances.get(botId);
    if (!instance) return;

    bot.on('login', async () => {
      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.IDLE);
      await this.addLog(botId, 'Successfully connected to server', LogLevel.SUCCESS);
      
      // Register and login if not done before
      if (!instance.data.isRegistered) {
        setTimeout(() => {
          bot.chat(`/register ${this.password}`);
        }, 1000);
        
        setTimeout(() => {
          bot.chat(`/login ${this.password}`);
        }, 2000);
        
        await storage.updateBot(botId, { isRegistered: true });
        await this.addLog(botId, 'Registration and login completed', LogLevel.SUCCESS);
      } else {
        setTimeout(() => {
          bot.chat(`/login ${this.password}`);
        }, 1000);
        await this.addLog(botId, 'Login completed', LogLevel.SUCCESS);
      }

      this.emit('botConnected', instance.data);
    });

    bot.on('end', async (reason) => {
      await this.updateBotStatus(botId, BotStatus.OFFLINE, BotAction.DISCONNECTED);
      await this.addLog(botId, `Disconnected: ${reason}`, LogLevel.WARNING);
      this.scheduleReconnect(botId);
      this.emit('botDisconnected', instance.data);
    });

    bot.on('error', async (error) => {
      await this.addLog(botId, `Error: ${error.message}`, LogLevel.ERROR);
    });

    bot.on('kicked', async (reason) => {
      await this.addLog(botId, `Kicked from server: ${reason}`, LogLevel.ERROR);
      await this.updateBotStatus(botId, BotStatus.OFFLINE, BotAction.DISCONNECTED);
      this.scheduleReconnect(botId);
    });

    bot.on('health', async () => {
      await storage.updateBot(botId, { 
        health: bot.health,
        maxHealth: bot.food 
      });
    });

    bot.on('move', async () => {
      if (bot.entity?.position) {
        await storage.updateBot(botId, {
          position: {
            x: Math.round(bot.entity.position.x),
            y: Math.round(bot.entity.position.y),
            z: Math.round(bot.entity.position.z)
          }
        });
      }
    });

    bot.on('chat', async (username, message) => {
      if (username === 'rabbit0009') {
        this.emit('chatFromRabbit', { username, message, botId });
      }
    });
  }

  private scheduleReconnect(botId: string): void {
    const instance = this.instances.get(botId);
    if (!instance) return;

    if (instance.reconnectTimer) {
      clearTimeout(instance.reconnectTimer);
    }

    instance.reconnectTimer = setTimeout(async () => {
      await this.addLog(botId, 'Attempting to reconnect...', LogLevel.INFO);
      await this.connectBot(botId);
    }, 30000); // Reconnect after 30 seconds
  }

  async disconnectBot(botId: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance) throw new Error('Bot not found');

    if (instance.reconnectTimer) {
      clearTimeout(instance.reconnectTimer);
    }
    
    if (instance.antiAfkTimer) {
      clearTimeout(instance.antiAfkTimer);
    }

    if (instance.bot) {
      instance.bot.quit();
      instance.bot = null;
    }

    await this.updateBotStatus(botId, BotStatus.OFFLINE, BotAction.DISCONNECTED);
    await this.addLog(botId, 'Bot disconnected by user', LogLevel.INFO);
  }

  async executeCommand(botId: string, command: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance?.bot) throw new Error('Bot not connected');

    try {
      if (command.startsWith('/')) {
        instance.bot.chat(command);
        await this.addLog(botId, `Executed command: ${command}`, LogLevel.INFO);
      } else {
        instance.bot.chat(command);
        await this.addLog(botId, `Sent chat: ${command}`, LogLevel.INFO);
      }
    } catch (error) {
      await this.addLog(botId, `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`, LogLevel.ERROR);
    }
  }

  async executeGlobalCommand(command: string): Promise<void> {
    const bots = await storage.getBots();
    const connectedBots = bots.filter(bot => bot.status === BotStatus.ONLINE);

    for (const bot of connectedBots) {
      await this.executeCommand(bot.id, command);
    }

    await this.addLog('global', `Global command executed: ${command}`, LogLevel.INFO);
  }

  async followPlayer(botId: string, playerName: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance?.bot) throw new Error('Bot not connected');

    try {
      const player = instance.bot.players[playerName];
      if (!player?.entity) {
        await this.addLog(botId, `Player ${playerName} not found`, LogLevel.WARNING);
        return;
      }

      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.FOLLOWING, playerName);
      
      const pathfinder = require('mineflayer-pathfinder');
      if (!(instance.bot as any).pathfinder) {
        instance.bot.loadPlugin(pathfinder.pathfinder);
      }
      
      const { GoalFollow } = pathfinder.goals;
      (instance.bot as any).pathfinder.setGoal(new GoalFollow(player.entity, 3), true);
      
      await this.addLog(botId, `Started following ${playerName}`, LogLevel.SUCCESS);
    } catch (error) {
      await this.addLog(botId, `Follow failed: ${error instanceof Error ? error.message : 'Unknown error'}`, LogLevel.ERROR);
    }
  }

  async attackPlayer(botId: string, playerName: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance?.bot) throw new Error('Bot not connected');

    try {
      const player = instance.bot.players[playerName];
      if (!player?.entity) {
        await this.addLog(botId, `Player ${playerName} not found`, LogLevel.WARNING);
        return;
      }

      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.ATTACKING, playerName);
      
      // Simple attack implementation
      const attackInterval = setInterval(() => {
        if (instance.bot && player.entity) {
          const distance = instance.bot.entity.position.distanceTo(player.entity.position);
          if (distance <= 4) {
            instance.bot.attack(player.entity);
          }
        }
      }, 500);

      // Store interval for cleanup
      (instance as any).attackInterval = attackInterval;
      
      await this.addLog(botId, `Started attacking ${playerName}`, LogLevel.WARNING);
    } catch (error) {
      await this.addLog(botId, `Attack failed: ${error instanceof Error ? error.message : 'Unknown error'}`, LogLevel.ERROR);
    }
  }

  async stopAction(botId: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance?.bot) throw new Error('Bot not connected');

    try {
      // Stop pathfinding
      if ((instance.bot as any).pathfinder) {
        (instance.bot as any).pathfinder.setGoal(null);
      }

      // Stop attacking
      if ((instance as any).attackInterval) {
        clearInterval((instance as any).attackInterval);
        delete (instance as any).attackInterval;
      }

      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.IDLE);
      await this.addLog(botId, 'Stopped current action', LogLevel.INFO);
    } catch (error) {
      await this.addLog(botId, `Stop action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, LogLevel.ERROR);
    }
  }

  async toggleAntiAfk(botId: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance?.bot) throw new Error('Bot not connected');

    if (instance.antiAfkTimer) {
      clearInterval(instance.antiAfkTimer);
      instance.antiAfkTimer = undefined;
      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.IDLE);
      await this.addLog(botId, 'Anti-AFK disabled', LogLevel.INFO);
    } else {
      instance.antiAfkTimer = setInterval(() => {
        if (instance.bot && Math.random() > 0.5) {
          instance.bot.setControlState('jump', true);
          setTimeout(() => {
            if (instance.bot) {
              instance.bot.setControlState('jump', false);
            }
          }, 100);
        }
      }, 60000); // Every minute

      await this.updateBotStatus(botId, BotStatus.ONLINE, BotAction.ANTI_AFK);
      await this.addLog(botId, 'Anti-AFK enabled', LogLevel.INFO);
    }
  }

  private async updateBotStatus(botId: string, status: BotStatus, action: BotAction, target?: string): Promise<void> {
    const instance = this.instances.get(botId);
    if (!instance) return;

    const uptime = Date.now() - instance.startTime.getTime();
    
    const updatedBot = await storage.updateBot(botId, { 
      status, 
      action, 
      target,
      uptime: Math.floor(uptime / 1000)
    });
    
    if (updatedBot) {
      instance.data = updatedBot;
      this.emit('botUpdated', updatedBot);
    }
  }

  private async addLog(botId: string, message: string, level: LogLevel): Promise<void> {
    const instance = this.instances.get(botId);
    const botName = instance?.data.username || 'Unknown';
    
    const log = await storage.addLog({
      botId,
      botName,
      message,
      level
    });
    
    this.emit('newLog', log);
  }

  async getAllBots(): Promise<Bot[]> {
    return storage.getBots();
  }

  async getBotLogs(botId: string): Promise<any[]> {
    return storage.getBotLogs(botId);
  }

  async getAllLogs(): Promise<any[]> {
    return storage.getLogs();
  }
}

export const botManager = new BotManager();
