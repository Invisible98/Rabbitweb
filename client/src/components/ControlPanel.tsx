import { useState } from 'react';
import { Bot, BotStatus } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { User, Sword, Square, Navigation, Shuffle, Send, Play, Brain } from 'lucide-react';

interface ControlPanelProps {
  bots: Bot[];
  selectedBot: Bot | null;
  lastAiResponse: string;
}

export function ControlPanel({ bots, selectedBot, lastAiResponse }: ControlPanelProps) {
  const [followTarget, setFollowTarget] = useState('rabbit0009');
  const [attackTarget, setAttackTarget] = useState('');
  const [globalCommand, setGlobalCommand] = useState('');
  const [individualCommand, setIndividualCommand] = useState('');
  const [selectedBotId, setSelectedBotId] = useState('');
  const { toast } = useToast();

  const onlineBots = bots.filter(bot => bot.status === BotStatus.ONLINE);

  const executeGlobalCommand = async (endpoint: string, data?: any) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) throw new Error('Command failed');
      
      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute command',
        variant: 'destructive'
      });
    }
  };

  const executeIndividualCommand = async (botId: string, endpoint: string, data?: any) => {
    try {
      const response = await fetch(`/api/bots/${botId}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) throw new Error('Command failed');
      
      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute command',
        variant: 'destructive'
      });
    }
  };

  const handleGlobalFollow = () => {
    if (!followTarget.trim()) return;
    executeGlobalCommand('/api/bots/follow-global', { target: followTarget });
  };

  const handleGlobalAttack = () => {
    if (!attackTarget.trim()) return;
    executeGlobalCommand('/api/bots/attack-global', { target: attackTarget });
  };

  const handleGlobalStop = () => {
    executeGlobalCommand('/api/bots/stop-global');
  };

  const handleGlobalTeleport = () => {
    executeGlobalCommand('/api/bots/teleport');
  };

  const handleSendGlobalCommand = () => {
    if (!globalCommand.trim()) return;
    
    executeGlobalCommand('/api/commands', {
      type: 'global',
      command: globalCommand
    });
    
    setGlobalCommand('');
  };

  const handleIndividualConnect = () => {
    if (!selectedBotId) return;
    executeIndividualCommand(selectedBotId, '/connect');
  };

  const handleIndividualDisconnect = () => {
    if (!selectedBotId) return;
    executeIndividualCommand(selectedBotId, '/disconnect');
  };

  const handleSendIndividualCommand = () => {
    if (!selectedBotId || !individualCommand.trim()) return;
    
    executeGlobalCommand('/api/commands', {
      type: 'individual',
      botId: selectedBotId,
      command: individualCommand
    });
    
    setIndividualCommand('');
  };

  return (
    <div className="space-y-4" data-testid="control-panel">
      {/* Global Commands */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-4" data-testid="global-commands-title">Global Commands</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="follow-target">Follow Player</Label>
            <div className="flex space-x-2">
              <Input
                id="follow-target"
                value={followTarget}
                onChange={(e) => setFollowTarget(e.target.value)}
                placeholder="rabbit0009"
                data-testid="input-follow-target"
              />
              <Button 
                onClick={handleGlobalFollow}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                data-testid="button-global-follow"
              >
                <User className="w-4 h-4" />
                Follow
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attack-target">Attack Player</Label>
            <div className="flex space-x-2">
              <Input
                id="attack-target"
                value={attackTarget}
                onChange={(e) => setAttackTarget(e.target.value)}
                placeholder="Player name"
                data-testid="input-attack-target"
              />
              <Button 
                onClick={handleGlobalAttack}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                data-testid="button-global-attack"
              >
                <Sword className="w-4 h-4" />
                Attack
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button 
            onClick={handleGlobalStop}
            className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1"
            data-testid="button-global-stop"
          >
            <Square className="w-4 h-4" />
            Stop Attack
          </Button>
          <Button 
            onClick={handleGlobalTeleport}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            data-testid="button-global-teleport"
          >
            <Navigation className="w-4 h-4" />
            TP to Rabbit
          </Button>
          <Button 
            onClick={() => {
              onlineBots.forEach(bot => {
                executeIndividualCommand(bot.id, '/anti-afk');
              });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
            data-testid="button-global-anti-afk"
          >
            <Shuffle className="w-4 h-4" />
            Toggle Anti-AFK
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="global-command">Send Command/Chat</Label>
          <div className="flex space-x-2">
            <Input
              id="global-command"
              value={globalCommand}
              onChange={(e) => setGlobalCommand(e.target.value)}
              placeholder="/say Hello World or just chat message"
              onKeyDown={(e) => e.key === 'Enter' && handleSendGlobalCommand()}
              data-testid="input-global-command"
            />
            <Button 
              onClick={handleSendGlobalCommand}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1"
              data-testid="button-send-global-command"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Individual Bot Control */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-4" data-testid="individual-control-title">Individual Bot Control</h3>
        
        <div className="mb-4">
          <Label htmlFor="bot-select">Select Bot</Label>
          <Select value={selectedBotId} onValueChange={setSelectedBotId}>
            <SelectTrigger data-testid="select-bot">
              <SelectValue placeholder="Choose a bot" />
            </SelectTrigger>
            <SelectContent>
              {bots.map(bot => (
                <SelectItem key={bot.id} value={bot.id}>
                  {bot.username} ({bot.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button 
            onClick={handleIndividualConnect}
            disabled={!selectedBotId}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center gap-1"
            data-testid="button-individual-connect"
          >
            <Play className="w-4 h-4" />
            Connect
          </Button>
          <Button 
            onClick={handleIndividualDisconnect}
            disabled={!selectedBotId}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center gap-1"
            data-testid="button-individual-disconnect"
          >
            <Square className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="individual-command">Custom Command</Label>
          <div className="flex space-x-2">
            <Input
              id="individual-command"
              value={individualCommand}
              onChange={(e) => setIndividualCommand(e.target.value)}
              placeholder="/give @s minecraft:diamond 64"
              onKeyDown={(e) => e.key === 'Enter' && handleSendIndividualCommand()}
              data-testid="input-individual-command"
            />
            <Button 
              onClick={handleSendIndividualCommand}
              disabled={!selectedBotId || !individualCommand.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              data-testid="button-send-individual-command"
            >
              Execute
            </Button>
          </div>
        </div>
      </div>

      {/* OpenAI Chat Integration */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="ai-integration-title">
          <Brain className="w-5 h-5 text-green-500" />
          AI Chat Integration
        </h3>
        
        <div className="bg-muted/50 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">OpenAI Status</span>
            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded" data-testid="ai-status">
              Connected
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Listening for messages from: <span className="text-primary font-medium">rabbit0009</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Last AI Response</Label>
          <div className="bg-input rounded-md p-3 text-sm border-l-4 border-blue-500 min-h-[60px]" data-testid="ai-last-response">
            {lastAiResponse || 'No recent AI responses...'}
          </div>
        </div>
      </div>
    </div>
  );
}
