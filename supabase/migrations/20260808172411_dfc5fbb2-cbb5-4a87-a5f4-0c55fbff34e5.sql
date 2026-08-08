
CREATE TABLE public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('entrada','saida')),
  category text not null default 'outros',
  description text,
  amount numeric not null check (amount >= 0),
  occurred_on date not null default current_date,
  baba_id uuid references public.babas(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT SELECT ON public.finance_transactions TO anon;
GRANT ALL ON public.finance_transactions TO service_role;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finance viewable by everyone" ON public.finance_transactions FOR SELECT USING (true);
CREATE POLICY "Admins manage finance" ON public.finance_transactions FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.monthly_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  monthly_fee numeric not null default 0 check (monthly_fee >= 0),
  due_day integer not null default 5 check (due_day between 1 and 28),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_members TO authenticated;
GRANT SELECT ON public.monthly_members TO anon;
GRANT ALL ON public.monthly_members TO service_role;
ALTER TABLE public.monthly_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by everyone" ON public.monthly_members FOR SELECT USING (true);
CREATE POLICY "Admins manage members" ON public.monthly_members FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER update_monthly_members_updated_at BEFORE UPDATE ON public.monthly_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.monthly_members(id) on delete cascade,
  reference_month date not null,
  amount numeric not null default 0 check (amount >= 0),
  paid_on date,
  method text,
  status text not null default 'pendente' check (status in ('pendente','pago','atrasado','isento')),
  transaction_id uuid references public.finance_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, reference_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_payments TO authenticated;
GRANT SELECT ON public.membership_payments TO anon;
GRANT ALL ON public.membership_payments TO service_role;
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments viewable by everyone" ON public.membership_payments FOR SELECT USING (true);
CREATE POLICY "Admins manage payments" ON public.membership_payments FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
