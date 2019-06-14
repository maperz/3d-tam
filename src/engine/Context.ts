import {TPAssert} from './error/TPException';

export declare let gl: WebGL2ComputeRenderingContext;
export declare let canvas: HTMLCanvasElement;
export declare let ctx: CanvasRenderingContext2D;

export function setupWebGL2Context(canvasName: string = 'canvas', attributes = {}) {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    gl = canvas.getContext('webgl2', attributes) as WebGL2ComputeRenderingContext;
    TPAssert(gl != null, 'Failed to setup WebGL2Context');
    return gl;
}

export function setupCanvas2DContext(canvasName: string = 'canvas') {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return ctx;
}

export function setupComputeGLContext(canvasName: string = 'canvas', attributes = {}) {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    gl = canvas.getContext('webgl2-compute', attributes) as WebGL2ComputeRenderingContext;
    TPAssert(gl != null, 'Failed to setup GLComputeContext');
    return gl;
}
