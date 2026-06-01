import confetti from 'canvas-confetti';

/** Святковий вибух конфетті — для успішних дій (відгук, відправка форми) */
export function celebrate() {
  const colors = ['#4A90E2', '#50E3C2', '#FFB84D', '#FF6B9D', '#FFD93D'];

  // Центральний вибух
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });

  // Два бічних залпи з затримкою
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 }, colors });
  }, 200);
}
