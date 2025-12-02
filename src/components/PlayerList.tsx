import { Check, Clock, DollarSign, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Registration } from '@/hooks/useBabas';

interface PlayerListProps {
  registrations: Registration[];
  isAdmin?: boolean;
  onStatusChange?: (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado') => void;
}

const statusConfig = {
  inscrito: { label: 'Inscrito', icon: Clock, className: 'bg-muted text-muted-foreground' },
  pago: { label: 'Pago', icon: DollarSign, className: 'bg-warning text-warning-foreground' },
  confirmado: { label: 'Confirmado', icon: Check, className: 'bg-success text-success-foreground' },
};

export function PlayerList({ registrations, isAdmin, onStatusChange }: PlayerListProps) {
  const linhaPlayers = registrations.filter((r) => r.position === 'linha');
  const goleiros = registrations.filter((r) => r.position === 'goleiro');

  const handleStatusChange = (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado') => {
    const nextStatus: Record<string, 'inscrito' | 'pago' | 'confirmado'> = {
      inscrito: 'pago',
      pago: 'confirmado',
      confirmado: 'inscrito',
    };
    onStatusChange?.(userId, nextStatus[currentStatus]);
  };

  const renderPlayer = (reg: Registration, index: number) => {
    const profile = reg.profiles;
    if (!profile) return null;

    const status = statusConfig[reg.status];
    const StatusIcon = status.icon;

    return (
      <div
        key={reg.id}
        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}</span>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {profile.first_name[0]}{profile.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{profile.first_name} {profile.last_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(reg.user_id, reg.status)}
            >
              Alterar
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Jogadores de Linha ({linhaPlayers.length})</h3>
        </div>
        <div className="space-y-2">
          {linhaPlayers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum jogador inscrito</p>
          ) : (
            linhaPlayers.map((reg, idx) => renderPlayer(reg, idx))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold">Goleiros ({goleiros.length})</h3>
        </div>
        <div className="space-y-2">
          {goleiros.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum goleiro inscrito</p>
          ) : (
            goleiros.map((reg, idx) => renderPlayer(reg, idx))
          )}
        </div>
      </div>
    </div>
  );
}
