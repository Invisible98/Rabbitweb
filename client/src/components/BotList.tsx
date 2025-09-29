import { useState } from 'react';
import { Bot, BotStatus, BotAction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { RefreshCw, Plus, Dice6 } from 'lucide-react';

interface BotListProps {
  bots: Bot[];
  selectedBot: Bot | null;
  onSelectBot: (bot: Bot) => void;
}

export function BotList({ bots, selectedBot, onSelectBot }: BotListProps) {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const getStatusColor = (status: BotStatus) => {
    switch (status) {
      case BotStatus.ONLINE:
        return 'bg-green-500';
      case BotStatus.CONNECTING:
      case BotStatus.RECONNECTING:
        return 'bg-yellow-500 animate-pulse';
      case BotStatus.OFFLINE:
      default:
        return 'bg-red-500';
    }
  };

  const getActionText = (action: BotAction, target?: string) => {
    switch (action) {
      case BotAction.FOLLOWING:
        return `Following ${target || 'unknown'}`;
      case BotAction.ATTACKING:
        return `Attacking ${target || 'unknown'}`;
      case BotAction.ANTI_AFK:
        return 'Anti-AFK Mode';
      case BotAction.DISCONNECTED:
        return 'Disconnected';
      case BotAction.IDLE:
      default:
        return 'Idle';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const generateRandomName = () => {
    const prefixes = ['Craft', 'Mine', 'Build', 'Guard', 'Farm', 'Battle', 'Scout', 'Helper', 'Worker', 'Digger', 'Stone', 'Iron', 'Gold', 'Diamond', 'Emerald'];
    const suffixes = ['Bot', 'Miner', 'Builder', 'Fighter', 'Collector', 'Explorer', 'Warrior', 'Helper', 'Craft', 'Master'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    setNewBotName(`${prefix}${suffix}_${number}`);
  };

  const handleCreateBot = async () => {
    if (!newBotName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a bot name',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newBotName.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to create bot');
      
      toast({
        title: 'Bot Created',
        description: `${newBotName} has been created successfully`,
      });
      
      setNewBotName('');
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create bot',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBotAction = async (botId: string, action: 'connect' | 'disconnect') => {
    try {
      const response = await fetch(`/api/bots/${botId}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} bot`);
      
      toast({
        title: action === 'connect' ? 'Connecting Bot' : 'Disconnecting Bot',
        description: `Bot ${action} initiated`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} bot`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 overflow-hidden flex flex-col h-full" data-testid="bot-list">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary" data-testid="bot-list-title">Bot Fleet</h2>
        <div className="flex items-center space-x-3">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="minecraft-button bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                data-testid="button-add-bot"
              >
                <Plus className="w-4 h-4" />
                Add Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect">
              <DialogHeader>
                <DialogTitle className="text-primary">Create New Bot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="bot-name"
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                      placeholder="Enter bot name..."
                      className="flex-1"
                      data-testid="input-bot-name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomName}
                      className="flex items-center gap-1"
                      data-testid="button-random-name"
                    >
                      <Dice6 className="w-4 h-4" />
                      Random
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBot}
                    disabled={isCreating || !newBotName.trim()}
                    className="minecraft-button bg-primary hover:bg-primary/90"
                    data-testid="button-confirm-create"
                  >
                    {isCreating ? 'Creating...' : 'Create Bot'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <button 
            className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary/50"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bots'] })}
            data-testid="button-refresh-bots"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium" data-testid="bot-total-count">
            {bots.length} Total
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {bots.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="no-bots-message">
            No bots created yet. Click "Spawn All Bots" to get started.
          </div>
        ) : (
          bots.map((bot) => (
            <div 
              key={bot.id}
              className={`bot-card bg-secondary/50 rounded-xl p-4 cursor-pointer ${
                selectedBot?.id === bot.id ? 'ring-2 ring-primary shadow-xl shadow-primary/30' : ''
              }`}
              onClick={() => onSelectBot(bot)}
              data-testid={`bot-card-${bot.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`status-dot ${getStatusColor(bot.status)}`}></div>
                  <div>
                    <div className="font-bold text-base text-foreground" data-testid={`bot-username-${bot.id}`}>
                      {bot.username}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium" data-testid={`bot-action-${bot.id}`}>
                      {getActionText(bot.action, bot.target)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {bot.status === BotStatus.OFFLINE ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="minecraft-button text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBotAction(bot.id, 'connect');
                      }}
                      data-testid={`button-connect-${bot.id}`}
                    >
                      Start
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="minecraft-button text-xs bg-primary/20 text-primary hover:bg-primary/30 border-primary"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`button-control-${bot.id}`}
                    >
                      Control
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Health:</span>
                  <span className={`font-bold ${bot.health > 0 ? 'text-green-500' : 'text-red-500'}`} data-testid={`bot-health-${bot.id}`}>
                    {bot.health > 0 ? `${bot.health}/${bot.maxHealth}` : '--/--'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-bold text-primary" data-testid={`bot-uptime-${bot.id}`}>
                    {bot.uptime > 0 ? formatUptime(bot.uptime) : '--'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
