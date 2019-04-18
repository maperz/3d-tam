export declare let gl: WebGL2RenderingContext;
export declare let canvas: HTMLCanvasElement;

export function setupWebGL2Context(canvasName: string = 'canvas') {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
}
