import {ObjectGenerator} from './application/ObjectGenerator';
import { RunnableApplication } from './engine/Application';
import {canvas, gl} from './engine/GLContext';
import {Mat4} from './engine/math/mat4';
import {Shader} from './engine/Shader';
import {createShaderFromIDs} from './engine/utils/Utils';
import {Cube} from './objects/Cube';

class Application extends RunnableApplication {

    private program: Shader;

    private cube: Cube;
    private perspective: Mat4;

    onStart(): void {

        //ObjectGenerator.generateGridData(1, 1, 1, 1);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor(0.5, 0.2, 0.3, 1.0);

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        gl.viewport(0, 0, canvas.width, canvas.height);

        this.program = createShaderFromIDs('vertex-shader', 'fragment-shader');
        this.program.use();

        this.cube = new Cube();
        this.cube.init(this.program);

        const aspect = canvas.width / canvas.height;
        this.perspective = Mat4.perspective(70, aspect, 0.1, 30);

        //this.loadHeightMap();
    }

    onUpdate(deltaTime: number): void {
        const time = new Date().getTime() / 500;
        // gl.clearColor(Math.sin(time), Math.cos(time), Math.sin(time) / Math.cos(time), 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1.0);

        const modelMatrixLocation = this.program.getUniformLocation('model');

        const model = Mat4.rotationX(time / 10);
        // const model = Mat4.translate(0, 0, 40 * Math.sin(time / 10));
        //const model = Mat4.identity();

        gl.uniformMatrix4fv(modelMatrixLocation, false, model.data);

        const viewMatrixLocation = this.program.getUniformLocation('view');
        const view = Mat4.translate(3, 0, -10);
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.program.getUniformLocation('proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, this.perspective.data);


        this.cube.draw(this.program);
    }

    loadHeightMap() {
        const heightMapCanvas =  document.createElement('canvas') as HTMLCanvasElement
        document.body.appendChild(heightMapCanvas)
        const heightMap = new Image();
        const ctx = heightMapCanvas.getContext("2d") as CanvasRenderingContext2D;

        heightMap.onload = function () {
            heightMapCanvas.width = heightMap.width;
            heightMapCanvas.height = heightMap.height;
            ctx.drawImage(heightMap, 0, 0);
        };

        heightMap.src = '../img/heightmap.jpg';
    }

}

function main() {
    const app = new Application();
    app.start();
}

window.onload = main;
