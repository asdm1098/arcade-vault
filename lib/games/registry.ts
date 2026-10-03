import type { ComponentType } from "react";
import {
  AsteroidsCanvas,
  type GameCanvasProps,
} from "@/components/games/asteroids-canvas";

// id del juego (lib/data.ts) → componente de juego con motor real.
// Los juegos sin entrada siguen usando la arena mock de GamePlayer.
export const GAME_COMPONENTS: Record<string, ComponentType<GameCanvasProps>> = {
  rocas: AsteroidsCanvas,
};
