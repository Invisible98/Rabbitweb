import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInterface } from './ChatInterface';
import { MobileBotControls } from './MobileBotControls';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { Bot, LogEntry, BotStatus } from '@shared/schema';
import { 
  Bot as BotIcon, 
  MessageSquare, 
  Settings, 
  Activity,
  Wifi,
  WifiOff,
  Plus,
  Power
} from 'lucide-react';

interface MobileDashboardProps {
  onLogout: () => void;
}

export function MobileDashboard({ onLogout }: MobileDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  const socket = useSocket();

  // todo: replace with actual API calls
  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ['/api/bots'],
    queryFn: async () => {
      // Mock data for demo
      return [
        {
          id: '1',
          username: 'CraftBot_001',
          status: BotStatus.ONLINE,
          health: 20,
          maxHealth: 20,
          uptime: 3600,
          action: 'idle' as any
        },
        {
          id: '2', 
          username: 'MineBot_002',
          status: BotStatus.ONLINE,
          health: 18,
          maxHealth: 20,
          uptime: 2400,
          action: 'following' as any,
          target: 'rabbit0009'
        },
        {
          id: '3',
          username: 'GuardBot_003',
          status: BotStatus.OFFLINE,
          health: 0,
          maxHealth: 20,
          uptime: 0,
          action: 'disconnected' as any
        }
      ];
    },
    refetchInterval: 30000
  });

  const onlineCount = bots.filter(bot => bot.status === BotStatus.ONLINE).length;
  const totalCount = bots.length;

  // Socket event handlers
  useEffect(() => {
    const handleBotUpdated = (bot: Bot) => {
      console.log('Bot updated:', bot); // todo: remove mock functionality
    };

    const handleNewLog = (log: LogEntry) => {
      setLogs(prev => [log, ...prev].slice(0, 50));
    };

    socket.on('botUpdated', handleBotUpdated);
    socket.on('newLog', handleNewLog);

    return () => {
      socket.off('botUpdated');
      socket.off('newLog');
    };
  }, [socket]);

  const handleSpawnAll = async () => {
    try {
      console.log('Spawning all bots'); // todo: replace with actual API call
      toast({
        title: 'Starting Bots',
        description: 'All bots are being started...',
      });
    } catch (error) {
      toast({
        title: 'Demo Mode',
        description: 'Bot spawn simulated (demo mode)',
      });
    }
  };

  const handleStopAll = async () => {
    try {
      console.log('Stopping all bots'); // todo: replace with actual API call
      toast({
        title: 'Stopping Bots',
        description: 'All bots are being stopped...',
      });
    } catch (error) {
      toast({
        title: 'Demo Mode', 
        description: 'Bot stop simulated (demo mode)',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Bot Control</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {socket.isConnected ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span data-testid="connection-status">
                  {socket.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" data-testid="mobile-bot-count">
              {onlineCount}/{totalCount}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-xs"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button 
            size="sm" 
            onClick={handleSpawnAll}
            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-mobile-spawn-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            Start All
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleStopAll}
            className="flex-shrink-0"
            data-testid="button-mobile-stop-all"
          >
            <Power className="w-4 h-4 mr-1" />
            Stop All
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="p-4">
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger 
              value="controls" 
              className="flex items-center gap-1 text-xs"
              data-testid="tab-controls"
            >
              <Settings className="w-3 h-3" />
              Controls
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-1 text-xs"
              data-testid="tab-chat"
            >
              <MessageSquare className="w-3 h-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="flex items-center gap-1 text-xs"
              data-testid="tab-status"
            >
              <Activity className="w-3 h-3" />
              Status
            </TabsTrigger>
          </TabsList>

          {/* Bot Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            <MobileBotControls 
              onlineCount={onlineCount} 
              totalCount={totalCount}
              className="w-full"
            />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <ChatInterface className="h-[calc(100vh-200px)]" />
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  Bot Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bots.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <BotIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bots available</p>
                    <p className="text-sm">Start by spawning some bots</p>
                  </div>
                ) : (
                  bots.map((bot) => (
                    <div 
                      key={bot.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`mobile-bot-${bot.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          bot.status === BotStatus.ONLINE ? 'bg-green-500' : 
                          bot.status === BotStatus.CONNECTING ? 'bg-yellow-500 animate-pulse' :
                          'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">{bot.username}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {bot.action} {bot.target && `→ ${bot.target}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {bot.health > 0 ? `${bot.health}/${bot.maxHealth}` : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bot.uptime > 0 ? `${Math.floor(bot.uptime/60)}m` : '--'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Summary Stats */}
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {onlineCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-muted-foreground">
                        {totalCount - onlineCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Offline</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}