<template>
  <div class="scores-screen" v-if="gameState === 'scores'">
    <div class="title">HIGH SCORES</div>

    <table class="board">
      <thead>
        <tr>
          <th>#</th>
          <th>NAME</th>
          <th>SCORE</th>
          <th>DATE</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in scores"
          :key="i"
          :class="{ highlight: entry.score === lastScore && entry.name === lastName }"
        >
          <td class="rank">{{ i + 1 }}</td>
          <td class="name">{{ entry.name }}</td>
          <td class="score">{{ entry.score }}</td>
          <td class="date">{{ entry.date }}</td>
        </tr>
        <tr v-if="scores.length === 0">
          <td colspan="4" class="empty">no scores yet. go touch some grass (or don't)</td>
        </tr>
      </tbody>
    </table>

    <button class="play-again" @click="playAgain">PLAY AGAIN</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGame } from '../../composables/useGame';

const { gameState, switchCount, startGame, loadScores } = useGame();

const scores = computed(() => loadScores());

// capture the just-submitted score to highlight it
const lastScore = ref(0);
const lastName = ref('');

watch(gameState, (val) => {
  if (val === 'scores') {
    const top = loadScores();
    // the newest entry at this score is the one we just saved
    lastScore.value = switchCount.value;
    lastName.value = top.find(s => s.score === switchCount.value)?.name ?? '';
  }
});

function playAgain() {
  startGame();
}
</script>

<style scoped>
.scores-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  background: rgba(0, 0, 0, 0.82);
  font-family: 'Arial Black', sans-serif;
  color: white;
}

.title {
  font-size: 2rem;
  letter-spacing: 0.25em;
  color: #ffe600;
  text-transform: uppercase;
}

.board {
  border-collapse: collapse;
  width: min(480px, 90%);
  font-size: 1rem;
}

.board th {
  color: #888;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  padding: 0.3rem 1rem;
  border-bottom: 1px solid #333;
  text-align: left;
}

.board td {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #1e1e1e;
}

tr.highlight td {
  color: #ffe600;
}

.rank { color: #555; width: 2rem; }
.name { font-size: 1.3rem; font-weight: 900; letter-spacing: 0.1em; }
.score { font-size: 1.3rem; font-weight: 900; text-align: right; }
.date { color: #555; font-size: 0.75rem; font-weight: 400; text-align: right; }
.empty { color: #555; text-align: center; font-size: 0.85rem; font-weight: 400; padding: 1.5rem; }

.play-again {
  margin-top: 0.5rem;
  padding: 0.8rem 3rem;
  background: #ffe600;
  color: #000;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.play-again:hover { background: #fff176; }
.play-again:active { transform: scale(0.96); }
</style>
