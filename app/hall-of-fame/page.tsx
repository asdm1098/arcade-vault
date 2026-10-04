import { createClient } from '@/lib/supabase/server';
import { LOCAL_GAMES } from '@/app/data/games';
import type { ScoreRow } from '@/lib/supabase/types';
import HallOfFameClient from './HallOfFameClient';

export default async function HallOfFame() {
  const supabase = await createClient();

  const typedGames = LOCAL_GAMES;
  const firstGameId = typedGames[0]?.id ?? '';

  let initialScores: unknown[] | null = [];
  try {
    if (firstGameId) {
      const res = await supabase
        .from('scores')
        .select('*')
        .eq('game_id', firstGameId)
        .order('score', { ascending: false })
        .limit(12);
      initialScores = res.data;
    }
  } catch {}

  return (
    <HallOfFameClient
      games={typedGames}
      initialScores={(initialScores as ScoreRow[]) ?? []}
      initialTab={firstGameId}
    />
  );
}
