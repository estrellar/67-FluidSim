<template>
  <div class="wrap">
    <video ref="videoRef" class="feed" autoplay playsinline muted />
    <canvas ref="simCanvasRef" class="overlay" :width="props.width" :height="props.height"/>

    <!-- idle start screen -->
    <div class="idle-screen" v-if="gameState === 'idle'">
      <div class="game-title">67</div>
      <div class="game-subtitle">switch ur wrists to score</div>
      <button class="start-btn" @click="startGame">START</button>
    </div>

    <GameHud />
    <NameEntry />
    <HighScores />
  </div>
</template>

<script setup lang="ts">
import { useSkeleton, POSE_LANDMARKS } from '../composables/useSkeleton';
import { useGame } from '../composables/useGame';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { createSPHState, SPHState } from '../sim/fluid/state';
import { sim } from '../sim/fluid-sim';
import { disposeRenderer, draw, initRenderer, uploadPositions } from '../webgl/render';
import { spawn } from '../sim/fluid/spawn';
import GameHud from './game/GameHud.vue';
import NameEntry from './game/NameEntry.vue';
import HighScores from './game/HighScores.vue';

let state: SPHState;

let lastTime = performance.now();
const FIXED_DT = 1/60;
const MAX_SUBSTEPS = 10;
let accumulator = 0;
let rafId = 0;

const props = withDefaults(defineProps<{
    width?: number,
    height?: number
}>(), {
    width: 1280,
    height: 720
});

const simCanvasRef = ref<HTMLCanvasElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const { frame, init, attachVideo, start, dispose } = useSkeleton();
const { gameState, switchCount, startGame } = useGame();

let lastHigherWrist: 'left' | 'right' = 'left';
let emitRate = 0;

watch(gameState, (val) => {
    if (val === 'running') emitRate = 4;
});

function sweat() {
    const f = frame.value;
    if (!f) return;

    const { current, previous } = f;
    const leftWrist = current.keypoints[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = current.keypoints[POSE_LANDMARKS.RIGHT_WRIST];

    if (gameState.value === 'running' && leftWrist.visibility > 0.3 && rightWrist.visibility > 0.3) {
        const higher = leftWrist.y < rightWrist.y ? 'left' : 'right';
        if (higher !== lastHigherWrist) {
            switchCount.value++;
            emitRate = 2 * Math.floor(switchCount.value / 10);
            lastHigherWrist = higher;
        }
    }

    const dt = previous ? (current.timestamp - previous.timestamp) / 1000 : 0;
    for (const emitIdx of [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.RIGHT_EYE]) {
        const kp = current.keypoints[emitIdx];
        if (kp.visibility < 0.4) continue;

        const x = kp.x * 2 - 1;
        const y = (1 - kp.y * 2) + 0.2;

        let vx = 0, vy = 0;
        if (previous && dt > 0) {
            const pk = previous.keypoints[emitIdx];
            vx = emitIdx === POSE_LANDMARKS.RIGHT_EYE
                ? (kp.x - pk.x) * 2 / dt - 0.7
                : (kp.x - pk.x) * 2 / dt + 0.7;
            vy = -(kp.y - pk.y) * 2 / dt;
        }
        for (let i = 0; i < emitRate; i++) {
            spawn(state, x + (Math.random() - 0.5) * 1e-3, y + (Math.random() - 0.5) * 1e-3, vx, vy, 10);
        }
    }
}

function tick(now: number) {
    const elapsed = (now - lastTime)/1000;
    lastTime = now;
    accumulator += Math.min(elapsed, 0.1);

    sweat();

    let substeps = 0;
    while (accumulator >= FIXED_DT && substeps < MAX_SUBSTEPS) {
        sim(state, FIXED_DT);
        accumulator -= FIXED_DT;
        substeps++;
    }

    uploadPositions(state.positions, state.activeCount);
    draw(state.activeCount);

    rafId = requestAnimationFrame(tick);
}

onMounted(async () => {
    initRenderer(simCanvasRef.value!);
    state = createSPHState();
    lastTime = performance.now();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoRef.value!.srcObject = stream;

    await init();
    attachVideo(videoRef.value!);
    start();

    rafId = requestAnimationFrame(tick);
});

onUnmounted(() => {
    cancelAnimationFrame(rafId);
    disposeRenderer();
    dispose();
});
</script>

<style scoped>
.wrap {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
    font-family: 'Arial Black', sans-serif;
}

.feed {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* mirror the feed */
}

.overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transform: scaleX(-1); /* mirror to match feed */
}

.idle-screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
}

.game-title {
    font-size: 10rem;
    font-weight: 900;
    line-height: 1;
    color: #ffe600;
    text-shadow: 0 0 60px rgba(255, 230, 0, 0.4);
    letter-spacing: -0.02em;
}

.game-subtitle {
    font-size: 1.1rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #aaa;
    font-weight: 400;
    margin-top: -0.5rem;
}

.start-btn {
    margin-top: 1.5rem;
    padding: 1rem 4rem;
    background: #ffe600;
    color: #000;
    border: none;
    border-radius: 6px;
    font-family: inherit;
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 0.15em;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
}
.start-btn:hover { background: #fff176; }
.start-btn:active { transform: scale(0.96); }
</style>
