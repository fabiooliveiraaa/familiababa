import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Crown,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearchSelect } from '@/components/UserSearchSelect';
import { useAppSettings } from '@/hooks/useAppSettings';
import {
  countBabasInCycle,
  currentMonthKey,
  formatBRL,
  monthStart,
  useFinance,
} from '@/hooks/useFinance';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const num = (v: string | null | undefined, fallback: number) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

export function FinancePanel() {
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const finance = useFinance(monthKey);
  const { getSetting, updateSetting, settings } = useAppSettings();

  const courtFee = num(getSetting('finance_court_fee'), 0);
  const babaWeekday = Math.trunc(num(getSetting('finance_baba_weekday'), 3));
  const courtDueDay = Math.trunc(num(getSetting('finance_court_due_day'), 5));

  // inputs controlados sincronizados com as configurações salvas
  const [feeInput, setFeeInput] = useState('');
  const [dueInput, setDueInput] = useState('');
  useEffect(() => {
    setFeeInput(courtFee ? String(courtFee) : '');
    setDueInput(String(courtDueDay));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);


  const [tx, setTx] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    category: 'baba',
    description: '',
    amount: '',
    occurred_on: new Date().toISOString().slice(0, 10),
  });

  const [newMember, setNewMember] = useState({ name: '', userId: null as string | null, fee: '', dueDay: '5' });

  const cycle = useMemo(
    () => countBabasInCycle(monthKey, babaWeekday, courtDueDay),
    [monthKey, babaWeekday, courtDueDay],
  );

  const reference = monthStart(monthKey);
  const paymentFor = (memberId: string) =>
    finance.payments.find(p => p.member_id === memberId && p.reference_month === reference);

  const activeMembers = finance.members.filter(m => m.active);
  const expectedMembership = activeMembers.reduce((s, m) => s + Number(m.monthly_fee), 0);
  const receivedMembership = activeMembers
    .filter(m => paymentFor(m.id)?.status === 'pago')
    .reduce((s, m) => s + Number(m.monthly_fee), 0);
  const perBaba = cycle.count > 0 ? courtFee / cycle.count : 0;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(tx.amount);
    if (!amount || amount <= 0) return;
    const ok = await finance.addTransaction({
      type: tx.type,
      category: tx.category,
      description: tx.description || null,
      amount,
      occurred_on: tx.occurred_on,
    });
    if (ok) setTx({ ...tx, description: '', amount: '' });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    const ok = await finance.addMember({
      name: newMember.name.trim(),
      user_id: newMember.userId,
      monthly_fee: parseFloat(newMember.fee || '0'),
      due_day: parseInt(newMember.dueDay || '5'),
    });
    if (ok) setNewMember({ name: '', userId: null, fee: '', dueDay: '5' });
  };

  return (
    <Card className="mt-6 border-2">
      <CardHeader className="bg-secondary">
        <CardTitle className="flex items-center gap-2 text-secondary-foreground">
          <Wallet className="h-5 w-5" />
          Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="month">Mês de referência</Label>
          <Input id="month" type="month" value={monthKey} onChange={e => setMonthKey(e.target.value)} />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-success/10 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Entradas</p>
            <p className="text-lg font-bold text-success">{formatBRL(finance.totalIn)}</p>
            <p className="text-[11px] text-muted-foreground">
              Mensalidades {formatBRL(finance.membershipIn)} • Outras {formatBRL(finance.otherIn)}
            </p>
          </div>
          <div className="rounded-xl border bg-destructive/10 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Saídas</p>
            <p className="text-lg font-bold text-destructive">{formatBRL(finance.totalOut)}</p>
          </div>
          <div className="rounded-xl border bg-primary/10 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Saldo do mês</p>
            <p className="text-lg font-bold">{formatBRL(finance.monthBalance)}</p>
          </div>
          <div className="rounded-xl border bg-muted p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Caixa total</p>
            <p className="text-lg font-bold">{formatBRL(finance.balanceAll)}</p>
          </div>
        </div>


        <Tabs defaultValue="caixa">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
            <TabsTrigger value="mensalistas">Mensalistas</TabsTrigger>
            <TabsTrigger value="quadra">Quadra</TabsTrigger>
          </TabsList>

          {/* CAIXA */}
          <TabsContent value="caixa" className="space-y-4 pt-4">
            <form onSubmit={handleAddTransaction} className="space-y-3 rounded-xl border p-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={tx.type === 'entrada' ? 'default' : 'outline'}
                  className="h-11"
                  onClick={() => setTx({ ...tx, type: 'entrada' })}
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" /> Entrada
                </Button>
                <Button
                  type="button"
                  variant={tx.type === 'saida' ? 'destructive' : 'outline'}
                  className="h-11"
                  onClick={() => setTx({ ...tx, type: 'saida' })}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" /> Saída
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="h-11"
                    value={tx.amount}
                    onChange={e => setTx({ ...tx, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-11"
                    value={tx.occurred_on}
                    onChange={e => setTx({ ...tx, occurred_on: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat">Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  {['baba', 'mensalidade', 'quadra', 'material', 'outros'].map(c => (
                    <Button
                      key={c}
                      type="button"
                      size="sm"
                      variant={tx.category === c ? 'secondary' : 'outline'}
                      onClick={() => setTx({ ...tx, category: c })}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc">Descrição</Label>
                <Input
                  id="desc"
                  className="h-11"
                  placeholder="Ex: aluguel da quadra"
                  value={tx.description}
                  onChange={e => setTx({ ...tx, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full h-11">
                <Plus className="h-4 w-4 mr-2" /> Registrar lançamento
              </Button>
            </form>

            <div className="space-y-2">
              {finance.monthTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum lançamento neste mês.</p>
              )}
              {finance.monthTransactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.occurred_on + 'T12:00:00').toLocaleDateString('pt-BR')} • {t.category}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${t.type === 'entrada' ? 'text-success' : 'text-destructive'}`}
                  >
                    {t.type === 'entrada' ? '+' : '-'}
                    {formatBRL(Number(t.amount))}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => finance.deleteTransaction(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* MENSALISTAS */}
          <TabsContent value="mensalistas" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border p-3">
                <p className="text-[11px] uppercase text-muted-foreground">Previsto</p>
                <p className="text-base font-bold">{formatBRL(expectedMembership)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-[11px] uppercase text-muted-foreground">Recebido</p>
                <p className="text-base font-bold text-success">{formatBRL(receivedMembership)}</p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 rounded-xl border p-3">
              <Label>Escolher mensalista</Label>
              <UserSearchSelect
                placeholder="Buscar jogador cadastrado..."
                onSelect={p =>
                  setNewMember({ ...newMember, name: `${p.first_name} ${p.last_name}`, userId: p.id })
                }
              />
              <Input
                className="h-11"
                placeholder="ou digite o nome"
                value={newMember.name}
                onChange={e => setNewMember({ ...newMember, name: e.target.value, userId: null })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Mensalidade (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="h-11"
                    value={newMember.fee}
                    onChange={e => setNewMember({ ...newMember, fee: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Dia venc.</Label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    className="h-11"
                    value={newMember.dueDay}
                    onChange={e => setNewMember({ ...newMember, dueDay: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11">
                <Crown className="h-4 w-4 mr-2" /> Registrar mensalista
              </Button>
            </form>

            <div className="space-y-2">
              {finance.members.map(m => {
                const pay = paymentFor(m.id);
                const paid = pay?.status === 'pago';
                return (
                  <div key={m.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        👑 {m.name}
                      </span>
                      <Badge variant={paid ? 'default' : 'outline'} className={paid ? 'bg-success' : ''}>
                        {paid ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBRL(Number(m.monthly_fee))} • vence dia {m.due_day}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={paid ? 'outline' : 'default'}
                        className="h-9 flex-1"
                        onClick={() => finance.setPaymentStatus(m, paid ? 'pendente' : 'pago', 'pix')}
                      >
                        {paid ? 'Desfazer pagamento' : 'Marcar como pago'}
                      </Button>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={m.active}
                          onCheckedChange={v => finance.updateMember(m.id, { active: v })}
                        />
                        <span className="text-xs text-muted-foreground">ativo</span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => finance.removeMember(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {finance.members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum mensalista cadastrado.</p>
              )}
            </div>
          </TabsContent>

          {/* QUADRA */}
          <TabsContent value="quadra" className="space-y-4 pt-4">
            <div className="space-y-3 rounded-xl border p-3">
              <div className="space-y-1">
                <Label>Mensalidade da quadra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="h-11"
                  defaultValue={courtFee || ''}
                  onBlur={e => updateSetting('finance_court_fee', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Dia do pagamento da quadra</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  className="h-11"
                  defaultValue={courtDueDay}
                  onBlur={e => updateSetting('finance_court_due_day', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Dia da semana do baba</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((w, i) => (
                    <Button
                      key={w}
                      type="button"
                      size="sm"
                      variant={babaWeekday === i ? 'secondary' : 'outline'}
                      onClick={() => updateSetting('finance_baba_weekday', String(i))}
                    >
                      {w}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4" />
                Ciclo {cycle.start.toLocaleDateString('pt-BR')} → {cycle.end.toLocaleDateString('pt-BR')}
              </p>
              <p className="text-3xl font-extrabold text-primary">{cycle.count} babas</p>
              <p className="text-sm text-muted-foreground">
                Custo por baba: <strong>{formatBRL(perBaba)}</strong>
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {cycle.dates.map(d => (
                  <Badge key={d.toISOString()} variant="outline">
                    {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Mensalistas cobrem {formatBRL(expectedMembership)} dos {formatBRL(courtFee)} da quadra
                {courtFee > expectedMembership
                  ? ` — faltam ${formatBRL(courtFee - expectedMembership)} para o rateio.`
                  : ' — quadra coberta pelos mensalistas.'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
