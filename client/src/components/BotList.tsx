import { Bot, BotStatus, BotAction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface BotListProps {
  bots: Bot[];
  selectedBot: Bot | null;
  onSelectBot: (bot: Bot) => void;
}

export function BotList({ bots, selectedBot, onSelectBot }: BotListProps) {
  const { toast } = useToast();

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
    <div className="bg-card rounded-lg border border-border p-4 overflow-hidden flex flex-col h-full" data-testid="bot-list">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold" data-testid="bot-list-title">Bot Fleet</h2>
        <div className="flex items-center space-x-2">
          <button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/bots'] })}
            data-testid="button-refresh-bots"
          >
            <i className="fas fa-refresh"></i>
          </button>
          <div className="text-xs bg-muted px-2 py-1 rounded" data-testid="bot-total-count">
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
              className={`bot-card bg-secondary/50 hover:bg-secondary border border-border rounded-lg p-3 cursor-pointer transition-all ${
                selectedBot?.id === bot.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectBot(bot)}
              data-testid={`bot-card-${bot.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`}></div>
                  <div>
                    <div className="font-medium text-sm" data-testid={`bot-username-${bot.id}`}>
                      {bot.username}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`bot-action-${bot.id}`}>
                      {getActionText(bot.action, bot.target)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {bot.status === BotStatus.OFFLINE ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30"
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
                      className="text-xs bg-primary/20 text-primary hover:bg-primary/30"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`button-control-${bot.id}`}
                    >
                      Control
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span data-testid={`bot-health-${bot.id}`}>
                  Health: <span className={bot.health > 0 ? 'text-green-500' : 'text-red-500'}>
                    {bot.health > 0 ? `${bot.health}/${bot.maxHealth}` : '--/--'}
                  </span>
                </span>
                <span data-testid={`bot-uptime-${bot.id}`}>
                  Uptime: <span>{bot.uptime > 0 ? formatUptime(bot.uptime) : '--'}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
