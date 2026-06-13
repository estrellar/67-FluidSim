import { MAX_PARTICLES } from "../sim/fluid/constants";

let gl: WebGL2RenderingContext;
let program: WebGLProgram;
let positionBuffer: WebGLBuffer;
let positionAttribLoc: number;
let pointSizeUniformLoc: WebGLUniformLocation;

const VS = `#version 300 es
#pragma vscode_glsllint_stage: vert
in vec2 a_position;
uniform float u_pointSize;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = u_pointSize;
}`;

const FS = `#version 300 es
#pragma vscode_glsllint_stage: frag
precision highp float;
out vec4 fragColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (r2 > 0.25) discard; // outside circle
  float alpha = 1.0 - smoothstep(0.20, 0.25, r2); // soft edge
  fragColor = vec4(0.4, 0.7, 1.0, alpha);
}`;

function compileShader(type: number, src: string): WebGLShader {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed');
    }
    return s;
}

export function initRenderer(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('webgl2', { alpha: true });
    if (!ctx) throw new Error('WebGL2 unavailable');
    gl = ctx;
    
    // build program
    program = gl.createProgram()!;
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
    }
  
    positionAttribLoc = gl.getAttribLocation(program, 'a_position');
    pointSizeUniformLoc = gl.getUniformLocation(program, 'u_pointSize')!;

    //allocate 4 bytes for max coord pairs, reuse
    positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * 2 * 4, gl.DYNAMIC_DRAW);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

export function uploadPositions(positions: Float32Array, activeCount: number){
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //only push active data
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions, 0, activeCount * 2);
}

export function draw(activeCount: number){
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    //point size
    gl.uniform1f(pointSizeUniformLoc, 9.0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttribLoc);
    gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.POINTS, 0, activeCount);
}

export function disposeRenderer(){
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
}