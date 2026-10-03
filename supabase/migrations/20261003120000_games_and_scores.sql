-- SPEC 06: games, scores, game_stats view, RLS and seed

create table public.games (
  id         text primary key,
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover      text not null,
  color      text not null check (color in ('cyan','magenta','yellow','green')),
  sort_order int  not null
);

create table public.scores (
  id         bigint generated always as identity primary key,
  game_id    text not null references public.games(id),
  name       text not null check (char_length(name) between 1 and 10),
  score      int  not null check (score between 0 and 100000000),
  created_at timestamptz not null default now()
);
create index scores_game_score_idx on public.scores (game_id, score desc);
create index scores_created_idx    on public.scores (created_at desc);

create view public.game_stats with (security_invoker = true) as
  select g.id as game_id,
         coalesce(max(s.score), 0) as best,
         count(s.id)::int          as plays
  from public.games g left join public.scores s on s.game_id = g.id
  group by g.id;

alter table public.games  enable row level security;
alter table public.scores enable row level security;

create policy "games_select_public" on public.games
  for select to anon, authenticated using (true);

create policy "scores_select_public" on public.scores
  for select to anon, authenticated using (true);
create policy "scores_insert_public" on public.scores
  for insert to anon, authenticated with check (true);

grant select on public.games      to anon, authenticated;
grant select, insert on public.scores to anon, authenticated;
grant select on public.game_stats to anon, authenticated;

-- Seed: catalog
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values
('bloque-buster','BLOQUE BUSTER','Rebota la pelota y destruye muros de neón.','Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?','ARCADE','cover-bricks','cyan',1),
('caida','CAÍDA','Encaja las piezas antes de que el techo te aplaste.','Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.','PUZZLE','cover-tetro','magenta',2),
('serpentina','SERPENTINA','Crece sin morder tu propia cola.','Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.','ARCADE','cover-snake','green',3),
('gloton','GLOTÓN','Devora puntos y escapa de los fantasmas.','Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.','ARCADE','cover-glot','yellow',4),
('invasores','INVASORES','Defiende el planeta de filas alienígenas.','Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.','SHOOTER','cover-invaders','green',5),
('rocas','ROCAS','Pulveriza asteroides en gravedad cero.','Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.','SHOOTER','cover-rocas','yellow',6),
('ranaria','RANARIA','Cruza la autopista de pixeles.','Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.','ARCADE','cover-rana','green',7),
('duelo-pixel','DUELO PIXEL','Dos paletas. Una pelota. Reflejos máximos.','El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.','VERSUS','cover-duelo','cyan',8);

-- Seed: deterministic fictional scores (12 per game, decreasing, last 30 days)
with players(arr) as (
  select array['PX_KAI','NEONFOX','Z3R0COOL','M00NRYU','VAULT_07','GLITCHA',
               'ATARI_KID','CYBER_LU','MAGENTA88','SCANLINE','BIT_LORD','ARKADYA',
               'DROID_X','RGB_QUEEN','PIXEL_DAD','RETROVIRA','VECTORX','JOY_STK']
),
tops(game_id, top, gi) as (
  values ('bloque-buster', 28450, 1), ('caida', 184220, 2), ('serpentina', 7820, 3),
         ('gloton', 96400, 4), ('invasores', 54190, 5), ('rocas', 60000, 6),
         ('ranaria', 18900, 7), ('duelo-pixel', 24, 8)
)
insert into public.scores (game_id, name, score, created_at)
select t.game_id,
       p.arr[((t.gi * 5 + i * 7) % 18) + 1],
       greatest(round(t.top * (1 - (i - 1) * 0.075))::int, 0),
       now() - (((t.gi * 37 + i * 53) % 720) * interval '1 hour')
from tops t
cross join generate_series(1, 12) as i
cross join players p;
