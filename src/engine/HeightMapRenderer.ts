import {Plane} from '../objects/Plane';
import {BasicShaderSingleColor} from '../shaders/BasicSingleColor';
import {canvas, gl} from './Context';
import {Mat4} from './math/mat4';
import {Shader} from './Shader';
import {createShaderFromSources} from './utils/Utils';

export class HeightMapRenderer {

    wireFrameShader : Shader;
    wireFrame : Plane;
    perspective: Mat4;

    init(width: number, height: number, tilesX: number, tilesY: number) {
        this.wireFrameShader = createShaderFromSources(BasicShaderSingleColor);
        this.wireFrame = new Plane(width, height, tilesX, tilesY, true);
        this.wireFrame.init(this.wireFrameShader);

    }

    drawWireFrame(heightMapTexture: WebGLTexture, time: number, model: Mat4, view: Mat4, proj: Mat4){

        this.wireFrameShader.use();
        gl.bindTexture(gl.TEXTURE_2D, heightMapTexture);

        const modelMatrixLocation = this.wireFrameShader.getUniformLocation('model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model.data);

        const viewMatrixLocation = this.wireFrameShader.getUniformLocation('view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.wireFrameShader.getUniformLocation('proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj.data);

        const heightMapLocation = this.wireFrameShader.getUniformLocation('heightmap');
        gl.activeTexture(gl.TEXTURE20);
        gl.bindTexture(gl.TEXTURE_2D, heightMapTexture);
        gl.uniform1i(heightMapLocation, 0);

        const colorLocation = this.wireFrameShader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        this.wireFrame.draw(this.wireFrameShader);
        this.wireFrameShader.unuse();
    }

}
