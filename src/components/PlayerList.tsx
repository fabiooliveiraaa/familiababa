import { Check, Clock, DollarSign, User as UserIcon, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Registration } from '@/hooks/useBabas';
import { StarRating } from '@/components/StarRating';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PlayerListProps {
  registrations: Registration[];
  isAdmin?: boolean;
  onStatusChange?: (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado') => void;
  onRemovePlayer?: (userId: string) => void;
}

const statusConfig = {
  inscrito: { label: 'Aguardando', icon: Clock, className: 'bg-muted text-muted-foreground' },
  pago: { label: 'Pago', icon: DollarSign, className: 'bg-warning text-warning-foreground' },
  confirmado: { label: 'Confirmado', icon: Check, className: 'bg-success text-success-foreground' },
};

export function PlayerList({ registrations, isAdmin, onStatusChange, onRemovePlayer }: PlayerListProps) {
  const navigate = useNavigate();
  
  const linhaConfirmed = registrations.filter((r) => r.position === 'linha' && r.status === 'confirmado');
  const linhaPending = registrations.filter((r) => r.position === 'linha' && r.status !== 'confirmado');
  const goleiros = registrations.filter((r) => r.position === 'goleiro');

  const handleStatusChange = (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado') => {
    const nextStatus: Record<string, 'inscrito' | 'pago' | 'confirmado'> = {
      inscrito: 'pago',
      pago: 'confirmado',
      confirmado: 'inscrito',
    };
    onStatusChange?.(userId, nextStatus[currentStatus]);
  };

  const renderPlayer = (reg: Registration, index: number, showStatus = true) => {
    const profile = reg.profiles;
    if (!profile) return null;

    const status = statusConfig[reg.status];
    const StatusIcon = status.icon;

    return (
      <div
        key={reg.id}
        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
          onClick={() => navigate(`/profile/${reg.user_id}`)}
        >
          <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}</span>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {profile.first_name[0]}{profile.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground hover:underline">{profile.first_name} {profile.last_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showStatus && (
            <Badge className={status.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          )}
          {isAdmin && reg.payment_proof_url && (
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3 w-3 mr-1" />
                Ver
              </a>
            </Button>
          )}
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(reg.user_id, reg.status)}
              >
                Alterar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover jogador?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover {profile.first_name} {profile.last_name} da lista?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemovePlayer?.(reg.user_id)}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Confirmed Linha Players */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-success" />
          <h3 className="text-lg font-bold">Jogadores Confirmados ({linhaConfirmed.length})</h3>
        </div>
        <div className="space-y-2">
          {linhaConfirmed.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum jogador confirmado ainda</p>
          ) : (
            linhaConfirmed.map((reg, idx) => renderPlayer(reg, idx, false))
          )}
        </div>
      </div>

      {/* Goleiros */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold">Goleiros ({goleiros.length})</h3>
        </div>
        <div className="space-y-2">
          {goleiros.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum goleiro inscrito</p>
          ) : (
            goleiros.map((reg, idx) => renderPlayer(reg, idx, false))
          )}
        </div>
      </div>

      {/* Pending Linha Players */}
      {(isAdmin || linhaPending.length > 0) && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-bold">Aguardando Confirmação ({linhaPending.length})</h3>
          </div>
          {isAdmin ? (
            <div className="space-y-2">
              {linhaPending.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum jogador pendente</p>
              ) : (
                linhaPending.map((reg, idx) => renderPlayer(reg, idx))
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {linhaPending.length} jogador(es) aguardando confirmação de pagamento
            </p>
          )}
        </div>
      )}
    </div>
  );
}