import { useState } from 'react';
import { Shuffle, Image, Loader2, Download, Users, Trophy, Share2, Star, AlertCircle } from 'lucide-react';
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

interface TeamDrawResult {
  timeA: {
    nome: string;
    jogadores: { id: string; nome: string; posicao: string; rating: number }[];
    mediaRating: number;
  };
  timeB: {
    nome: string;
    jogadores: { id: string; nome: string; posicao: string; rating: number }[];
    mediaRating: number;
  };
  analise: string;
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
  };

  const updatePlayerRating = (playerId: string, newRating: number) => {
    setPlayerRatings(prev => 
      prev.map(p => p.id === playerId ? { ...p, rating: newRating } : p)
    );
  };

  const handleTeamDraw = async () => {
    if (playerRatings.length < 4) {
      toast({ title: 'Mínimo 4 jogadores confirmados necessários', variant: 'destructive' });
      return;
    }

    setLoadingDraw(true);
    setTeamResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('team-draw', {
        body: { babaId: baba.id, playerData: playerRatings }
      });

      if (error) throw error;
      
      setTeamResult(data);
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

  // Separar goleiros e jogadores de linha
  const goleiros = playerRatings.filter(p => p.posicao === 'goleiro');
  const linhaPlayers = playerRatings.filter(p => p.posicao === 'linha');

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
            ) : !ratingsConfigured && !teamResult ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Dê estrelas para cada jogador confirmado. A IA usará esses níveis para criar times equilibrados.
                </p>

                {/* Jogadores de Linha */}
                <div className="space-y-2">
                  <h5 className="font-medium text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Jogadores de Linha ({linhaPlayers.length})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {linhaPlayers.map((player) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm font-medium truncate flex-1 mr-2">
                          {player.nome}
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

                {/* Goleiros */}
                {goleiros.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      🧤 Goleiros ({goleiros.length})
                    </h5>
                    <div className="space-y-2">
                      {goleiros.map((player) => (
                        <div 
                          key={player.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {player.nome}
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
                )}

                <Button 
                  onClick={() => setRatingsConfigured(true)}
                  className="w-full"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Confirmar Níveis e Sortear
                </Button>
              </>
            ) : ratingsConfigured && !teamResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Níveis configurados! Clique para gerar os times equilibrados.
                </p>
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
                <Button 
                  variant="outline"
                  onClick={() => setRatingsConfigured(false)}
                  className="w-full"
                >
                  Voltar e Editar Níveis
                </Button>
              </div>
            ) : teamResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Time A */}
                  <Card className="border-primary/50">
                    <CardHeader className="pb-2 bg-primary/10">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{teamResult.timeA.nome}</span>
                        <span className="text-sm font-normal">
                          ⭐ {teamResult.timeA.mediaRating.toFixed(1)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <ul className="space-y-1">
                        {teamResult.timeA.jogadores.map((j, idx) => (
                          <li key={j.id} className="text-sm flex items-center justify-between">
                            <span>
                              {idx + 1}. {j.nome}
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

                  {/* Time B */}
                  <Card className="border-destructive/50">
                    <CardHeader className="pb-2 bg-destructive/10">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{teamResult.timeB.nome}</span>
                        <span className="text-sm font-normal">
                          ⭐ {teamResult.timeB.mediaRating.toFixed(1)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <ul className="space-y-1">
                        {teamResult.timeB.jogadores.map((j, idx) => (
                          <li key={j.id} className="text-sm flex items-center justify-between">
                            <span>
                              {idx + 1}. {j.nome}
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
                </div>

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
                      setRatingsConfigured(false);
                    }}
                    className="flex-1"
                  >
                    Editar Níveis
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
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Aguardando votos dos jogadores
                      </p>
                    )}
                  </div>
                </Button>
              </div>
            )}

            {loadingBanner && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Gerando banner...</p>
                <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
              </div>
            )}

            {bannerUrl && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-2">
                  <img 
                    src={bannerUrl} 
                    alt="Banner gerado"
                    className="w-full h-auto rounded-lg"
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
                  Gerar outro banner
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
