import { Check, Clock, DollarSign, User as UserIcon, FileText, Trash2, ArrowUp, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Registration } from '@/hooks/useBabas';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PlayerListProps {
  registrations: Registration[];
  isAdmin?: boolean;
  onStatusChange?: (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => void;
  onRemovePlayer?: (userId: string) => void;
  onPromoteFromWaitingList?: (userId: string) => void;
}

const statusConfig = {
  inscrito: { label: 'Aguardando', icon: Clock, className: 'bg-muted text-muted-foreground' },
  pago: { label: 'Pago', icon: DollarSign, className: 'bg-warning text-warning-foreground' },
  confirmado: { label: 'Confirmado', icon: Check, className: 'bg-success text-success-foreground' },
  lista_espera: { label: 'Lista de Espera', icon: Clock, className: 'bg-secondary text-secondary-foreground' },
};

export function PlayerList({ registrations, isAdmin, onStatusChange, onRemovePlayer, onPromoteFromWaitingList }: PlayerListProps) {
  const navigate = useNavigate();
  
  const linhaConfirmed = registrations.filter((r) => r.position === 'linha' && r.status === 'confirmado');
  const linhaPending = registrations.filter((r) => r.position === 'linha' && r.status !== 'confirmado' && r.status !== 'lista_espera');
  const goleiros = registrations.filter((r) => r.position === 'goleiro');
  const waitingList = registrations
    .filter((r) => r.status === 'lista_espera')
    .sort((a, b) => (a.waiting_position || 0) - (b.waiting_position || 0));

  const handleStatusChange = (userId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => {
    const nextStatus: Record<string, 'inscrito' | 'pago' | 'confirmado'> = {
      inscrito: 'pago',
      pago: 'confirmado',
      confirmado: 'inscrito',
    };
    if (currentStatus !== 'lista_espera') {
      onStatusChange?.(userId, nextStatus[currentStatus]);
    }
  };

  const renderPlayer = (reg: Registration, index: number, showStatus = true, isWaitingList = false) => {
    const profile = reg.profiles;
    const isManualEntry = !profile && reg.manual_name;
    
    // Skip if no profile and no manual name
    if (!profile && !isManualEntry) return null;

    const displayName = isManualEntry ? reg.manual_name : `${profile?.first_name} ${profile?.last_name}`;
    const initials = isManualEntry 
      ? reg.manual_name!.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : `${profile?.first_name[0]}${profile?.last_name[0]}`;

    const status = statusConfig[reg.status];
    const StatusIcon = status.icon;

    return (
      <div
        key={reg.id}
        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <div 
          className={`flex items-center gap-3 ${!isManualEntry ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={() => !isManualEntry && reg.user_id && navigate(`/profile/${reg.user_id}`)}
        >
          <span className="text-sm font-bold text-muted-foreground w-6">
            {isWaitingList ? reg.waiting_position : index + 1}
          </span>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <p className={`font-medium text-foreground ${!isManualEntry ? 'hover:underline' : ''}`}>{displayName}</p>
            {reg.is_mensalista && (
              <span title="Mensalista">👑</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showStatus && !isWaitingList && (
            <Badge className={status.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          )}
          {isAdmin && reg.payment_proof_url && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-primary/20 hover:bg-primary/30 text-primary"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Comprovante
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comprovante de Pagamento - {displayName}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 max-h-[60vh] overflow-auto">
                    {reg.payment_proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={reg.payment_proof_url} 
                        alt="Comprovante de pagamento"
                        className="w-full h-auto rounded-lg"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Arquivo PDF ou outro formato</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir em nova aba
                      </a>
                    </Button>
                    {reg.user_id && (
                      <Button
                        onClick={() => handleStatusChange(reg.user_id!, 'confirmado')}
                        className="bg-success hover:bg-success/90"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Pagamento
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {isAdmin && isWaitingList && reg.user_id && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onPromoteFromWaitingList?.(reg.user_id!)}
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Subir
            </Button>
          )}
          {isAdmin && !isWaitingList && !isManualEntry && reg.user_id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(reg.user_id!, reg.status)}
            >
              Alterar
            </Button>
          )}
          {isAdmin && (
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
                    Tem certeza que deseja remover {displayName} da lista?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemovePlayer?.(reg.id)}>
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

      {/* Waiting List */}
      {(isAdmin || waitingList.length > 0) && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-secondary-foreground" />
            <h3 className="text-lg font-bold">Lista de Espera ({waitingList.length})</h3>
          </div>
          <div className="space-y-2">
            {waitingList.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum jogador na lista de espera</p>
            ) : (
              waitingList.map((reg, idx) => renderPlayer(reg, idx, false, true))
            )}
          </div>
        </div>
      )}
    </div>
  );
}