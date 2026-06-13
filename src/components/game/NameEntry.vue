<template>
  <div class="name-entry" v-if="gameState === 'recordScore'">
    <div class="title">NEW HIGH SCORE</div>
    <div class="score-display">{{ switchCount }}</div>

    <div class="initials">
      <span
        v-for="(char, i) in paddedInitials"
        :key="i"
        class="initial-slot"
        :class="{ active: i === initials.length && initials.length < 3 }"
      >{{ char }}</span>
    </div>

    <div class="keyboard">
      <div class="key-row" v-for="row in ROWS" :key="row[0]">
        <button
          class="key"
          v-for="letter in row"
          :key="letter"
          :disabled="initials.length >= 3"
          @click="press(letter)"
        >{{ letter }}</button>
      </div>
      <div class="key-row actions">
        <button class="key wide" @click="backspace" :disabled="initials.length === 0">⌫</button>
        <button class="key wide confirm" @click="confirm" :disabled="initials.length !== 3">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGame } from '../../composables/useGame'

const { gameState, switchCount, saveScore } = useGame()

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

const initials = ref('')

const paddedInitials = computed(() =>
  Array.from({ length: 3 }, (_, i) => initials.value[i] ?? '_')
)

function press(letter: string) {
  if (initials.value.length < 3) initials.value += letter
}

function backspace() {
  initials.value = initials.value.slice(0, -1)
}

function confirm() {
  saveScore(initials.value, switchCount.value)
  initials.value = ''
  gameState.value = 'scores'
}
</script>

<style scoped>
.name-entry {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  background: rgba(0, 0, 0, 0.72);
  font-family: 'Arial Black', sans-serif;
  color: white;
}

.title {
  font-size: 1.4rem;
  letter-spacing: 0.2em;
  color: #ffe600;
  text-transform: uppercase;
}

.score-display {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
}

.initials {
  display: flex;
  gap: 0.6rem;
}

.initial-slot {
  width: 3rem;
  height: 3.6rem;
  border: 3px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0;
  border-radius: 6px;
  transition: border-color 0.15s;
}
.initial-slot.active {
  border-color: #ffe600;
  box-shadow: 0 0 12px rgba(255, 230, 0, 0.5);
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: center;
}

.key-row {
  display: flex;
  gap: 0.35rem;
}

.key {
  width: 2.6rem;
  height: 2.6rem;
  border: none;
  border-radius: 6px;
  background: #2a2a2a;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.1s, transform 0.08s;
  font-family: inherit;
}
.key:hover:not(:disabled) {
  background: #444;
}
.key:active:not(:disabled) {
  transform: scale(0.92);
  background: #ffe600;
  color: #000;
}
.key:disabled {
  opacity: 0.3;
  cursor: default;
}

.key.wide {
  width: 5.5rem;
}

.key.confirm {
  background: #ffe600;
  color: #000;
  font-weight: 900;
}
.key.confirm:hover:not(:disabled) {
  background: #fff176;
}
.key.confirm:disabled {
  background: #555;
  color: #888;
}

.actions {
  margin-top: 0.3rem;
}
</style>
