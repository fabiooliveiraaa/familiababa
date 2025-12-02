import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Vote, Crown, Medal, Award, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBabaVotes } from '@/hooks/useBabaVotes';
import { Registration } from '@/hooks/useBabas';
import { cn } from '@/lib/utils';

interface BabaVotingProps {
  babaId: string;
  registrations: Registration[];
  userId?: string;
  isParticipant: boolean;
}

export function BabaVoting({ babaId, registrations, userId, isParticipant }: BabaVotingProps) {
  const navigate = useNavigate();
  const { ranking, loading, vote, getUserVote } = useBabaVotes(babaId);
  const [voting, setVoting] = useState(false);

  const confirmedPlayers = registrations.filter(r => r.status === 'confirmado');
  const userVote = userId ? getUserVote(userId) : null;

  const handleVote = async (votedForId: string) => {
    if (!userId) return;
    setVoting(true);
    await vote(userId, votedForId);
    setVoting(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-warning" />;
    if (index === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-warning/50">
      <CardHeader className="bg-warning/10">
        <CardTitle className="flex items-center gap-2 text-warning">
          <Trophy className="h-5 w-5" />
          Melhor do Baba
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Ranking */}
        {ranking.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ranking em Tempo Real
            </h4>
            <div className="space-y-2">
              {ranking.map((player, index) => (
                <div
                  key={player.user_id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-all",
                    index === 0 && "bg-warning/20 border border-warning/30",
                    index === 1 && "bg-muted/80",
                    index === 2 && "bg-muted/60",
                    index > 2 && "bg-muted/30"
                  )}
                >
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => navigate(`/profile/${player.user_id}`)}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <Avatar className={cn(
                      "h-10 w-10 border-2",
                      index === 0 && "border-warning",
                      index !== 0 && "border-primary/20"
                    )}>
                      <AvatarImage src={player.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                        {player.profile?.first_name?.[0]}{player.profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={cn(
                        "font-medium hover:underline",
                        index === 0 && "text-warning font-bold"
                      )}>
                        {player.profile?.first_name} {player.profile?.last_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"} className={cn(
                    index === 0 && "bg-warning text-warning-foreground"
                  )}>
                    {player.vote_count} {player.vote_count === 1 ? 'voto' : 'votos'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {ranking.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhum voto ainda. Seja o primeiro a votar!
          </p>
        )}

        {/* Voting Section */}
        {isParticipant && userId && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Vote className="h-4 w-4" />
              {userVote ? 'Alterar seu voto' : 'Vote no melhor jogador'}
            </h4>
            {userVote && (
              <p className="text-sm text-muted-foreground mb-3">
                Você votou em: {confirmedPlayers.find(p => p.user_id === userVote.voted_for_id)?.profiles?.first_name}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {confirmedPlayers
                .filter(p => p.user_id !== userId) // Can't vote for yourself
                .map(player => (
                  <Button
                    key={player.user_id}
                    variant={userVote?.voted_for_id === player.user_id ? "default" : "outline"}
                    className={cn(
                      "h-auto py-2 px-3 flex items-center gap-2",
                      userVote?.voted_for_id === player.user_id && "bg-warning text-warning-foreground hover:bg-warning/90"
                    )}
                    onClick={() => handleVote(player.user_id)}
                    disabled={voting}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={player.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {player.profiles?.first_name?.[0]}{player.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate">
                      {player.profiles?.first_name}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        )}

        {!isParticipant && userId && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Apenas participantes confirmados podem votar
          </p>
        )}

        {!userId && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Faça login para votar no melhor jogador
          </p>
        )}
      </CardContent>
    </Card>
  );
}