import { useState } from 'react';
import { Shuffle, Image, Loader2, Download, Users, Trophy, Share2, Star, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Baba, Registration } from '@/hooks/useBabas';
import { StarRating } from '@/components/StarRating';
import { useBabaVotes } from '@/hooks/useBabaVotes';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminAIToolsProps {
  baba: Baba;
  registrations: Registration[];
}

interface PlayerRating {
  id: string;
  nome: string;
  posicao: string;
  rating: number;
}

interface TeamResult {
  nome: string;
  jogadores: { id: string; nome: string; posicao: string; rating: number }[];
  mediaRating: number;
}

interface TeamDrawResult {
  times: TeamResult[];
  goleirosExcluidos?: { id: string; nome: string; rating: number }[];
  jogadoresRestantes?: { id: string; nome: string; posicao: string; rating: number }[];
  analise: string;
}

interface DrawConfig {
  numberOfTeams: number;
  playersPerTeam: number | 'auto';
  includeGoalkeepers: boolean;
}

export function AdminAITools({ baba, registrations }: AdminAIToolsProps) {
  const [teamDrawOpen, setTeamDrawOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [loadingDraw, setLoadingDraw] = useState(false);
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [teamResult, setTeamResult] = useState<TeamDrawResult | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'promotional' | 'teams' | 'bestPlayer'>('promotional');
  
  // Estado para ratings manuais dos jogadores
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([]);
  const [ratingsConfigured, setRatingsConfigured] = useState(false);
  
  // Estado para configuração do sorteio
  const [drawConfig, setDrawConfig] = useState<DrawConfig>({
    numberOfTeams: 2,
    playersPerTeam: 'auto',
    includeGoalkeepers: true,
  });
  const [configStep, setConfigStep] = useState<'config' | 'ratings' | 'confirm' | 'result'>('config');

  // Hook para obter ranking de votação
  const { ranking } = useBabaVotes(baba.id);
  const topVotedPlayer = ranking.length > 0 ? ranking[0] : null;

  const confirmedPlayers = registrations.filter(r => r.status === 'confirmado');

  // Inicializar ratings quando abrir o dialog
  const initializeRatings = () => {
    const initialRatings = confirmedPlayers.map(r => {
      const name = r.is_mensalista 
        ? r.manual_name 
        : `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim();
      
      return {
        id: r.id,
        nome: name || 'Jogador',
        posicao: r.position,
        rating: 3, // Rating padrão
      };
    });
    setPlayerRatings(initialRatings);
    setRatingsConfigured(false);
    setTeamResult(null);
    setConfigStep('config');
    setDrawConfig({
      numberOfTeams: 2,
      playersPerTeam: 'auto',
      includeGoalkeepers: true,
    });
  };

  const updatePlayerRating = (playerId: string, newRating: number) => {
    setPlayerRatings(prev => 
      prev.map(p => p.id === playerId ? { ...p, rating: newRating } : p)
    );
  };

  // Filtrar jogadores baseado na configuração
  const getPlayersForDraw = () => {
    if (drawConfig.includeGoalkeepers) {
      return playerRatings;
    }
    return playerRatings.filter(p => p.posicao === 'linha');
  };

  const handleTeamDraw = async () => {
    const playersForDraw = getPlayersForDraw();
    const minPlayers = drawConfig.numberOfTeams * 2;
    
    if (playersForDraw.length < minPlayers) {
      toast({ 
        title: `Mínimo ${minPlayers} jogadores necessários para ${drawConfig.numberOfTeams} times`, 
        variant: 'destructive' 
      });
      return;
    }

    setLoadingDraw(true);
    setTeamResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('team-draw', {
        body: { 
          babaId: baba.id, 
          playerData: playersForDraw,
          config: {
            numberOfTeams: drawConfig.numberOfTeams,
            playersPerTeam: drawConfig.playersPerTeam,
            includeGoalkeepers: drawConfig.includeGoalkeepers,
          }
        }
      });

      if (error) throw error;
      
      // Adicionar goleiros excluídos se não foram incluídos no sorteio
      const result: TeamDrawResult = {
        ...data,
        goleirosExcluidos: !drawConfig.includeGoalkeepers 
          ? playerRatings.filter(p => p.posicao === 'goleiro').map(g => ({ id: g.id, nome: g.nome, rating: g.rating }))
          : undefined
      };
      
      setTeamResult(result);
      setConfigStep('result');
      toast({ title: 'Times sorteados com sucesso!' });
    } catch (error) {
      console.error('Error drawing teams:', error);
      toast({ 
        title: 'Erro ao sortear times', 
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive' 
      });
    } finally {
      setLoadingDraw(false);
    }
  };

  const handleGenerateBanner = async (type: 'promotional' | 'teams' | 'bestPlayer') => {
    // Verificar se há jogador votado para banner do craque
    if (type === 'bestPlayer' && !topVotedPlayer) {
      toast({ 
        title: 'Nenhum voto registrado', 
        description: 'Aguarde os jogadores votarem no craque do baba',
        variant: 'destructive' 
      });
      return;
    }

    setBannerType(type);
    setLoadingBanner(true);
    setBannerUrl(null);

    try {
      const babaInfo = {
        title: baba.title,
        date: baba.date,
        startTime: baba.start_time,
        endTime: baba.end_time,
        location: baba.location,
        price: baba.price,
      };

      // Usar automaticamente o jogador mais votado
      const playerInfo = type === 'bestPlayer' && topVotedPlayer ? {
        name: `${topVotedPlayer.profile?.first_name} ${topVotedPlayer.profile?.last_name}`.trim(),
        votes: topVotedPlayer.vote_count
      } : undefined;

      const { data, error } = await supabase.functions.invoke('generate-banner', {
        body: { type, babaInfo, playerInfo }
      });

      if (error) throw error;
      
      setBannerUrl(data.imageUrl);
      toast({ title: 'Banner gerado com sucesso!' });
    } catch (error) {
      console.error('Error generating banner:', error);
      toast({ 
        title: 'Erro ao gerar banner', 
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive' 
      });
    } finally {
      setLoadingBanner(false);
    }
  };

  const downloadBanner = () => {
    if (bannerUrl) {
      const link = document.createElement('a');
      link.href = bannerUrl;
      link.download = `banner-${baba.title.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareToWhatsApp = () => {
    if (bannerUrl) {
      navigator.clipboard.writeText(bannerUrl);
      toast({ title: 'URL da imagem copiada!' });
    }
  };

  // Separar goleiros e jogadores de linha para exibição
  const goleiros = playerRatings.filter(p => p.posicao === 'goleiro');
  const linhaPlayers = playerRatings.filter(p => p.posicao === 'linha');
  
  // Jogadores que serão sorteados baseado na config
  const playersForDraw = getPlayersForDraw();

  // Cores para os times
  const teamColors = [
    { border: 'border-primary/50', bg: 'bg-primary/10' },
    { border: 'border-destructive/50', bg: 'bg-destructive/10' },
    { border: 'border-warning/50', bg: 'bg-warning/10' },
    { border: 'border-success/50', bg: 'bg-success/10' },
    { border: 'border-info/50', bg: 'bg-info/10' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Ferramentas IA
      </h4>

      {/* Team Draw Dialog */}
      <Dialog open={teamDrawOpen} onOpenChange={(open) => {
        setTeamDrawOpen(open);
        if (open) initializeRatings();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Shuffle className="h-4 w-4 mr-2" />
            Sortear Times (IA)
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Sorteio Inteligente de Times
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {confirmedPlayers.length < 4 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Mínimo 4 jogadores confirmados necessários</p>
                <p className="text-sm">Atualmente: {confirmedPlayers.length} confirmados</p>
              </div>
            ) : configStep === 'config' ? (
              /* Etapa 1: Configuração */
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h5 className="font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuração do Sorteio
                  </h5>
                  
                  {/* Quantidade de Times */}
                  <div className="space-y-2">
                    <Label>Quantidade de Times</Label>
                    <Select 
                      value={String(drawConfig.numberOfTeams)} 
                      onValueChange={(v) => setDrawConfig(prev => ({ ...prev, numberOfTeams: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} times</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Jogadores por Time */}
                  <div className="space-y-2">
                    <Label>Jogadores por Time</Label>
                    <Select 
                      value={String(drawConfig.playersPerTeam)} 
                      onValueChange={(v) => setDrawConfig(prev => ({ 
                        ...prev, 
                        playersPerTeam: v === 'auto' ? 'auto' : parseInt(v) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático (dividir igual)</SelectItem>
                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} jogadores</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Se automático, os jogadores serão divididos igualmente entre os times
                    </p>
                  </div>

                  {/* Incluir Goleiros */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incluir Goleiros no Sorteio</Label>
                      <p className="text-xs text-muted-foreground">
                        {goleiros.length} goleiro(s) confirmado(s)
                      </p>
                    </div>
                    <Switch
                      checked={drawConfig.includeGoalkeepers}
                      onCheckedChange={(checked) => setDrawConfig(prev => ({ ...prev, includeGoalkeepers: checked }))}
                    />
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><strong>Resumo:</strong></p>
                  <p>• {drawConfig.numberOfTeams} times</p>
                  <p>• {playersForDraw.length} jogadores serão sorteados</p>
                  {!drawConfig.includeGoalkeepers && goleiros.length > 0 && (
                    <p className="text-muted-foreground">• {goleiros.length} goleiro(s) não serão sorteados</p>
                  )}
                  {drawConfig.playersPerTeam !== 'auto' && (
                    <p>• {drawConfig.playersPerTeam} jogadores por time</p>
                  )}
                </div>

                <Button 
                  onClick={() => setConfigStep('ratings')}
                  className="w-full"
                  disabled={playersForDraw.length < drawConfig.numberOfTeams * 2}
                >
                  Continuar para Níveis
                </Button>
                
                {playersForDraw.length < drawConfig.numberOfTeams * 2 && (
                  <p className="text-xs text-destructive text-center">
                    Mínimo {drawConfig.numberOfTeams * 2} jogadores necessários para {drawConfig.numberOfTeams} times
                  </p>
                )}
              </div>
            ) : configStep === 'ratings' ? (
              /* Etapa 2: Atribuir Níveis */
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Dê estrelas para cada jogador. A IA usará esses níveis para criar times equilibrados.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setConfigStep('config')}
                  >
                    ← Voltar
                  </Button>
                </div>

                {/* Jogadores que serão sorteados */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {drawConfig.includeGoalkeepers ? 'Todos os Jogadores' : 'Jogadores de Linha'} ({playersForDraw.length})
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {playersForDraw.map((player) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm font-medium truncate flex-1 mr-2">
                          {player.nome}
                          {player.posicao === 'goleiro' && ' 🧤'}
                        </span>
                        <StarRating
                          rating={player.rating}
                          interactive
                          size="sm"
                          onRatingChange={(rating) => updatePlayerRating(player.id, rating)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goleiros excluídos (se houver) */}
                {!drawConfig.includeGoalkeepers && goleiros.length > 0 && (
                  <div className="space-y-2 opacity-60">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      🧤 Goleiros não sorteados ({goleiros.length})
                    </h5>
                    <div className="space-y-1">
                      {goleiros.map((player) => (
                        <div 
                          key={player.id} 
                          className="text-sm p-2 bg-muted/50 rounded-lg text-muted-foreground"
                        >
                          {player.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => setConfigStep('confirm')}
                  className="w-full"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Confirmar Níveis
                </Button>
              </>
            ) : configStep === 'confirm' ? (
              /* Etapa 3: Confirmar e Sortear */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Níveis configurados! Clique para gerar os times equilibrados.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setConfigStep('ratings')}
                  >
                    ← Voltar
                  </Button>
                </div>
                
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><strong>Configuração:</strong></p>
                  <p>• {drawConfig.numberOfTeams} times</p>
                  <p>• {playersForDraw.length} jogadores</p>
                  {drawConfig.playersPerTeam !== 'auto' && (
                    <p>• {drawConfig.playersPerTeam} jogadores por time</p>
                  )}
                </div>
                
                <Button 
                  onClick={handleTeamDraw} 
                  disabled={loadingDraw}
                  className="w-full"
                >
                  {loadingDraw ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sorteando times...
                    </>
                  ) : (
                    <>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Sortear Times com IA
                    </>
                  )}
                </Button>
              </div>
            ) : configStep === 'result' && teamResult && (
              /* Etapa 4: Resultado */
              <div className="space-y-4">
                {/* Grid de Times Dinâmico */}
                <div className={`grid gap-4 ${
                  teamResult.times.length === 2 ? 'grid-cols-2' : 
                  teamResult.times.length === 3 ? 'grid-cols-3' : 
                  'grid-cols-2'
                }`}>
                  {teamResult.times.map((time, idx) => (
                    <Card key={idx} className={teamColors[idx % teamColors.length].border}>
                      <CardHeader className={`pb-2 ${teamColors[idx % teamColors.length].bg}`}>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{time.nome}</span>
                          <span className="text-sm font-normal">
                            ⭐ {time.mediaRating.toFixed(1)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <ul className="space-y-1">
                          {time.jogadores.map((j, jIdx) => (
                            <li key={j.id} className="text-sm flex items-center justify-between">
                              <span>
                                {jIdx + 1}. {j.nome}
                                {j.posicao === 'goleiro' && ' 🧤'}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                ⭐{j.rating}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Goleiros Excluídos */}
                {teamResult.goleirosExcluidos && teamResult.goleirosExcluidos.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">🧤 Goleiros não sorteados:</p>
                    <div className="flex flex-wrap gap-2">
                      {teamResult.goleirosExcluidos.map(g => (
                        <span key={g.id} className="text-sm bg-muted px-2 py-1 rounded">
                          {g.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jogadores Restantes */}
                {teamResult.jogadoresRestantes && teamResult.jogadoresRestantes.length > 0 && (
                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/30">
                    <p className="text-sm font-medium mb-2">⚠️ Jogadores restantes (não couberam nos times):</p>
                    <div className="flex flex-wrap gap-2">
                      {teamResult.jogadoresRestantes.map(j => (
                        <span key={j.id} className="text-sm bg-muted px-2 py-1 rounded">
                          {j.nome} {j.posicao === 'goleiro' && '🧤'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Análise:</strong> {teamResult.analise}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTeamResult(null);
                      setConfigStep('config');
                    }}
                    className="flex-1"
                  >
                    Nova Configuração
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTeamDraw}
                    disabled={loadingDraw}
                    className="flex-1"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Sortear Novamente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Generator Dialog */}
      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Image className="h-4 w-4 mr-2" />
            Gerar Banner (IA)
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Gerar Banner com IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {!bannerUrl && !loadingBanner && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo de banner para gerar:
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleGenerateBanner('promotional')}
                >
                  <Share2 className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Banner Promocional</p>
                    <p className="text-xs text-muted-foreground">Para divulgar o baba no WhatsApp</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleGenerateBanner('teams')}
                >
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Card de Times</p>
                    <p className="text-xs text-muted-foreground">Time A vs Time B</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleGenerateBanner('bestPlayer')}
                  disabled={!topVotedPlayer}
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Craque do Baba</p>
                    {topVotedPlayer ? (
                      <p className="text-xs text-muted-foreground">
                        {topVotedPlayer.profile?.first_name} {topVotedPlayer.profile?.last_name} ({topVotedPlayer.vote_count} votos)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Aguardando votação
                      </p>
                    )}
                  </div>
                </Button>
              </div>
            )}

            {loadingBanner && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Gerando banner com IA...</p>
                <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
              </div>
            )}

            {bannerUrl && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={bannerUrl} 
                    alt="Banner gerado" 
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={downloadBanner} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button variant="outline" onClick={shareToWhatsApp} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copiar URL
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={() => setBannerUrl(null)}
                  className="w-full"
                >
                  Gerar Outro Banner
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
