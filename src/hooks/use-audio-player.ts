import {
  setAudioModeAsync,
  useAudioPlayerStatus,
  useAudioPlayer as useExpoAudioPlayer,
} from "expo-audio";
import { useCallback, useEffect, useState } from "react";

const PLAYER_SPEEDS = [1, 1.5, 2] as const;
type PlayerSpeed = (typeof PLAYER_SPEEDS)[number];

// 초 → MM:SS
export const formatPlayerTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const useAudioPlayer = (uri: string) => {
  const player = useExpoAudioPlayer(uri ? { uri } : null, {
    updateInterval: 500,
  });

  // 상태 변경 시 재렌더하기 위한 구독
  const status = useAudioPlayerStatus(player);

  const [speed, setSpeed] = useState<PlayerSpeed>(1);

  // 무음 모드에서도 재생되게
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // 끝까지 재생 시 처음부터 되돌리기
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const play = useCallback(() => player.play(), [player]);

  const pause = useCallback(() => player.pause(), [player]);

  // 1x → 1.5x → 2x → 1x
  const cycleSpeed = useCallback(() => {
    const next =
      PLAYER_SPEEDS[(PLAYER_SPEEDS.indexOf(speed) + 1) % PLAYER_SPEEDS.length];

    setSpeed(next);
    // medium은 배속 올려도 목소리 높낮이 유지
    player.setPlaybackRate(next, "medium");
  }, [speed, player]);

  return {
    isPlaying: status.playing,
    isLoaded: status.isLoaded,
    position: Math.floor(status.currentTime),
    duration: Math.floor(status.duration),
    speed,
    play,
    pause,
    cycleSpeed,
  };
};
