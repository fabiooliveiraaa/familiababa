import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const db = supabase as any;

export interface FinanceTransaction {
  id: string;
  type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: number;
  occurred_on: string;
  baba_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MonthlyMember {
  id: string;
  user_id: string | null;
  name: string;
  monthly_fee: number;
  due_day: number;
  active: boolean;
  notes: string | null;
}

export interface MembershipPayment {
  id: string;
  member_id: string;
  reference_month: string;
  amount: number;
  paid_on: string | null;
  method: string | null;
  status: 'pendente' | 'pago' | 'atrasado' | 'isento';
}

/** First day (yyyy-mm-01) of a given month key like "2026-08". */
export const monthStart = (monthKey: string) => `${monthKey}-01`;

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Conta quantas ocorrências de um dia da semana existem no ciclo de cobrança,
 * que vai do dia de vencimento da quadra até o mesmo dia do mês seguinte.
 */
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export function countBabasInCycle(monthKey: string, weekday: number, dueDay: number) {
  const [y, m] = (monthKey || currentMonthKey()).split('-').map(Number);
  if (!y || !m) return { count: 0, dates: [] as Date[], start: new Date(), end: new Date() };

  const wd = Number.isFinite(weekday) ? ((Math.trunc(weekday) % 7) + 7) % 7 : 3;
  const day = Math.min(Math.max(Math.trunc(dueDay) || 1, 1), 31);

  // clamp o dia de vencimento ao número de dias de cada mês do ciclo
  const start = new Date(y, m - 1, Math.min(day, daysInMonth(y, m - 1)));
  const end = new Date(y, m, Math.min(day, daysInMonth(y, m)));

  const dates: Date[] = [];
  const d = new Date(start);
  while (d < end) {
    if (d.getDay() === wd) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return { count: dates.length, dates, start, end };
}

export function useFinance(monthKey: string) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [members, setMembers] = useState<MonthlyMember[]>([]);
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tx, mb, pm] = await Promise.all([
      db.from('finance_transactions').select('*').order('occurred_on', { ascending: false }),
      db.from('monthly_members').select('*').order('name', { ascending: true }),
      db.from('membership_payments').select('*'),
    ]);
    if (tx.error) console.error(tx.error);
    if (mb.error) console.error(mb.error);
    if (pm.error) console.error(pm.error);
    setTransactions((tx.data as FinanceTransaction[]) || []);
    setMembers((mb.data as MonthlyMember[]) || []);
    setPayments((pm.data as MembershipPayment[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTransaction = async (
    payload: Pick<FinanceTransaction, 'type' | 'category' | 'amount' | 'occurred_on'> & {
      description?: string | null;
    },
  ) => {
    const { error } = await db.from('finance_transactions').insert(payload);
    if (error) {
      toast({ title: 'Erro ao registrar lançamento', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Lançamento registrado!' });
    await fetchAll();
    return true;
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await db.from('finance_transactions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
      return false;
    }
    await fetchAll();
    return true;
  };

  const addMember = async (payload: { name: string; user_id?: string | null; monthly_fee: number; due_day: number }) => {
    const { error } = await db.from('monthly_members').insert(payload);
    if (error) {
      toast({ title: 'Erro ao adicionar mensalista', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Mensalista adicionado!' });
    await fetchAll();
    return true;
  };

  const updateMember = async (id: string, patch: Partial<MonthlyMember>) => {
    const { error } = await db.from('monthly_members').update(patch).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar mensalista', variant: 'destructive' });
      return false;
    }
    await fetchAll();
    return true;
  };

  const removeMember = async (id: string) => {
    const { error } = await db.from('monthly_members').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao remover mensalista', variant: 'destructive' });
      return false;
    }
    await fetchAll();
    return true;
  };

  /** Marca a mensalidade do mês como paga (ou volta para pendente) e espelha no caixa. */
  const setPaymentStatus = async (
    member: MonthlyMember,
    status: MembershipPayment['status'],
    method?: string,
  ) => {
    const reference_month = monthStart(monthKey);
    const existing = payments.find(p => p.member_id === member.id && p.reference_month === reference_month);

    let transactionId: string | null = null;
    if (status === 'pago') {
      const { data, error } = await db
        .from('finance_transactions')
        .insert({
          type: 'entrada',
          category: 'mensalidade',
          description: `Mensalidade ${monthKey} — ${member.name}`,
          amount: member.monthly_fee,
          occurred_on: new Date().toISOString().slice(0, 10),
        })
        .select('id')
        .single();
      if (error) {
        toast({ title: 'Erro ao lançar no caixa', description: error.message, variant: 'destructive' });
        return false;
      }
      transactionId = data.id;
    }

    const payload = {
      member_id: member.id,
      reference_month,
      amount: member.monthly_fee,
      status,
      method: method || null,
      paid_on: status === 'pago' ? new Date().toISOString().slice(0, 10) : null,
      transaction_id: transactionId,
    };

    const { error } = existing
      ? await db.from('membership_payments').update(payload).eq('id', existing.id)
      : await db.from('membership_payments').insert(payload);

    if (error) {
      toast({ title: 'Erro ao atualizar mensalidade', description: error.message, variant: 'destructive' });
      return false;
    }

    if (existing?.status === 'pago' && status !== 'pago') {
      await db.from('finance_transactions').delete().eq('id', (existing as any).transaction_id);
    }

    await fetchAll();
    return true;
  };

  const monthTransactions = transactions.filter(t => t.occurred_on.slice(0, 7) === monthKey);
  const entradas = monthTransactions.filter(t => t.type === 'entrada');
  const totalIn = entradas.reduce((s, t) => s + Number(t.amount), 0);
  const membershipIn = entradas
    .filter(t => t.category === 'mensalidade')
    .reduce((s, t) => s + Number(t.amount), 0);
  const otherIn = totalIn - membershipIn;
  const totalOut = monthTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0);
  const balanceAll = transactions.reduce(
    (s, t) => s + (t.type === 'entrada' ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  return {
    loading,
    transactions,
    monthTransactions,
    members,
    payments,
    totalIn,
    membershipIn,
    otherIn,
    totalOut,
    monthBalance: totalIn - totalOut,
    balanceAll,
    addTransaction,
    deleteTransaction,
    addMember,
    updateMember,
    removeMember,
    setPaymentStatus,
    refetch: fetchAll,
  };
}
