import { useRanking } from '@/hooks/usePlayerStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RankingWidget() {
  const { ranking, loading } = useRanking(10);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Jogadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum jogador no ranking ainda. Participe dos babas!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{position}</span>;
    }
  };

  const getRankBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-l-2 border-yellow-500';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-transparent border-l-2 border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-transparent border-l-2 border-amber-600';
      default:
        return 'hover:bg-muted/50';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 overflow-hidden">
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Ranking de Jogadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-2 sm:p-3">
        {ranking.map((player, index) => (
          <Link 
            key={player.user_id} 
            to={`/profile/${player.user_id}`}
            className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all ${getRankBg(index + 1)}`}
          >
            <div className="flex items-center justify-center w-5 sm:w-6 shrink-0">
              {getRankIcon(index + 1)}
            </div>
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border shrink-0">
              <AvatarImage src={player.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {player.first_name?.[0]}{player.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">
                {player.first_name} {player.last_name}
              </p>
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                <span>{player.total_matches} babas</span>
                {player.craque_titles > 0 && (
                  <span className="text-yellow-500 hidden xs:inline">⭐ {player.craque_titles}x</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs sm:text-sm font-bold text-primary">{player.ranking_score}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">pts</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
