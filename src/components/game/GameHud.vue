<template>
  <div class="hud" v-if="gameState === 'running'">
    <div class="timer" :class="{ urgent: timeLeft <= 5 }">{{ timeLeft }}s</div>
    <div class="count">{{ switchCount }}</div>
    <Transition name="combo">
      <div
        class="combo-text"
        :key="comboKey"
        v-if="comboText"
        :class="comboSide"
        :style="{ '--angle': comboAngle }"
      >{{ comboText }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGame } from '../../composables/useGame';

const { switchCount, gameState, timeLeft } = useGame();

const COMBO_TIERS: { threshold: number; lines: string[] }[] = [
  { threshold: 5,  lines: ["no cap", "lowkey bussin", "slay", "sheesh"] },
  { threshold: 15, lines: ["go faster unc", "ate that", "it's giving", "fr fr"] },
  { threshold: 30, lines: ["mogged", "ngl you valid", "understood the assignment", "rizz check passed"] },
  { threshold: 50, lines: ["on god", "him behavior", "main character arc", "unhinged (compliment)"] },
  { threshold: 75, lines: ["era unlocked", "delulu but make it work", "sigma grindset", "bro cooked"] },
  { threshold: 100, lines: ["touch grass never", "goated no printer", "ate and left no crumbs", "W human"] },
];

const comboText = ref('');
const comboKey = ref(0);
const comboSide = ref<'left' | 'right'>('left');
const comboAngle = ref('0deg');

function pickLine(count: number): string {
  const tier = [...COMBO_TIERS].reverse().find(t => count >= t.threshold)
  if (!tier) return ''
  return tier.lines[Math.floor(Math.random() * tier.lines.length)]
}

watch(switchCount, (val) => {
  const text = pickLine(val)
  if (!text) return
  //only flash on milestone counts to avoid spamming
  const milestones = [5, 10, 15, 20, 30, 40, 50, 65, 75, 90, 100]
  if (!milestones.includes(val) && val % 25 !== 0) return
  comboSide.value = comboKey.value % 2 === 0 ? 'left' : 'right';
  const tilt = (Math.random() * 8 + 4) * (comboSide.value === 'left' ? -1 : 1);
  comboAngle.value = `${tilt}deg`;
  comboText.value = text;
  comboKey.value++;
})
</script>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: 'Arial Black', sans-serif;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
}

.timer {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2.5rem;
  font-weight: 900;
  transition: color 0.3s;
}
.timer.urgent {
  color: #ff4444;
  animation: pulse 0.5s infinite alternate;
}

.count {
  position: absolute;
  top: 1rem;
  left: 1.5rem;
  font-size: 4rem;
  font-weight: 900;
  line-height: 1;
}

.combo-text {
  position: absolute;
  top: 18%;
  font-size: 2.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  color: #ffe600;
  text-shadow: 0 0 20px rgba(255,230,0,0.6), 0 2px 8px rgba(0,0,0,0.9);
  transform: rotate(var(--angle));
  transform-origin: center center;
}
.combo-text.left  { left: 2rem; transform-origin: left center; }
.combo-text.right { right: 2rem; transform-origin: right center; }

/* combo pop-in / fade-out */
.combo-enter-active { animation: combo-pop 0.15s ease-out forwards; }
.combo-leave-active { animation: combo-fade 1.4s ease-in forwards; }

@keyframes combo-pop {
  from { opacity: 0; scale: 0.5; }
  to   { opacity: 1; scale: 1; }
}
@keyframes combo-fade {
  0%   { opacity: 1; translate: 0 0; }
  100% { opacity: 0; translate: 0 -50px; }
}

@keyframes pulse {
  from { transform: scale(1); }
  to   { transform: scale(1.12); }
}
</style>