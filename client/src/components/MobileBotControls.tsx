import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Sword, 
  Square, 
  Navigation, 
  Shield, 
  Play, 
  Pause,
  Settings,
  Activity
} from 'lucide-react';

interface MobileBotControlsProps {
  onlineCount: number;
  totalCount: number;
  className?: string;
}

export function MobileBotControls({ onlineCount, totalCount, className }: MobileBotControlsProps) {
  const [followTarget, setFollowTarget] = useState('rabbit0009');
  const [attackTarget, setAttackTarget] = useState('');
  const [isGlobalActive, setIsGlobalActive] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('idle');
  const { toast } = useToast();

  const executeCommand = async (action: string, target?: string) => {
    console.log(`Executing ${action}${target ? ` on ${target}` : ''}`); // todo: remove mock functionality
    
    try {
      // todo: replace with actual API calls
      const response = await fetch(`/api/bots/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: target ? JSON.stringify({ target }) : undefined
      });
      
      if (!response.ok) throw new Error(`Failed to ${action}`);
      
      setCurrentAction(action);
      setIsGlobalActive(action !== 'stop');
      
      toast({
        title: 'Command Executed',
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} command sent to all bots`,
      });
      
    } catch (error) {
      // todo: remove mock functionality - Demo mode behavior
      setCurrentAction(action);
      setIsGlobalActive(action !== 'stop');
      
      toast({
        title: 'Demo Mode',
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} command simulated (demo mode)`,
      });
    }
  };

  const handleFollow = () => {
    if (!followTarget.trim()) return;
    executeCommand('follow', followTarget);
  };

  const handleAttack = () => {
    if (!attackTarget.trim()) return;
    executeCommand('attack', attackTarget);
  };

  const handleStop = () => {
    executeCommand('stop');
  };

  const handleTeleport = () => {
    executeCommand('teleport', followTarget);
  };

  const handleAntiAfk = () => {
    executeCommand('anti-afk');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Bot Controls
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isGlobalActive ? 'default' : 'secondary'} className="text-xs">
              {isGlobalActive ? currentAction : 'idle'}
            </Badge>
            <Badge variant="outline" className="text-xs" data-testid="bot-status-count">
              {onlineCount}/{totalCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Indicator */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Current Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isGlobalActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`} />
              <span className="text-sm capitalize" data-testid="current-action">
                {currentAction}
              </span>
            </div>
          </div>
        </div>

        {/* Follow Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Follow Player</Label>
          <div className="flex gap-2">
            <Input
              value={followTarget}
              onChange={(e) => setFollowTarget(e.target.value)}
              placeholder="rabbit0009"
              className="flex-1 h-11"
              data-testid="input-follow-target"
            />
            <Button 
              onClick={handleFollow}
              className="h-11 bg-green-600 hover:bg-green-700 text-white px-4"
              data-testid="button-follow"
            >
              <User className="w-4 h-4 mr-2" />
              Follow
            </Button>
          </div>
        </div>

        {/* Attack Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Attack Player</Label>
          <div className="flex gap-2">
            <Input
              value={attackTarget}
              onChange={(e) => setAttackTarget(e.target.value)}
              placeholder="Enter player name"
              className="flex-1 h-11"
              data-testid="input-attack-target"
            />
            <Button 
              onClick={handleAttack}
              className="h-11 bg-red-600 hover:bg-red-700 text-white px-4"
              data-testid="button-attack"
            >
              <Sword className="w-4 h-4 mr-2" />
              Attack
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleStop}
            variant="outline"
            className="h-12 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200"
            data-testid="button-stop"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop All
          </Button>
          
          <Button 
            onClick={handleTeleport}
            variant="outline"
            className="h-12 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-600 dark:text-blue-200"
            data-testid="button-teleport"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Teleport
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleAntiAfk}
            variant="outline"
            className="w-full h-12 bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900 dark:border-purple-600 dark:text-purple-200"
            data-testid="button-anti-afk"
          >
            <Shield className="w-4 h-4 mr-2" />
            Toggle Anti-AFK Mode
          </Button>
        </div>

        {/* Emergency Controls */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => executeCommand('connect-all')}
              className="h-12 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-connect-all"
            >
              <Play className="w-4 h-4 mr-2" />
              Start All
            </Button>
            
            <Button 
              onClick={() => executeCommand('disconnect-all')}
              variant="destructive"
              className="h-12"
              data-testid="button-disconnect-all"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}