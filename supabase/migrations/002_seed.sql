-- Demo data for the Ottawa launch build (mirrors the old src/data/mock.ts).
-- Inserted as postgres via the Management API, so RLS does not block it.
-- Fixed UUIDs so re-running is idempotent.

insert into profiles (id, full_name, trade, years_exp, region, available, trust_score, deals_closed, verified) values
  ('a0000000-0000-4000-8000-000000000001', 'Ahmad Const.',     'Framing',       12, 'Ottawa, ON', false, 4.8, 23, true),
  ('a0000000-0000-4000-8000-000000000002', 'Roof Masters',     'Roofing',        9, 'Ottawa, ON', false, 4.6, 11, false),
  ('a0000000-0000-4000-8000-000000000003', 'Bautista Framing', 'Backframe',      8, 'Ottawa, ON', false, 4.7, 17, false),
  ('a0000000-0000-4000-8000-000000000004', 'Carlos M.',        'Framing',       10, 'Ottawa, ON', true,  4.9,  8, true),
  ('a0000000-0000-4000-8000-000000000005', 'Diego R.',         'General Labor',  3, 'Ottawa, ON', true,  4.5,  6, false)
on conflict (id) do nothing;

insert into listings (id, author_id, type, trade, title, pay, detail, city, location, distance_km, urgent, photo_url, status, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'job', 'framing',
   '2 framers — starts SATURDAY 7am', '$34/hr', 'weekend', 'Ottawa', 'Kanata', 18, true,
   'ph:#cfd6e6,#aab4c8', 'open', now() - interval '40 minutes'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'job', 'roofing',
   'Roofing helper — tomorrow', '$28/hr', '1 day', 'Ottawa', 'Nepean', 9, true,
   'ph:#e6d9cf,#c8b4aa', 'open', now() - interval '2 hours'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'job', 'backframe',
   'Backframe crew — 3 day job', '$30/hr', '3 days', 'Ottawa', 'Barrhaven', 14, false,
   'ph:#d9cfe6,#b4aac8', 'open', now() - interval '3 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'tool', null,
   'Milwaukee M18 drill — full kit', '$180', 'used, 2 batteries', 'Ottawa', 'Orleans', 16, false,
   'ph:#d2e6cf,#aac8b1', 'open', now() - interval '5 hours'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 'available', 'general_labor',
   'General labour — available weekdays', '$24/hr', '3 yrs · own truck', 'Ottawa', 'Gloucester', 7, false,
   null, 'open', now() - interval '6 hours'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'available', 'framing',
   'Framing — available this weekend', 'Framing', '10 yrs', 'Ottawa', 'Vanier', 3, false,
   null, 'open', now() - interval '1 day')
on conflict (id) do nothing;

-- References (ratings with comments)
insert into ratings (id, rater_id, ratee_id, stars, comment, created_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005',
   5, 'Showed up 15 min early, worked the full day. Would hire again.', now() - interval '14 days'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005',
   4, 'Good worker, solid on cleanup and material runs.', now() - interval '30 days'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004',
   5, 'Knows his stuff. 10 years shows.', now() - interval '7 days')
on conflict (id) do nothing;

-- Portfolio photos (gradient placeholders until Storage uploads)
insert into portfolio_photos (id, profile_id, photo_url, caption) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'ph:#d9e2cf,#b7c8aa', 'Site cleanup'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'ph:#cfd9e6,#aab9c8', 'Demo day'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'ph:#e6dccf,#c8bcaa', 'Garage frame'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'ph:#d2e6cf,#aac8b1', 'Addition'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'ph:#cfd6e6,#aab4c8', 'Deck build')
on conflict (id) do nothing;
