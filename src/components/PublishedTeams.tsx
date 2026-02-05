import { Trophy, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  nome: string;
  posicao: string;
  rating: number;
}

interface Team {
  nome: string;
  jogadores: Player[];
  mediaRating: number;
}

interface TeamsData {
  times: Team[];
  goleirosExcluidos?: { id: string; nome: string; rating: number }[];
  publishedAt: string;
}

interface PublishedTeamsProps {
  teamsData: TeamsData;
}

const teamColors = [
  { 
    border: 'border-primary/60', 
    bg: 'bg-gradient-to-br from-primary/20 to-primary/5', 
    header: 'bg-primary/30',
    badge: 'bg-primary text-primary-foreground'
  },
  { 
    border: 'border-destructive/60', 
    bg: 'bg-gradient-to-br from-destructive/20 to-destructive/5', 
    header: 'bg-destructive/30',
    badge: 'bg-destructive text-destructive-foreground'
  },
  { 
    border: 'border-warning/60', 
    bg: 'bg-gradient-to-br from-warning/20 to-warning/5', 
    header: 'bg-warning/30',
    badge: 'bg-warning text-warning-foreground'
  },
  { 
    border: 'border-success/60', 
    bg: 'bg-gradient-to-br from-success/20 to-success/5', 
    header: 'bg-success/30',
    badge: 'bg-success text-success-foreground'
  },
  { 
    border: 'border-info/60', 
    bg: 'bg-gradient-to-br from-info/20 to-info/5', 
    header: 'bg-info/30',
    badge: 'bg-info text-info-foreground'
  },
];

export function PublishedTeams({ teamsData }: PublishedTeamsProps) {
  const { times, goleirosExcluidos } = teamsData;

  if (!times || times.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Trophy className="h-5 w-5 text-warning" />
          Times do Baba
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Confira os times sorteados para esta partida
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className={`grid gap-4 ${
          times.length === 2 ? 'md:grid-cols-2' : 
          times.length === 3 ? 'md:grid-cols-3' : 
          times.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : ''
        }`}>
          {times.map((time, teamIdx) => {
            const colors = teamColors[teamIdx % teamColors.length];
            return (
              <Card 
                key={teamIdx} 
                className={`${colors.border} ${colors.bg} border-2 shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
              >
                <CardHeader className={`${colors.header} py-3 px-4`}>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {time.nome}
                    </span>
                    <Badge className={colors.badge}>
                      <Star className="h-3 w-3 mr-1" />
                      {time.mediaRating.toFixed(1)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {time.jogadores.map((jogador, jIdx) => (
                      <li 
                        key={jogador.id} 
                        className="flex items-center justify-between p-2 bg-background/80 rounded-lg text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium w-5">
                            {jIdx + 1}.
                          </span>
                          <span className="truncate font-medium">
                            {jogador.nome}
                          </span>
                          {jogador.posicao === 'goleiro' && (
                            <span title="Goleiro">🧤</span>
                          )}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < jogador.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                            />
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {time.jogadores.length} jogadores
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Goleiros Excluídos */}
        {goleirosExcluidos && goleirosExcluidos.length > 0 && (
          <div className="mt-6 bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              🧤 Goleiros
            </p>
            <div className="flex flex-wrap gap-2">
              {goleirosExcluidos.map(g => (
                <Badge key={g.id} variant="secondary" className="text-sm">
                  {g.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
