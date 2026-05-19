import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Baba } from '@/hooks/useBabas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface BabaCardProps {
  baba: Baba;
  linhaCount: number;
  goleiroCount: number;
}

export function BabaCard({ baba, linhaCount, goleiroCount }: BabaCardProps) {
  const navigate = useNavigate();

  const spotsLeft = Math.max(0, baba.max_linha_players - linhaCount);
  const isFull = spotsLeft === 0;

  return (
    <Card className="card-hover border-2 border-border/50 bg-card overflow-hidden">
      <CardHeader className="bg-secondary p-3 sm:pb-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-secondary-foreground truncate">{baba.title}</h3>
          {baba.is_open ? (
            <Badge className={`shrink-0 text-xs ${isFull ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}`}>
              {isFull ? 'Lista de espera' : `${spotsLeft} vaga${spotsLeft === 1 ? '' : 's'}`}
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-xs">Fechado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">
            {format(parseISO(baba.date), "EEE, dd 'de' MMM", { locale: ptBR })}
          </span>
          <Clock className="h-4 w-4 text-primary shrink-0 ml-1" />
          <span className="text-xs sm:text-sm">{baba.start_time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm truncate">{baba.location}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm sm:text-base font-bold text-foreground">R$ {Number(baba.price).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm">
              <strong className="text-foreground">{linhaCount}</strong>/{baba.max_linha_players}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-6 pt-0">
        <Button 
          className="w-full btn-glow text-sm sm:text-base h-10 sm:h-11 font-semibold" 
          onClick={() => navigate(`/baba/${baba.id}`)}
        >
          {baba.is_open ? (isFull ? 'Entrar na lista de espera' : 'Quero jogar') : 'Ver detalhes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
