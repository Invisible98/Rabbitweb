import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { botManager } from "./services/botManager";
import { openaiService } from "./services/openaiService";
import { commandSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast helper function
  const broadcast = (event: string, data: any) => {
    const message = JSON.stringify({ event, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Bot manager event handlers
  botManager.on('botConnected', (bot) => {
    broadcast('botConnected', bot);
  });

  botManager.on('botDisconnected', (bot) => {
    broadcast('botDisconnected', bot);
  });

  botManager.on('botUpdated', (bot) => {
    broadcast('botUpdated', bot);
  });

  botManager.on('newLog', (log) => {
    broadcast('newLog', log);
  });

  botManager.on('chatFromRabbit', async ({ username, message, botId }) => {
    try {
      const response = await openaiService.processChat(username, message);
      if (response) {
        broadcast('aiResponse', { response, originalMessage: message });
        
        // Log the AI interaction
        await storage.addLog({
          botId: 'ai',
          botName: 'AI Response',
          message: `${username}: "${message}" → ${response}`,
          level: 'info' as any
        });
      }
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  });

  // API Routes
  
  // Get all bots
  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await storage.getBots();
      res.json(bots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single bot
  app.get("/api/bots/:id", async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.json(bot);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Spawn all bots
  app.post("/api/bots/spawn-all", async (req, res) => {
    try {
      await botManager.spawnAllBots();
      const bots = await storage.getBots();
      res.json({ message: "Spawning all bots", bots });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Connect specific bot
  app.post("/api/bots/:id/connect", async (req, res) => {
    try {
      await botManager.connectBot(req.params.id);
      res.json({ message: "Bot connection initiated" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Disconnect specific bot
  app.post("/api/bots/:id/disconnect", async (req, res) => {
    try {
      await botManager.disconnectBot(req.params.id);
      res.json({ message: "Bot disconnected" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute command
  app.post("/api/commands", async (req, res) => {
    try {
      const command = commandSchema.parse(req.body);
      
      if (command.type === 'global') {
        await botManager.executeGlobalCommand(command.command);
        res.json({ message: "Global command executed" });
      } else if (command.botId) {
        await botManager.executeCommand(command.botId, command.command);
        res.json({ message: "Individual command executed" });
      } else {
        res.status(400).json({ error: "Bot ID required for individual commands" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Follow player
  app.post("/api/bots/:id/follow", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ error: "Target player required" });
      }
      await botManager.followPlayer(req.params.id, target);
      res.json({ message: `Bot following ${target}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global follow
  app.post("/api/bots/follow-global", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ error: "Target player required" });
      }
      
      const bots = await storage.getBots();
      const onlineBots = bots.filter(bot => bot.status === 'online');
      
      for (const bot of onlineBots) {
        await botManager.followPlayer(bot.id, target);
      }
      
      res.json({ message: `All bots following ${target}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Attack player
  app.post("/api/bots/:id/attack", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ error: "Target player required" });
      }
      await botManager.attackPlayer(req.params.id, target);
      res.json({ message: `Bot attacking ${target}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global attack
  app.post("/api/bots/attack-global", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ error: "Target player required" });
      }
      
      const bots = await storage.getBots();
      const onlineBots = bots.filter(bot => bot.status === 'online');
      
      for (const bot of onlineBots) {
        await botManager.attackPlayer(bot.id, target);
      }
      
      res.json({ message: `All bots attacking ${target}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop action
  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      await botManager.stopAction(req.params.id);
      res.json({ message: "Bot action stopped" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global stop
  app.post("/api/bots/stop-global", async (req, res) => {
    try {
      const bots = await storage.getBots();
      const onlineBots = bots.filter(bot => bot.status === 'online');
      
      for (const bot of onlineBots) {
        await botManager.stopAction(bot.id);
      }
      
      res.json({ message: "All bots stopped" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle anti-AFK
  app.post("/api/bots/:id/anti-afk", async (req, res) => {
    try {
      await botManager.toggleAntiAfk(req.params.id);
      res.json({ message: "Anti-AFK toggled" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global teleport
  app.post("/api/bots/teleport", async (req, res) => {
    try {
      await botManager.executeGlobalCommand('/tp rabbit0009');
      res.json({ message: "All bots teleporting to rabbit0009" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bot logs
  app.get("/api/bots/:id/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const logs = await storage.getBotLogs(req.params.id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear logs
  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ message: "Logs cleared" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
