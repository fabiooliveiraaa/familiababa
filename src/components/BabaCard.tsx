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

  return (
    <Card className="card-hover border-2 border-border/50 bg-card overflow-hidden">
      <CardHeader className="bg-secondary p-3 sm:pb-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-secondary-foreground truncate">{baba.title}</h3>
          <Badge variant={baba.is_open ? 'default' : 'secondary'} className={`shrink-0 text-xs ${baba.is_open ? 'bg-success text-success-foreground' : ''}`}>
            {baba.is_open ? 'Aberto' : 'Fechado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">
            {format(parseISO(baba.date), "EEE, dd 'de' MMM", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm">{baba.start_time} - {baba.end_time}</span>
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
          className="w-full btn-glow text-sm sm:text-base h-9 sm:h-10" 
          onClick={() => navigate(`/baba/${baba.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
