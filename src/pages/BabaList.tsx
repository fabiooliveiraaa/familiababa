import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BabaCard } from '@/components/BabaCard';
import { RankingWidget } from '@/components/RankingWidget';
import { Calendar, Loader2 } from 'lucide-react';
import { useBabas } from '@/hooks/useBabas';
import { useAuthContext } from '@/contexts/AuthContext';
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Próximos Babas</h1>
                <p className="text-muted-foreground">
                  {profile ? `Olá, ${profile.first_name}! ` : ''}
                  Veja os babas disponíveis e inscreva-se.
                </p>
              </div>
            </div>

            {openBabas.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 text-success flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  Inscrições Abertas
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
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
              <section>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                  Inscrições Fechadas
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {closedBabas.map((baba) => (
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

            {babas.length === 0 && (
              <div className="text-center py-20">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Nenhum baba agendado</h2>
                <p className="text-muted-foreground">
                  Aguarde o administrador criar novos babas.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar with Ranking */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-4">
              <RankingWidget />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
