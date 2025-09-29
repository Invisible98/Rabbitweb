import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, LogEntry } from '@shared/schema';
import { useSocket } from '@/hooks/useSocket';
import { BotList } from '@/components/BotList';
import { ControlPanel } from '@/components/ControlPanel';
import { LogsPanel } from '@/components/LogsPanel';
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Bot as BotIcon, Plus, Square } from 'lucide-react';

export default function Dashboard() {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const { toast } = useToast();
  const socket = useSocket();

  // Fetch bots data
  const { data: bots = [], isLoading } = useQuery<Bot[]>({
    queryKey: ['/api/bots'],
    refetchInterval: 30000 // Refetch every 30 seconds as backup
  });

  // Fetch logs data
  const { data: initialLogs = [] } = useQuery<LogEntry[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 60000
  });

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs.length]);

  // Socket event handlers
  useEffect(() => {
    const handleBotConnected = (bot: Bot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Connected",
        description: `${bot.username} has connected to the server`,
      });
    };

    const handleBotDisconnected = (bot: Bot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      toast({
        title: "Bot Disconnected", 
        description: `${bot.username} has disconnected`,
        variant: "destructive"
      });
    };

    const handleBotUpdated = (bot: Bot) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      setSelectedBot(current => current?.id === bot.id ? bot : current);
    };

    const handleNewLog = (log: LogEntry) => {
      setLogs(prev => [log, ...prev].slice(0, 50)); // Keep only last 50 logs
    };

    const handleAiResponse = (data: { response: string; originalMessage: string }) => {
      setLastAiResponse(data.response);
      toast({
        title: "AI Response",
        description: data.response,
      });
    };

    socket.on('botConnected', handleBotConnected);
    socket.on('botDisconnected', handleBotDisconnected);
    socket.on('botUpdated', handleBotUpdated);
    socket.on('newLog', handleNewLog);
    socket.on('aiResponse', handleAiResponse);

    return () => {
      socket.off('botConnected');
      socket.off('botDisconnected'); 
      socket.off('botUpdated');
      socket.off('newLog');
      socket.off('aiResponse');
    };
  }, [socket, toast]);

  const onlineCount = bots.filter(bot => bot.status === 'online').length;
  const totalCount = bots.length;

  const handleSpawnAllBots = async () => {
    try {
      const response = await fetch('/api/bots/spawn-all', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to spawn bots');
      
      toast({
        title: "Spawning Bots",
        description: "All bots are being spawned and will connect shortly",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to spawn bots",
        variant: "destructive"
      });
    }
  };

  const handleStopAllBots = async () => {
    try {
      const response = await fetch('/api/bots/stop-global', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to stop bots');
      
      toast({
        title: "Stopping Bots",
        description: "All bot actions have been stopped",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to stop bots",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading bot management system...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header */}
      <header className="gradient-header border-b border-border/50 p-6 shadow-2xl" data-testid="header">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3" data-testid="title">
              <BotIcon className="w-8 h-8 text-primary drop-shadow-lg" />
              <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                Mineflayer Bot Manager
              </span>
            </h1>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground glass-effect px-4 py-2 rounded-full">
              <span className={`status-dot ${socket.isConnected ? 'online' : 'offline'}`}></span>
              <span data-testid="server-status" className="font-medium">Server: tbcraft.cbu.net:25569</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleSpawnAllBots}
                className="minecraft-button bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-lg"
                data-testid="button-spawn-all"
              >
                <Plus className="w-4 h-4" />
                Spawn All Bots
              </Button>
              <Button 
                onClick={handleStopAllBots}
                variant="destructive"
                className="minecraft-button flex items-center gap-2 shadow-lg"
                data-testid="button-stop-all"
              >
                <Square className="w-4 h-4" />
                Stop All
              </Button>
            </div>
            
            <div className="glass-effect px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-primary font-bold text-lg" data-testid="bot-count">
                  {onlineCount}/{totalCount} Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <div className="container mx-auto p-6 grid grid-cols-12 gap-8 h-[calc(100vh-120px)]">
        {/* Left Sidebar - Bot List */}
        <div className="col-span-4">
          <div className="glass-effect rounded-xl h-full">
            <BotList 
              bots={bots}
              selectedBot={selectedBot}
              onSelectBot={setSelectedBot}
            />
          </div>
        </div>

        {/* Center - Control Panel */}
        <div className="col-span-5">
          <div className="glass-effect rounded-xl h-full">
            <ControlPanel 
              bots={bots}
              selectedBot={selectedBot}
              lastAiResponse={lastAiResponse}
            />
          </div>
        </div>

        {/* Right Sidebar - Logs */}
        <div className="col-span-3">
          <div className="glass-effect rounded-xl h-full">
            <LogsPanel logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
