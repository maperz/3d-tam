import {ObjectGenerator} from './application/ObjectGenerator';
import { RunnableApplication } from './engine/Application';
import {canvas, gl} from './engine/GLContext';
import {Mat4} from './engine/math/mat4';
import {inRadians} from './engine/math/Utils';
import {Shader} from './engine/Shader';
import {createShaderFromIDs} from './engine/utils/Utils';
import {Cube} from './objects/Cube';
import {Plane} from './objects/Plane';

class Application extends RunnableApplication {

    private program: Shader;

    private cube: Cube;
    private perspective: Mat4;

    private plane: Plane;
    private wireframe: Plane;

    onStart(): void {

        //ObjectGenerator.generateGridData(1, 1, 1, 1);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor( 147 / 255, 237 / 255, 255 / 255, 1.0);

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        gl.viewport(0, 0, canvas.width, canvas.height);

        this.program = createShaderFromIDs('vertex-shader', 'fragment-shader');
        this.program.use();

        this.cube = new Cube();
        this.cube.init(this.program);

        this.wireframe = new Plane(10, 10, 1, 1, true);
        this.wireframe.init(this.program);

        this.plane = new Plane(10, 10, 1, 1, false);
        this.plane.setColor(31 / 255, 168 / 255, 16 / 255);
        this.plane.init(this.program);

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
        const view = Mat4.translate(0, 0, -10);
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.program.getUniformLocation('proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, this.perspective.data);


        //this.cube.draw(this.program);

        const planeModel = Mat4.rotationX(inRadians(-30));
        gl.uniformMatrix4fv(modelMatrixLocation, false, planeModel.data);

        this.plane.draw(this.program);
        this.wireframe.draw(this.program);

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
