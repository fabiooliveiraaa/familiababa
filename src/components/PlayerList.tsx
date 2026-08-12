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
  onStatusChange?: (registrationId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => void;
  onRemovePlayer?: (registrationId: string) => void;
  onPromoteFromWaitingList?: (registrationId: string) => void;
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

  const handleStatusChange = (registrationId: string, currentStatus: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => {
    const nextStatus: Record<string, 'inscrito' | 'pago' | 'confirmado'> = {
      inscrito: 'pago',
      pago: 'confirmado',
      confirmado: 'inscrito',
    };
    if (currentStatus !== 'lista_espera') {
      onStatusChange?.(registrationId, nextStatus[currentStatus]);
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
        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2 sm:gap-0"
      >
        <div 
          className={`flex items-center gap-2 sm:gap-3 min-w-0 ${!isManualEntry ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={() => !isManualEntry && reg.user_id && navigate(`/profile/${reg.user_id}`)}
        >
          <span className="text-xs sm:text-sm font-bold text-muted-foreground w-5 sm:w-6 shrink-0 text-center">
            {isWaitingList ? reg.waiting_position : index + 1}
          </span>
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/20 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs sm:text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <p className={`text-sm sm:text-base font-medium text-foreground truncate ${!isManualEntry ? 'hover:underline' : ''}`}>{displayName}</p>
            {reg.is_mensalista && (
              <span title="Mensalista" className="shrink-0">👑</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 ml-7 sm:ml-0 flex-wrap sm:flex-nowrap">
          {showStatus && !isWaitingList && (
            <Badge className={`${status.className} text-xs`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">{status.label}</span>
              <span className="xs:hidden">{status.label.slice(0, 3)}</span>
            </Badge>
          )}
          {isAdmin && reg.payment_proof_url && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-primary/20 hover:bg-primary/30 text-primary h-7 sm:h-8 px-2 sm:px-3"
                >
                  <Eye className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Comprovante</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">Comprovante - {displayName}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-2 sm:p-4 max-h-[50vh] overflow-auto">
                    {reg.payment_proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={reg.payment_proof_url} 
                        alt="Comprovante de pagamento"
                        className="w-full h-auto rounded-lg"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-sm">Arquivo PDF ou outro formato</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                    <Button
                      variant="outline"
                      asChild
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir em nova aba
                      </a>
                    </Button>
                    {(
                      <Button
                        onClick={() => handleStatusChange(reg.id, 'confirmado')}
                        className="bg-success hover:bg-success/90 w-full sm:w-auto"
                        size="sm"
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
          {isAdmin && isWaitingList && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onPromoteFromWaitingList?.(reg.id)}
              className="h-7 sm:h-8 px-2 sm:px-3"
            >
              <ArrowUp className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Subir</span>
            </Button>
          )}
          {isAdmin && !isWaitingList && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(reg.id, reg.status)}
              className="h-7 sm:h-8 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Alterar</span>
              <span className="sm:hidden">Alt</span>
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-7 sm:h-8 px-2">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover jogador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover {displayName} da lista?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemovePlayer?.(reg.id)} className="w-full sm:w-auto">
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
    <div className="space-y-4 sm:space-y-6">
      {/* Confirmed Linha Players */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          <h3 className="text-base sm:text-lg font-bold">Confirmados ({linhaConfirmed.length})</h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {linhaConfirmed.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm">Nenhum jogador confirmado ainda</p>
          ) : (
            linhaConfirmed.map((reg, idx) => renderPlayer(reg, idx, false))
          )}
        </div>
      </div>

      {/* Goleiros */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          <h3 className="text-base sm:text-lg font-bold">Goleiros ({goleiros.length})</h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {goleiros.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm">Nenhum goleiro inscrito</p>
          ) : (
            goleiros.map((reg, idx) => renderPlayer(reg, idx, false))
          )}
        </div>
      </div>

      {/* Pending Linha Players */}
      {(isAdmin || linhaPending.length > 0) && (
        <div className="border-t pt-4 sm:pt-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            <h3 className="text-base sm:text-lg font-bold">Aguardando ({linhaPending.length})</h3>
          </div>
          {isAdmin ? (
            <div className="space-y-1.5 sm:space-y-2">
              {linhaPending.length === 0 ? (
                <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm">Nenhum jogador pendente</p>
              ) : (
                linhaPending.map((reg, idx) => renderPlayer(reg, idx))
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm">
              {linhaPending.length} jogador(es) aguardando confirmação
            </p>
          )}
        </div>
      )}

      {/* Waiting List */}
      {(isAdmin || waitingList.length > 0) && (
        <div className="border-t pt-4 sm:pt-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
            <h3 className="text-base sm:text-lg font-bold">Lista de Espera ({waitingList.length})</h3>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {waitingList.length === 0 ? (
              <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm">Nenhum jogador na lista de espera</p>
            ) : (
              waitingList.map((reg, idx) => renderPlayer(reg, idx, false, true))
            )}
          </div>
        </div>
      )}
    </div>
  );
}