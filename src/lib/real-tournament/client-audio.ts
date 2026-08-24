type TournamentSound = "start" | "warning" | "tick" | "complete";

let audioContext: AudioContext | null = null;
let isUnlocked = false;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) return null;

  audioContext ??= new AudioContextClass();
  return audioContext;
}

function tone({
  context,
  frequency,
  startAt,
  duration,
  gain,
  type = "sine",
}: {
  context: AudioContext;
  frequency: number;
  startAt: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export async function unlockTournamentAudio() {
  const context = getAudioContext();
  if (!context) return false;

  if (context.state === "suspended") {
    await context.resume();
  }

  isUnlocked = context.state === "running";
  return isUnlocked;
}

export function playTournamentSound(sound: TournamentSound) {
  const context = getAudioContext();
  if (!context || !isUnlocked || context.state !== "running") return;

  const now = context.currentTime;

  if (sound === "start") {
    tone({ context, frequency: 523.25, startAt: now, duration: 0.08, gain: 0.06 });
    tone({
      context,
      frequency: 659.25,
      startAt: now + 0.09,
      duration: 0.1,
      gain: 0.06,
    });
    return;
  }

  if (sound === "warning") {
    tone({
      context,
      frequency: 440,
      startAt: now,
      duration: 0.12,
      gain: 0.07,
      type: "square",
    });
    tone({
      context,
      frequency: 440,
      startAt: now + 0.18,
      duration: 0.12,
      gain: 0.07,
      type: "square",
    });
    return;
  }

  if (sound === "tick") {
    tone({
      context,
      frequency: 880,
      startAt: now,
      duration: 0.04,
      gain: 0.045,
      type: "triangle",
    });
    return;
  }

  tone({ context, frequency: 659.25, startAt: now, duration: 0.08, gain: 0.05 });
  tone({
    context,
    frequency: 783.99,
    startAt: now + 0.08,
    duration: 0.08,
    gain: 0.05,
  });
  tone({
    context,
    frequency: 1046.5,
    startAt: now + 0.16,
    duration: 0.14,
    gain: 0.05,
  });
}
