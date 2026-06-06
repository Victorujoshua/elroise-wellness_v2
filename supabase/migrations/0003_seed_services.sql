insert into public.services (
  name, slug, category, description,
  duration_minutes,
  single_price_naira, package_price_naira, package_session_count,
  color_hex, is_active, sort_order
) values

-- ── Laser Hair Reduction (8 services) ──────────────────────────
('Chin / Upper Lip', 'chin-upper-lip', 'laser',
 'Targeted laser hair reduction for the chin and upper lip area for a smooth, refined finish.',
 15, 45000, 175000, 5, '#C5A059', true, 1),

('Jaw', 'jaw', 'laser',
 'Precision treatment for the jawline area, ensuring clean and clear skin contours.',
 20, 60000, 225000, 5, '#C5A059', true, 2),

('Lower Face', 'lower-face', 'laser',
 'Comprehensive treatment including Chin, Upper Lip, and Jaw for a complete facial refresh.',
 30, 70000, 300000, 5, '#C5A059', true, 3),

('Under Arm', 'under-arm', 'laser',
 'Efficient and gentle laser hair reduction for the underarm area, perfect for daily ease.',
 20, 55000, 225000, 5, '#C5A059', true, 4),

('Bikini', 'bikini', 'laser',
 'Standard bikini line treatment designed for comfort and long-lasting results.',
 30, 70000, 300000, 5, '#C5A059', true, 5),

('Brazilian', 'brazilian', 'laser',
 'Full Brazilian laser treatment for complete confidence and smooth skin.',
 45, 95000, 425000, 5, '#C5A059', true, 6),

('Full Legs', 'full-legs', 'laser',
 'Total leg treatment from ankle to thigh, providing silky smooth skin across the entire surface.',
 60, 125000, 500000, 5, '#C5A059', true, 7),

('Full Arms', 'full-arms', 'laser',
 'Complete arm treatment for a clean, hair-free look from shoulder to wrist.',
 45, 100000, 425000, 5, '#C5A059', true, 8),

-- ── Pilates Studio (3 services) ────────────────────────────────
-- Reformer: 3 package tiers exist (5/10/20 classes); V1 stores the 5-class entry.
('Reformer Pilates', 'reformer-pilates', 'pilates',
 'Dynamic resistance training on the reformer to build core strength, flexibility, and lean muscle.',
 55, 20000, 80000, 5, '#C5A059', true, 9),

-- Private and Duet: 10-session bundles per legacy pricing.
('Private Session', 'private-session', 'pilates',
 'One-on-one tailored instruction focusing on your specific goals and postural needs.',
 60, 35000, 300000, 10, '#C5A059', true, 10),

('Duet Session', 'duet-session', 'pilates',
 'Semi-private instruction for two people. Perfect for friends or partners working together.',
 60, 75000, 220000, 10, '#C5A059', true, 11);
