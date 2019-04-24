import {ObjectGenerator} from './application/ObjectGenerator';
import { RunnableApplication } from './engine/Application';
import {canvas, gl} from './engine/GLContext';
import {Mat4} from './engine/math/mat4';
import {inRadians} from './engine/math/Utils';
import {Shader} from './engine/Shader';
import {createShaderFromSources} from './engine/utils/Utils';
import {Cube} from './objects/Cube';
import {Plane} from './objects/Plane';
import {BasicShader} from './shaders/Basic';
import {BasicCube} from './shaders/BasicCube';
import {BasicShaderSingleColor} from './shaders/BasicSingleColor';

class Application extends RunnableApplication {

    private program: Shader;
    private wireFrameShader: Shader;
    private cubeShader: Shader;

    private cube: Cube;
    private perspective: Mat4;

    private plane: Plane;
    private wireframe: Plane;
    private heightmapTexture: WebGLTexture;

    onStart(): void {

        // ObjectGenerator.generateGridData(1, 1, 1, 1);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor( 91 / 255, 91 / 255, 91 / 255, 1.0);

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);

        this.program = createShaderFromSources(BasicShader);
        this.wireFrameShader = createShaderFromSources(BasicShaderSingleColor);
        this.cubeShader = createShaderFromSources(BasicCube);

        this.cube = new Cube();
        this.cube.init(this.cubeShader);

        this.plane = new Plane(10, 10, 0.05, 0.05, false);
        this.plane.setColor(31 / 255, 168 / 255, 16 / 255);
        this.plane.init(this.program);

        this.wireframe = new Plane(10, 10, 0.1, 0.1, true);
        this.wireframe.init(this.wireFrameShader);

        const aspect = canvas.width / canvas.height;
        this.perspective = Mat4.perspective(70, aspect, 0.1, 30);

        this.setStartLoopManually(true);
        this.loadHeightMap();
    }

    onUpdate(deltaTime: number): void {
        const time = new Date().getTime() / 500;
        // gl.clearColor(Math.sin(time), Math.cos(time), Math.sin(time) / Math.cos(time), 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1.0);

        // const model = Mat4.translate(0, 0, 40 * Math.sin(time / 10));
        // const model = Mat4.identity();
        // const model = Mat4.rotationX(inRadians(-30));
        const model = Mat4.rotationX(inRadians(  Math.sin(time / 10) * 15 - 15));

        const view = Mat4.translate(0, 0, -10);

        // this.drawNormal(time, model, view, this.perspective);
        this.drawWireFrame(time, model, view, this.perspective);
    }

    drawNormal(time: number, model: Mat4, view: Mat4, proj: Mat4) {
        this.program.use();
        gl.bindTexture(gl.TEXTURE_2D, this.heightmapTexture);

        const modelMatrixLocation = this.program.getUniformLocation('model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model.data);

        const viewMatrixLocation = this.program.getUniformLocation('view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.program.getUniformLocation('proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj.data);

        const heightMapLocation = this.program.getUniformLocation('heightmap');
        gl.activeTexture(gl.TEXTURE20);
        gl.bindTexture(gl.TEXTURE_2D, this.heightmapTexture);
        gl.uniform1i(heightMapLocation, 0);

        this.plane.draw(this.program);
        this.program.unuse();
    }

    drawWireFrame(time: number, model: Mat4, view: Mat4, proj: Mat4) {
        this.wireFrameShader.use();
        gl.bindTexture(gl.TEXTURE_2D, this.heightmapTexture);

        const modelMatrixLocation = this.wireFrameShader.getUniformLocation('model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model.data);

        const viewMatrixLocation = this.wireFrameShader.getUniformLocation('view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.wireFrameShader.getUniformLocation('proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj.data);

        const heightMapLocation = this.wireFrameShader.getUniformLocation('heightmap');
        gl.activeTexture(gl.TEXTURE20);
        gl.bindTexture(gl.TEXTURE_2D, this.heightmapTexture);
        gl.uniform1i(heightMapLocation, 0);

        const colorLocation = this.wireFrameShader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        this.wireframe.draw(this.wireFrameShader);
        this.wireFrameShader.unuse();
    }

    onHeightMapLoaded(heightmap: HTMLImageElement) {
        this.heightmapTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.heightmapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightmap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.startLoop();
    }

    loadHeightMap() {
        const heightMapCanvas =  document.createElement('canvas') as HTMLCanvasElement;
        document.body.appendChild(heightMapCanvas);
        const heightMap = new Image();
        const ctx = heightMapCanvas.getContext('2d') as CanvasRenderingContext2D;

        heightMap.onload = function() {
            heightMapCanvas.width = heightMap.width;
            heightMapCanvas.height = heightMap.height;
            ctx.drawImage(heightMap, 0, 0);
            this.onHeightMapLoaded(heightMap);
        }.bind(this);

        heightMap.src = '../img/heightmap.jpg';
    }

}

function main() {
    const app = new Application();
    app.start();
}

window.onload = main;
