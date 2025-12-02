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
      <CardHeader className="bg-secondary pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-secondary-foreground">{baba.title}</h3>
          <Badge variant={baba.is_open ? 'default' : 'secondary'} className={baba.is_open ? 'bg-success text-success-foreground' : ''}>
            {baba.is_open ? 'Aberto' : 'Fechado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {format(parseISO(baba.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm">{baba.time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm">{baba.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">R$ {Number(baba.price).toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <div className="flex gap-4 text-sm">
              <span>Linha: <strong className="text-foreground">{linhaCount}/{baba.max_linha_players}</strong></span>
              <span>Goleiros: <strong className="text-foreground">{goleiroCount}/{baba.max_goleiros}</strong></span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full btn-glow" 
          onClick={() => navigate(`/baba/${baba.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
