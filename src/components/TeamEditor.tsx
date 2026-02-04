import { useState, useCallback } from 'react';
import { ArrowLeftRight, RotateCcw, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

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

interface TeamEditorProps {
  teams: Team[];
  goleirosExcluidos?: { id: string; nome: string; rating: number }[];
  jogadoresRestantes?: Player[];
  onTeamsChange: (teams: Team[]) => void;
  onClose: () => void;
}

const teamColors = [
  { border: 'border-primary/50', bg: 'bg-primary/10', header: 'bg-primary/20' },
  { border: 'border-destructive/50', bg: 'bg-destructive/10', header: 'bg-destructive/20' },
  { border: 'border-warning/50', bg: 'bg-warning/10', header: 'bg-warning/20' },
  { border: 'border-success/50', bg: 'bg-success/10', header: 'bg-success/20' },
  { border: 'border-info/50', bg: 'bg-info/10', header: 'bg-info/20' },
];

export function TeamEditor({ 
  teams: initialTeams, 
  goleirosExcluidos,
  jogadoresRestantes: initialRestantes,
  onTeamsChange, 
  onClose 
}: TeamEditorProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [jogadoresRestantes, setJogadoresRestantes] = useState<Player[]>(initialRestantes || []);
  const [selectedPlayer, setSelectedPlayer] = useState<{ teamIndex: number; playerId: string } | null>(null);
  const [originalTeams] = useState<Team[]>(JSON.parse(JSON.stringify(initialTeams)));
  const [originalRestantes] = useState<Player[]>(JSON.parse(JSON.stringify(initialRestantes || [])));

  // Calcular média de rating de um time
  const calculateTeamAverage = useCallback((jogadores: Player[]): number => {
    if (jogadores.length === 0) return 0;
    const total = jogadores.reduce((sum, p) => sum + p.rating, 0);
    return total / jogadores.length;
  }, []);

  // Atualizar médias de todos os times
  const updateAllAverages = useCallback((updatedTeams: Team[]): Team[] => {
    return updatedTeams.map(team => ({
      ...team,
      mediaRating: calculateTeamAverage(team.jogadores)
    }));
  }, [calculateTeamAverage]);

  // Mover jogador de um time para outro
  const movePlayer = useCallback((fromTeamIndex: number, playerId: string, toTeamIndex: number) => {
    setTeams(prevTeams => {
      const newTeams = JSON.parse(JSON.stringify(prevTeams)) as Team[];
      
      // Encontrar o jogador no time de origem
      const fromTeam = newTeams[fromTeamIndex];
      const playerIndex = fromTeam.jogadores.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) return prevTeams;
      
      // Remover do time de origem
      const [player] = fromTeam.jogadores.splice(playerIndex, 1);
      
      // Adicionar ao time de destino
      newTeams[toTeamIndex].jogadores.push(player);
      
      // Atualizar médias
      return updateAllAverages(newTeams);
    });
    
    setSelectedPlayer(null);
    toast({ title: 'Jogador movido!' });
  }, [updateAllAverages]);

  // Mover jogador dos restantes para um time
  const moveFromRestantes = useCallback((playerId: string, toTeamIndex: number) => {
    const player = jogadoresRestantes.find(p => p.id === playerId);
    if (!player) return;
    
    setJogadoresRestantes(prev => prev.filter(p => p.id !== playerId));
    
    setTeams(prevTeams => {
      const newTeams = JSON.parse(JSON.stringify(prevTeams)) as Team[];
      newTeams[toTeamIndex].jogadores.push(player);
      return updateAllAverages(newTeams);
    });
    
    toast({ title: 'Jogador adicionado ao time!' });
  }, [jogadoresRestantes, updateAllAverages]);

  // Mover jogador de um time para os restantes
  const moveToRestantes = useCallback((teamIndex: number, playerId: string) => {
    setTeams(prevTeams => {
      const newTeams = JSON.parse(JSON.stringify(prevTeams)) as Team[];
      const team = newTeams[teamIndex];
      const playerIndex = team.jogadores.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) return prevTeams;
      
      const [player] = team.jogadores.splice(playerIndex, 1);
      setJogadoresRestantes(prev => [...prev, player]);
      
      return updateAllAverages(newTeams);
    });
    
    setSelectedPlayer(null);
    toast({ title: 'Jogador removido do time!' });
  }, [updateAllAverages]);

  // Resetar para o estado original
  const handleReset = () => {
    setTeams(JSON.parse(JSON.stringify(originalTeams)));
    setJogadoresRestantes(JSON.parse(JSON.stringify(originalRestantes)));
    setSelectedPlayer(null);
    toast({ title: 'Times restaurados!' });
  };

  // Confirmar alterações
  const handleConfirm = () => {
    onTeamsChange(teams);
    toast({ title: 'Alterações salvas!' });
  };

  // Verificar se o jogador está selecionado
  const isPlayerSelected = (teamIndex: number, playerId: string) => {
    return selectedPlayer?.teamIndex === teamIndex && selectedPlayer?.playerId === playerId;
  };

  // Selecionar/desselecionar jogador
  const togglePlayerSelection = (teamIndex: number, playerId: string) => {
    if (isPlayerSelected(teamIndex, playerId)) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer({ teamIndex, playerId });
    }
  };

  // Calcular diferença de média entre maior e menor
  const avgDifference = () => {
    const avgs = teams.map(t => t.mediaRating);
    return Math.max(...avgs) - Math.min(...avgs);
  };

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Diferença: {avgDifference().toFixed(2)} ⭐
          </Badge>
          {avgDifference() < 0.5 && (
            <Badge variant="default" className="bg-success text-xs">
              Times equilibrados!
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Resetar
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            <Check className="h-3 w-3 mr-1" />
            Confirmar
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
        💡 Clique em um jogador para selecioná-lo, depois escolha o time de destino para movê-lo.
      </p>

      {/* Grid de Times */}
      <div className={`grid gap-3 ${
        teams.length === 2 ? 'grid-cols-2' : 
        teams.length === 3 ? 'grid-cols-3' : 
        'grid-cols-2'
      }`}>
        {teams.map((time, teamIdx) => (
          <Card 
            key={teamIdx} 
            className={`${teamColors[teamIdx % teamColors.length].border} transition-all ${
              selectedPlayer && selectedPlayer.teamIndex !== teamIdx 
                ? 'ring-2 ring-primary ring-offset-2 cursor-pointer' 
                : ''
            }`}
            onClick={() => {
              if (selectedPlayer && selectedPlayer.teamIndex !== teamIdx) {
                movePlayer(selectedPlayer.teamIndex, selectedPlayer.playerId, teamIdx);
              }
            }}
          >
            <CardHeader className={`py-2 px-3 ${teamColors[teamIdx % teamColors.length].header}`}>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {time.nome}
                </span>
                <span className="font-bold">
                  ⭐ {time.mediaRating.toFixed(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-3 px-3">
              <ul className="space-y-1">
                {time.jogadores.map((jogador, jIdx) => (
                  <li 
                    key={jogador.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayerSelection(teamIdx, jogador.id);
                    }}
                    className={`text-sm flex items-center justify-between p-1.5 rounded cursor-pointer transition-all ${
                      isPlayerSelected(teamIdx, jogador.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/80'
                    }`}
                  >
                    <span className="flex items-center gap-1 truncate">
                      <span className="text-xs text-muted-foreground w-4">{jIdx + 1}.</span>
                      <span className="truncate">{jogador.nome}</span>
                      {jogador.posicao === 'goleiro' && <span>🧤</span>}
                    </span>
                    <span className={`text-xs shrink-0 ${
                      isPlayerSelected(teamIdx, jogador.id) ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      ⭐{jogador.rating}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* Opção de mover para restantes */}
              {selectedPlayer?.teamIndex === teamIdx && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveToRestantes(teamIdx, selectedPlayer.playerId);
                  }}
                >
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  Remover do time
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goleiros Excluídos */}
      {goleirosExcluidos && goleirosExcluidos.length > 0 && (
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">🧤 Goleiros não sorteados:</p>
          <div className="flex flex-wrap gap-2">
            {goleirosExcluidos.map(g => (
              <span key={g.id} className="text-sm bg-muted px-2 py-1 rounded">
                {g.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Jogadores Restantes */}
      {(jogadoresRestantes.length > 0 || (initialRestantes && initialRestantes.length > 0)) && (
        <div className="bg-warning/10 p-3 rounded-lg border border-warning/30">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Jogadores fora dos times ({jogadoresRestantes.length})
          </p>
          {jogadoresRestantes.length > 0 ? (
            <div className="space-y-2">
              {jogadoresRestantes.map(jogador => (
                <div 
                  key={jogador.id} 
                  className="flex items-center justify-between bg-muted/50 p-2 rounded"
                >
                  <span className="text-sm">
                    {jogador.nome} {jogador.posicao === 'goleiro' && '🧤'} 
                    <span className="text-muted-foreground ml-1">⭐{jogador.rating}</span>
                  </span>
                  <Select onValueChange={(value) => moveFromRestantes(jogador.id, parseInt(value))}>
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue placeholder="Mover para" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {team.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum jogador restante</p>
          )}
        </div>
      )}
    </div>
  );
}
