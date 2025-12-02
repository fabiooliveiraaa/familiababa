import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Baba } from '@/types/baba';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface BabaCardProps {
  baba: Baba;
}

export function BabaCard({ baba }: BabaCardProps) {
  const navigate = useNavigate();
  
  const linhaCount = baba.registrations.filter((r) => r.position === 'linha').length;
  const goleiroCount = baba.registrations.filter((r) => r.position === 'goleiro').length;

  return (
    <Card className="card-hover border-2 border-border/50 bg-card overflow-hidden">
      <CardHeader className="bg-secondary pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-secondary-foreground">{baba.title}</h3>
          <Badge variant={baba.isOpen ? 'default' : 'secondary'} className={baba.isOpen ? 'bg-success text-success-foreground' : ''}>
            {baba.isOpen ? 'Aberto' : 'Fechado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {format(baba.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
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
          <span className="text-sm font-semibold">R$ {baba.price.toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <div className="flex gap-4 text-sm">
              <span>Linha: <strong className="text-foreground">{linhaCount}/{baba.maxLinhaPlayers}</strong></span>
              <span>Goleiros: <strong className="text-foreground">{goleiroCount}/{baba.maxGoleiros}</strong></span>
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
