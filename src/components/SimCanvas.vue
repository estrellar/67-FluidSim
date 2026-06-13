<template>
  <div class="wrap">
    <video ref="videoRef" class="feed" autoplay playsinline muted />
    <canvas ref="simCanvasRef" :width="props.width" :height="props.height"/>


    <!-- <div class="hud">
      <span class="badge" :class="{ active: isRunning }">
        {{ isRunning ? 'LIVE' : 'STOPPED' }}
      </span>
      <span class="badge">{{ fps }} fps</span>
      <span class="badge">{{ poseScore }}</span>
      <button @click="toggleRun">{{ isRunning ? 'Stop' : 'Start' }}</button>
    </div>

    <div v-if="captureError || error" class="error-banner">
      {{ captureError ?? error }}
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useSkeleton, BONES } from '../composables/useSkeleton'
import {ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { mat4 } from 'gl-matrix';
import { Keypoint } from '@tensorflow-models/pose-detection';


let latestPose: Keypoint[] | null = null;
let latestPoseTime = 0;
let previousPose: Keypoint[] | null = null;
let previousPoseTime = 0;
const isRunning = ref(false);






const props = withDefaults(defineProps<{
    width?: number,
    height?: number
}>(), {
    width: 1280,
    height: 720
});
const NUM_POINTS = 2000;
const P1 = 73856093;
const P2 = 6449887; 
const GRID_SIZE = 0.1;
const RAD = 0.09;
const GRID_COUNT = Math.ceil(2.0 / GRID_SIZE);

const gpuSupported = ref(true)
const simCanvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(async() => {
    await initGPU();
})

async function initGPU(){
     if(!navigator.gpu){
        gpuSupported.value = false;
        alert("gpu not supported");
        return;
    }
    const canvas = simCanvasRef.value;
    if(!canvas){
        alert("canvas not found");
        return
    }
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
if (!gl) {
    gpuSupported.value = false;
    alert("WebGL not supported");
    return;
}
    
    const vsSource = `
        attribute vec4 vertCoord;
        attribute vec4 vertColor;
        varying lowp vec4 vColor;
        void main() {
            gl_Position = vertCoord;
            vColor = vertColor;
            gl_PointSize = 4.0;
        }
    `;

    const fsSource = `
        precision mediump float;
        varying lowp vec4 vColor;
        void main() {
            //circular sprites
            vec2 d = gl_PointCoord - vec2(0.5);
            if (dot(d, d) > 0.25) discard;

            //set color
            gl_FragColor = vColor;
        }
    `;

    let program = initShaderProgram(gl, vsSource, fsSource);
    if(!program){
        alert("Could not init program");
        return;
    }

    const programInfo = {
        program: program,
        attribLocations: {
            coords: gl.getAttribLocation(program, "vertCoord"),
            state: gl.getAttribLocation(program, "vertColor")
        }
    };


    const buffers = initBuffers(gl);
    drawScene(gl, programInfo, buffers);
}
function drawScene(gl: WebGLRenderingContext, programInfo: any, buffers: any){
 gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programInfo.program);

    // positions
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pointsBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.coords,
        3,          // 3 components per vertex (x, y, z)
        gl.FLOAT,
        false,      // don't normalize
        0,          // stride (0 = tightly packed)
        0           // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.coords);

    // colors 
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorsBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.state,
        3,//rgb
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.state);

    gl.drawArrays(gl.POINTS, 0, NUM_POINTS);

}
function initBuffers(gl: WebGLRenderingContext, ) : any{
    return initPointBuffer(gl);
}

function initPointBuffer(gl:WebGLRenderingContext): any {
    const pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    
    //init $NUM_POINTS amount of coordinate points (2D)
    let points = new Array<number>(NUM_POINTS * 3);
    let pointColors = new Array<number>(NUM_POINTS * 3);
    let celledHashes: {[key: number]: Array<number>} = {};
    let highlightPoints = new Array<number>();
    for(let i:number = 0; i < NUM_POINTS * 3; i+=3){
        //x
        let x = ((Math.random() >  .5) ? -1 : 1)*Math.random();
        points[i] = x;
        //y
        let y = ((Math.random() >  .5) ? -1 : 1)*Math.random();
        points[i+1] = y;
        //ignore z; set at origin plane
        points[i+2] = 0.0;
        const h = cellHash(worldToCell(x), worldToCell(y));
        if (!celledHashes[h]) celledHashes[h] = [];
        celledHashes[h].push(i);

        
        pointColors[i]= 1.0;
        pointColors[i+1]= 1.0;
        pointColors[i+2]= 1.0;
        //choose ~3% for as points of interest
        if(Math.random() > 0.97){
            highlightPoints.push(i);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const colorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

    //identify points that are in range of chosen 3% of points
    for(let i = 0; i < highlightPoints.length; i++){
        const pointIndex = highlightPoints[i]
        const rawX = points[pointIndex];
        const rawY = points[pointIndex+1];
        const hlRow = worldToCell(rawX);
        const hlCol = worldToCell(rawY);

        const minRow = Math.max(0, hlRow - 1);
        const maxRow = Math.min(GRID_COUNT - 1, hlRow + 1);
        const minCol = Math.max(0, hlCol - 1);
        const maxCol = Math.min(GRID_COUNT - 1, hlCol + 1);
        for(let row = minRow;row <= maxRow; row++){
            for(let col = minCol; col <= maxCol; col++){
                const h = cellHash(row, col);
                //indexes of points in the current cell
                const indicesToCheck = celledHashes[h] ?? [];

                for(let j = 0; j < indicesToCheck.length; j++){
                    const index = indicesToCheck[j];
                    //skip highlighted point
                    if(index === pointIndex) continue;

                    //verify point in cell is a neighbor
                    const pointX = points[index];
                    const pointY = points[index+1];
                    const dx = rawX - pointX;
                    const dy = rawY - pointY;
                    const rSqr = dx*dx + dy*dy;
                    if( rSqr < RAD * RAD){
                        pointColors[index]     = 1.0;
                        pointColors[index + 1] = 0.0;
                        pointColors[index + 2] = 0.0;
                    }
                    
                }
            }
        }

    }
    //set points of interest color
    for (let i = 0; i < highlightPoints.length; i++) {
        const idx = highlightPoints[i];
        pointColors[idx]     = 0.0;
        pointColors[idx + 1] = 1.0;
        pointColors[idx + 2] = 1.0;
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointColors), gl.STATIC_DRAW)
    return {
        pointsBuffer,
        colorsBuffer
    };
}

function worldToCell(x: number): number {
    return Math.floor((x + 1.0) / GRID_SIZE);
}

function cellHash(cx:number, cy:number) : number{
    return ((cx * P1) ^ (cy * P2)) % NUM_POINTS;
}    


//******************WebGL Helpers*******************
function initShaderProgram(gl: WebGLRenderingContext, vsSource:string, fsSource:string): WebGLProgram | void{
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if(!vertexShader || !fragmentShader) return;

    const shaderProgram: WebGLProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)

    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert(`unable to init shader program: ${gl.getProgramInfoLog(shaderProgram)}`,);
        return;
    }

    return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type:  number, source:string): WebGLShader|void{
    const shader = gl.createShader(type);
    if(!shader) return;

    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(`An error occurred compiling shaders: ${gl.getShaderInfoLog(shader)}`)
        gl.deleteShader(shader);
        return;
    }
    return shader
}

</script>
