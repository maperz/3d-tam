export declare let gl: WebGL2RenderingContext;
export declare let canvas: HTMLCanvasElement;
export declare let ctx: CanvasRenderingContext2D;


export function setupWebGL2Context(canvasName: string = 'canvas') {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
}

export function setupCanvas2DContext(canvasName: string = 'canvas') {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
}
