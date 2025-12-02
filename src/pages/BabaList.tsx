import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { BabaCard } from '@/components/BabaCard';
import { Calendar } from 'lucide-react';

export default function BabaList() {
  const { babas, currentUser } = useApp();

  const openBabas = babas.filter((b) => b.isOpen);
  const closedBabas = babas.filter((b) => !b.isOpen);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Próximos Babas</h1>
            <p className="text-muted-foreground">
              {currentUser ? `Olá, ${currentUser.firstName}! ` : ''}
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {openBabas.map((baba) => (
                <BabaCard key={baba.id} baba={baba} />
              ))}
            </div>
          </section>
        )}

        {closedBabas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
              Inscrições Fechadas
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {closedBabas.map((baba) => (
                <BabaCard key={baba.id} baba={baba} />
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
      </main>
    </div>
  );
}
