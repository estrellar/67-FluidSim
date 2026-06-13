import { ref, onUnmounted, readonly } from 'vue'
import * as poseDetection from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'
import * as tf from '@tensorflow/tfjs-core'

//*************TYPES*************

export interface Keypoint {
  x: number  // normalised 0–1
  y: number
  z: number
  visibility: number
}

export interface PoseFrame{
  keypoints: Keypoint[],
  timestamp: number
}

export interface SkeletonFrame {
  current: PoseFrame
  previous: PoseFrame | null
}

//keypoints captured by pose-detection
export const POSE_LANDMARKS = {
  NOSE:            0,
  LEFT_EYE:        1,  RIGHT_EYE:       2,
  LEFT_EAR:        3,  RIGHT_EAR:       4,
  LEFT_SHOULDER:   5,  RIGHT_SHOULDER:  6,
  LEFT_ELBOW:      7,  RIGHT_ELBOW:     8,
  LEFT_WRIST:      9,  RIGHT_WRIST:     10,
  LEFT_HIP:        11, RIGHT_HIP:       12,
  LEFT_KNEE:       13, RIGHT_KNEE:      14,
  LEFT_ANKLE:      15, RIGHT_ANKLE:     16,
} as const

//connections between vertices
export const BONES: [number, number][] = [
  [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_EYE
  ],
  [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.RIGHT_EYE
  ],
  [
    POSE_LANDMARKS.LEFT_EYE,
    POSE_LANDMARKS.LEFT_EAR
  ],
  [
    POSE_LANDMARKS.RIGHT_EYE,
    POSE_LANDMARKS.RIGHT_EAR
  ],
  [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER
  ],
  [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP
  ],
  [
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_HIP
  ],
  [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP
  ],
  [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW
  ],
  [
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST
  ],
  [
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_ELBOW
  ],
  [
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.RIGHT_WRIST
  ],
  [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.LEFT_KNEE
  ],
  [
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE
  ],
  [
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.RIGHT_KNEE
  ],
  [
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
]

// ********* Smoothing **************

const SMOOTHING = 0.35

function smooth(prev: Keypoint[] | null, next: Keypoint[]): Keypoint[] {
  if (!prev || prev.length !== next.length) return next
  return next.map((kp, i) => ({
    x:Math.max(Math.min(1.0, (prev[i].x + SMOOTHING * (kp.x - prev[i].x))), -1.0),
    y:Math.max(Math.min(1.0, (prev[i].y + SMOOTHING * (kp.y - prev[i].y))), -1.0),
    z:Math.max(Math.min(1.0, (prev[i].z + SMOOTHING * (kp.z - prev[i].z))), -1.0),
    visibility:Math.max(Math.min(1.0, (prev[i].visibility + SMOOTHING * (kp.visibility - prev[i].visibility))), -1.0)
  }))
}

function tfToKeypoints(
  kps: poseDetection.Keypoint[],
  videoWidth: number,
  videoHeight: number,
): Keypoint[] {
  return kps.map(kp => ({
    x:kp.x / videoWidth,
    y:kp.y / videoHeight,
    z:(kp.z ?? 0) / videoWidth,
    visibility:kp.score ?? 0,
  }))
}

// *********** COMPOSABLE ************

export function useSkeleton() {
  const frame = ref<SkeletonFrame | null>(null)
  const isReady = ref(false)
  const isRunning = ref(false)
  const error = ref<string | null>(null)

  let detector: poseDetection.PoseDetector | null = null
  let videoEl: HTMLVideoElement | null = null
  let rafId: number | null = null
  let prevKeypoints: Keypoint[] | null = null
  //dont use reactive ref in hotloop
  let running = false

  async function init(): Promise<void> {
    try {
      await tf.setBackend('webgl')
      await tf.ready()
      console.info('[skeleton] TF backend:', tf.getBackend())

      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          enableSmoothing: false,
          minPoseScore: 0.3,
        } satisfies poseDetection.MoveNetModelConfig,
      )

      console.info('[skeleton] MoveNet loaded')
      isReady.value = true
    } catch (e) {
      error.value = `Failed to load MoveNet: ${e}`
      console.error(error.value)
    }
  }

  function attachVideo(el: HTMLVideoElement): void {
    videoEl = el
  }

  function start(): void {
    if (!isReady.value || !detector || !videoEl) {
      error.value = 'Call init() and attachVideo() before start()'
      return
    }
    running = true
    isRunning.value = true
    loop()
  }

  function stop(): void {
    running = false
    isRunning.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  async function loop(): Promise<void> {
    if (!running || !detector || !videoEl) return

    // wait for video to be ready
    if (videoEl.readyState < 2) {
      rafId = requestAnimationFrame(loop)
      return
    }

    try {
      const poses = await detector.estimatePoses(videoEl, { flipHorizontal: false })

      if (poses.length > 0 && poses[0].keypoints.length > 0) {
        const raw = tfToKeypoints(poses[0].keypoints, videoEl.videoWidth, videoEl.videoHeight)
        const smoothed = smooth(prevKeypoints, raw)

        const now = performance.now();
        const newCurrent = {keypoints: smoothed, timestamp: now};
        frame.value = {current: newCurrent, previous: frame.value?.current ?? null}
        prevKeypoints = smoothed
      }
    } catch (e) {
      console.error('[skeleton] estimatePoses failed:', e)
      error.value = `Inference error: ${e}`
      stop()
      return
    }

    if (running) rafId = requestAnimationFrame(loop)
  }

  async function dispose(): Promise<void> {
    stop()
    if (videoEl?.srcObject) {
      (videoEl.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoEl.srcObject = null
    }
    detector?.dispose()
    detector = null
    isReady.value = false
  }

  onUnmounted(dispose)

  return {
    frame:     readonly(frame),
    isReady:   readonly(isReady),
    isRunning: readonly(isRunning),
    error:     readonly(error),
    init,
    attachVideo,
    start,
    stop,
    dispose,
  }
}