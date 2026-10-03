"use client";

import { useEffect, useRef } from "react";
import { createCaida } from "@/lib/games/caida/engine";
import type { GameCanvasProps } from "@/components/games/asteroids-canvas";
import type { GameCallbacks, GameHandle } from "@/lib/games/types";

export function CaidaCanvas({
  paused,
  restartKey,
  endSignal,
  onStats,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const callbacksRef = useRef<GameCallbacks>({ onStats, onGameOver });
  const lastRestartKey = useRef(restartKey);
  const lastEndSignal = useRef(endSignal);

  // Los callbacks se leen por ref para no recrear el motor al cambiar de props.
  useEffect(() => {
    callbacksRef.current = { onStats, onGameOver };
  }, [onStats, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createCaida(canvas, {
      onStats: (stats) => callbacksRef.current.onStats(stats),
      onGameOver: (finalScore) => callbacksRef.current.onGameOver(finalScore),
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (paused) handleRef.current?.pause();
    else handleRef.current?.resume();
  }, [paused]);

  useEffect(() => {
    if (lastRestartKey.current === restartKey) return;
    lastRestartKey.current = restartKey;
    handleRef.current?.restart();
  }, [restartKey]);

  useEffect(() => {
    if (lastEndSignal.current === endSignal) return;
    lastEndSignal.current = endSignal;
    handleRef.current?.end();
  }, [endSignal]);

  return (
    <canvas
      ref={canvasRef}
      width={450}
      height={600}
      className="caida-canvas block bg-black"
      style={{ aspectRatio: "3 / 4" }}
    />
  );
}
