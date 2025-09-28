import OpenAI from "openai";
import { botManager } from "./botManager";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private readonly targetUser = "rabbit0009";

  async processChat(username: string, message: string): Promise<string | null> {
    if (username !== this.targetUser) {
      return null; // Ignore messages from other players
    }

    try {
      // Check for specific commands
      if (message.toLowerCase().includes('attack ')) {
        const playerName = message.toLowerCase().replace('attack ', '').trim();
        await this.executeAttackCommand(playerName);
        return `All bots are now attacking ${playerName}`;
      }

      if (message.toLowerCase().includes('follow me') || message.toLowerCase().includes('follow rabbit')) {
        await this.executeFollowCommand(this.targetUser);
        return `All bots are now following you`;
      }

      if (message.toLowerCase().includes('stop')) {
        await this.executeStopCommand();
        return "All bots have stopped their current actions";
      }

      if (message.toLowerCase().includes('teleport') || message.toLowerCase().includes('tp')) {
        await this.executeTeleportCommand();
        return "All bots are teleporting to you";
      }

      // Use OpenAI for general responses
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a Minecraft bot controller. Respond briefly and helpfully to commands about managing Minecraft bots. Keep responses short and action-oriented."
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      return response.choices[0].message.content || "I understand, but I need more specific instructions.";

    } catch (error) {
      console.error('OpenAI service error:', error);
      return "I'm having trouble understanding that command right now.";
    }
  }

  private async executeAttackCommand(playerName: string): Promise<void> {
    const bots = await botManager.getAllBots();
    const onlineBots = bots.filter(bot => bot.status === 'online');

    for (const bot of onlineBots) {
      try {
        await botManager.attackPlayer(bot.id, playerName);
      } catch (error) {
        console.error(`Failed to command bot ${bot.username} to attack:`, error);
      }
    }
  }

  private async executeFollowCommand(playerName: string): Promise<void> {
    const bots = await botManager.getAllBots();
    const onlineBots = bots.filter(bot => bot.status === 'online');

    for (const bot of onlineBots) {
      try {
        await botManager.followPlayer(bot.id, playerName);
      } catch (error) {
        console.error(`Failed to command bot ${bot.username} to follow:`, error);
      }
    }
  }

  private async executeStopCommand(): Promise<void> {
    const bots = await botManager.getAllBots();
    const onlineBots = bots.filter(bot => bot.status === 'online');

    for (const bot of onlineBots) {
      try {
        await botManager.stopAction(bot.id);
      } catch (error) {
        console.error(`Failed to stop bot ${bot.username}:`, error);
      }
    }
  }

  private async executeTeleportCommand(): Promise<void> {
    try {
      await botManager.executeGlobalCommand('/tp rabbit0009');
    } catch (error) {
      console.error('Failed to execute teleport command:', error);
    }
  }
}

export const openaiService = new OpenAIService();
