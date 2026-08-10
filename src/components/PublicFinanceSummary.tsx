import { useMemo, useState } from 'react';
import { CalendarDays, Crown, PiggyBank, TrendingDown, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAppSettings } from '@/hooks/useAppSettings';
import { countBabasInCycle, currentMonthKey, formatBRL, useFinance } from '@/hooks/useFinance';

/** Painel público de transparência: qualquer pessoa vê o caixa da FAMILIA BABA. */
export function PublicFinanceSummary() {
  const monthKey = currentMonthKey();
  const finance = useFinance(monthKey);
  const { getSetting } = useAppSettings();
  const [open, setOpen] = useState(false);

  const courtFee = Number(String(getSetting('finance_court_fee') ?? '0').replace(',', '.')) || 0;
  const weekday = parseInt(getSetting('finance_baba_weekday') ?? '3', 10);
  const dueDay = parseInt(getSetting('finance_court_due_day') ?? '5', 10);

  const cycle = useMemo(() => countBabasInCycle(monthKey, weekday, dueDay), [monthKey, weekday, dueDay]);
  const perBaba = cycle.count > 0 ? courtFee / cycle.count : 0;
  const activeMembers = finance.members.filter(m => m.active);

  const monthLabel = new Date(`${monthKey}-01T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-secondary py-3">
        <CardTitle className="flex items-center gap-2 text-secondary-foreground text-base">
          <Eye className="h-4 w-4 text-primary" />
          Transparência do caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Caixa atual</p>
          <p className="text-3xl font-extrabold text-primary">{formatBRL(finance.balanceAll)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-success/10 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Entradas
            </p>
            <p className="text-base font-bold text-success">{formatBRL(finance.totalIn)}</p>
          </div>
          <div className="rounded-xl border bg-destructive/10 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
              <TrendingDown className="h-3 w-3" /> Saídas
            </p>
            <p className="text-base font-bold text-destructive">{formatBRL(finance.totalOut)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
              <Crown className="h-3 w-3" /> Mensalistas
            </p>
            <p className="font-bold">{activeMembers.length} ativos</p>
            <p className="text-[11px] text-muted-foreground">
              {formatBRL(finance.membershipIn)} recebidos no mês
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
              <CalendarDays className="h-3 w-3" /> Babas no ciclo
            </p>
            <p className="font-bold">{cycle.count}</p>
            <p className="text-[11px] text-muted-foreground">
              Quadra {formatBRL(perBaba)} por baba
            </p>
          </div>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="w-full rounded-lg border py-2 text-sm font-medium hover:bg-muted/50">
            {open ? 'Ocultar' : 'Ver'} movimentações de {monthLabel}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {finance.monthTransactions.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Nenhuma movimentação neste mês.
              </p>
            )}
            {finance.monthTransactions.map(t => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                <PiggyBank className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{t.description || t.category}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(t.occurred_on + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="outline" className="hidden xs:inline-flex">
                  {t.category}
                </Badge>
                <span
                  className={`text-sm font-bold ${t.type === 'entrada' ? 'text-success' : 'text-destructive'}`}
                >
                  {t.type === 'entrada' ? '+' : '-'}
                  {formatBRL(Number(t.amount))}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
