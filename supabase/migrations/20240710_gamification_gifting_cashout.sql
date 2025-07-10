-- Gamification Gifting & Cashout Migration
-- Adds tables for withdrawal requests, gifts, and coin transactions
-- Alters user_purchases to support gifting

-- 1. Withdrawal Requests Table
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  amount_coins integer not null,
  amount_cash numeric(12,2) not null,
  status text not null default 'pending', -- pending, approved, rejected, paid
  payment_method text, -- e.g., 'bank', 'paypal'
  payment_details jsonb, -- e.g., { "account": "...", "bank": "..." }
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- 2. Gifts Table
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete cascade,
  gift_type text not null, -- 'coins' or 'item'
  amount integer, -- for coins
  item_id uuid references public.store_items(id), -- for items
  message text,
  status text not null default 'sent', -- sent, accepted, rejected
  sent_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- 3. Coin Transactions Table
create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null, -- 'earn', 'spend', 'gift_sent', 'gift_received', 'cashout'
  amount integer not null,
  related_id uuid, -- e.g., gift id, withdrawal id, store purchase id
  description text,
  created_at timestamptz not null default now()
);

-- 4. Alter user_purchases to support gifting
alter table public.user_purchases
  add column if not exists gifted_by uuid references public.users(id);

-- Pay with Coins RPC
create or replace function pay_with_coins(
  p_user_id uuid,
  p_course_id text
)
returns jsonb
language plpgsql
as $$
declare
  v_course_price integer;
  v_coin_conversion integer := 100; -- 100 coins = ₦1
  v_min_naira integer := 1;
  v_max_naira integer := 10000;
  v_coin_amount integer;
  v_user_coins integer;
  v_already_enrolled integer;
begin
  -- Get course price
  select price into v_course_price from courses where id = p_course_id;
  if v_course_price is null then
    return jsonb_build_object('error', 'Course not found');
  end if;
  if v_course_price < v_min_naira or v_course_price > v_max_naira then
    return jsonb_build_object('error', 'Course not eligible for coin payment');
  end if;
  v_coin_amount := v_course_price * v_coin_conversion;

  -- Get user coins
  select coins into v_user_coins from users where id = p_user_id;
  if v_user_coins is null then
    return jsonb_build_object('error', 'User not found');
  end if;
  if v_user_coins < v_coin_amount then
    return jsonb_build_object('error', 'Not enough coins');
  end if;

  -- Check if already enrolled
  select count(*) into v_already_enrolled from user_courses where user_id = p_user_id and course_id = p_course_id;
  if v_already_enrolled > 0 then
    return jsonb_build_object('error', 'Already enrolled');
  end if;

  -- Deduct coins and enroll (atomic)
  update users set coins = coins - v_coin_amount where id = p_user_id;
  insert into user_courses (user_id, course_id, status) values (p_user_id, p_course_id, 'enrolled');

  return jsonb_build_object('success', true, 'coinsDeducted', v_coin_amount);
exception
  when others then
    return jsonb_build_object('error', 'Transaction failed');
end;
$$; 