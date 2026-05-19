import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BabaCard } from '@/components/BabaCard';
import { RankingWidget } from '@/components/RankingWidget';
import { InstagramEmbed } from '@/components/InstagramEmbed';
import { Calendar, Loader2, ChevronDown, FolderClosed } from 'lucide-react';
import { useBabas } from '@/hooks/useBabas';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

interface BabaCounts {
  [babaId: string]: { linha: number; goleiro: number };
}

export default function BabaList() {
  const { babas, loading } = useBabas();
  const { profile } = useAuthContext();
  const [counts, setCounts] = useState<BabaCounts>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from('registrations')
        .select('baba_id, position');
      
      if (data) {
        const newCounts: BabaCounts = {};
        data.forEach((reg) => {
          if (!newCounts[reg.baba_id]) {
            newCounts[reg.baba_id] = { linha: 0, goleiro: 0 };
          }
          newCounts[reg.baba_id][reg.position]++;
        });
        setCounts(newCounts);
      }
    };

    fetchCounts();

    const channel = supabase
      .channel('all-registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openBabas = babas.filter((b) => b.is_open);
  const closedBabas = babas.filter((b) => !b.is_open);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile Ranking and Instagram - shows first on mobile */}
        <div className="lg:hidden mb-6 space-y-6">
          <RankingWidget />
          <InstagramEmbed />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5 sm:mb-8">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">Próximos Babas</h1>
                {profile && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Olá, {profile.first_name}!
                  </p>
                )}
              </div>
            </div>

            {openBabas.length > 0 && (
              <section className="mb-8 sm:mb-10">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-success flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  Inscrições Abertas
                </h2>
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                  {openBabas.map((baba) => (
                    <BabaCard 
                      key={baba.id} 
                      baba={baba}
                      linhaCount={counts[baba.id]?.linha || 0}
                      goleiroCount={counts[baba.id]?.goleiro || 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {closedBabas.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FolderClosed className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <span className="text-sm sm:text-base font-medium text-muted-foreground">
                        Babas Finalizados ({closedBabas.length})
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 mt-4">
                    {closedBabas.map((baba) => (
                      <BabaCard 
                        key={baba.id} 
                        baba={baba}
                        linhaCount={counts[baba.id]?.linha || 0}
                        goleiroCount={counts[baba.id]?.goleiro || 0}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {babas.length === 0 && (
              <div className="text-center py-12 sm:py-20">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Nenhum baba agendado</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Aguarde o administrador criar novos babas.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Sidebar with Ranking and Instagram */}
          <aside className="hidden lg:block lg:w-80 shrink-0">
            <div className="sticky top-20 space-y-6">
              <RankingWidget />
              <InstagramEmbed />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
