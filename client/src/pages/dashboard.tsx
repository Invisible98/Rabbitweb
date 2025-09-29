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
    refetchInterval: 5000 // Refetch every 5 seconds as backup
  });

  // Fetch logs data
  const { data: initialLogs = [] } = useQuery<LogEntry[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 10000
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
      {/* Header */}
      <header className="bg-card border-b border-border p-4" data-testid="header">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2" data-testid="title">
              <BotIcon className="w-6 h-6" />
              Mineflayer Bot Manager
            </h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${socket.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span data-testid="server-status">Server: tbcraft.cbu.net:25569</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleSpawnAllBots}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                data-testid="button-spawn-all"
              >
                <Plus className="w-4 h-4" />
                Spawn All Bots
              </Button>
              <Button 
                onClick={handleStopAllBots}
                variant="destructive"
                className="flex items-center gap-2"
                data-testid="button-stop-all"
              >
                <Square className="w-4 h-4" />
                Stop All
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-500 font-medium" data-testid="bot-count">
                {onlineCount}/{totalCount} Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 grid grid-cols-12 gap-6 h-[calc(100vh-88px)]">
        {/* Left Sidebar - Bot List */}
        <div className="col-span-4">
          <BotList 
            bots={bots}
            selectedBot={selectedBot}
            onSelectBot={setSelectedBot}
          />
        </div>

        {/* Center - Control Panel */}
        <div className="col-span-5">
          <ControlPanel 
            bots={bots}
            selectedBot={selectedBot}
            lastAiResponse={lastAiResponse}
          />
        </div>

        {/* Right Sidebar - Logs */}
        <div className="col-span-3">
          <LogsPanel logs={logs} />
        </div>
      </div>
    </div>
  );
}
