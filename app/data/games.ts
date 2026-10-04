import type { GameRow } from '@/lib/supabase/types';

// Catálogo local (temporal, mientras Supabase no está disponible).
export const LOCAL_GAMES: GameRow[] = [
  {
    id: 'arkanoid',
    title: 'ARKANOID',
    short: 'Rebota la pelota y destruye muros de neón.',
    long: 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles.',
    cat: 'ARCADE',
    cover: 'cover-bricks',
    color: 'cyan',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tetris',
    title: 'TETRIS',
    short: 'Encaja las piezas antes de que el techo te aplaste.',
    long: 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad.',
    cat: 'PUZZLE',
    cover: 'cover-tetro',
    color: 'magenta',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'snake',
    title: 'SNAKE',
    short: 'Come frutas, crece y no te muerdas la cola.',
    long: 'Una serpiente recorre la grilla buscando frutas. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.',
    cat: 'ARCADE',
    cover: 'cover-snake',
    color: 'green',
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'asteroids',
    title: 'ASTEROIDS',
    short: 'Pulveriza rocas en gravedad cero.',
    long: 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños.',
    cat: 'SHOOTER',
    cover: 'cover-rocas',
    color: 'yellow',
    created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: 'frogger',
    title: 'FROGGER',
    short: 'Cruza la autopista de pixeles.',
    long: 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.',
    cat: 'ARCADE',
    cover: 'cover-frogger',
    color: 'green',
    created_at: '2026-01-05T00:00:00Z',
  },
];

export const getLocalGame = (id: string) =>
  LOCAL_GAMES.find((g) => g.id === id) ?? null;
