-- Orders paid by the previous implementation already have a card assigned.
-- Mark them delivered without consuming any additional inventory.
update public.orders
   set status = 'delivered'
 where status = 'paid'
   and card_code is not null;
