import { LogEntry, LogLevel } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2 } from 'lucide-react';

interface LogsPanelProps {
  logs: LogEntry[];
}

export function LogsPanel({ logs }: LogsPanelProps) {
  const { toast } = useToast();

  const getLogClass = (level: LogLevel) => {
    switch (level) {
      case LogLevel.SUCCESS:
        return 'log-entry log-success border-green-500 bg-green-900/20';
      case LogLevel.WARNING:
        return 'log-entry log-warning border-yellow-500 bg-yellow-900/20';
      case LogLevel.ERROR:
        return 'log-entry log-error border-red-500 bg-red-900/20';
      case LogLevel.INFO:
      default:
        return 'log-entry log-info border-blue-500 bg-blue-900/20';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleDownloadLogs = () => {
    const logsText = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()} - ${log.botName}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Logs Downloaded',
      description: 'Activity logs have been saved to your downloads folder',
    });
  };

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear logs');
      
      toast({
        title: 'Logs Cleared',
        description: 'All activity logs have been cleared',
      });
      
      // The logs will be updated via WebSocket
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear logs',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 overflow-hidden flex flex-col h-full" data-testid="logs-panel">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold" data-testid="logs-title">Activity Logs</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={handleDownloadLogs}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-download-logs"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm" 
            onClick={handleClearLogs}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-logs"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1" data-testid="logs-container">
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="no-logs-message">
            No activity logs yet. Bot actions will appear here.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`${getLogClass(log.level)} text-xs py-1 px-2 mb-1 rounded border-l-2`} data-testid={`log-entry-${log.id}`}>
              <div className="font-medium" data-testid={`log-bot-${log.id}`}>{log.botName}</div>
              <div className="text-muted-foreground" data-testid={`log-message-${log.id}`}>{log.message}</div>
              <div className="text-muted-foreground text-xs" data-testid={`log-time-${log.id}`}>{formatTimeAgo(log.timestamp)}</div>
            </div>
          ))
        )}
      </div>
      
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="auto-refresh-status">Auto-refresh: ON</span>
          <span data-testid="logs-count">Showing {logs.length} entries</span>
        </div>
      </div>
    </div>
  );
}
