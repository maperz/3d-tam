import {PixelGrid} from '../objects/PixelGrid';
import {HeightMapShader} from '../shaders/heightmap/HeightMapShader';
import {gl} from './Context';
import {TPAssert} from './error/TPException';
import {Mat4} from './math/mat4';
import {Shader} from './Shader';
import {createShaderFromSources} from './utils/Utils';

class ChunkDrawInfo {
    constructor(public vao: WebGLVertexArrayObject, public elements: number) {}
}

export class HeightMapRenderer {

    private shader: Shader;
    private chunkInfos: ChunkDrawInfo[];

    init(width: number, height: number, pixelsX: number, pixelsY: number) {
        this.shader = createShaderFromSources(HeightMapShader);
        const grid = new PixelGrid(width, height, pixelsX, pixelsY);
        console.log(grid);

        this.chunkInfos = new Array<ChunkDrawInfo>();

        const verticesData = grid.getVertices();
        const indicesData = grid.getIndices();
        const pixelData = grid.getPixels();

        for (let chunk = 0; chunk < grid.getChunkCount(); chunk++) {
            const vertices = verticesData[chunk];
            const indices = indicesData[chunk];
            const pixels = pixelData[chunk];
            const chunkInfo = this.createChunkInfo(vertices, indices, pixels);
            this.chunkInfos.push(chunkInfo);
        }
    }

    drawWireFrame(dilatedTexture: WebGLTexture, heightMapTexture: WebGLTexture, height: number, model: Mat4, view: Mat4, proj: Mat4) {

        TPAssert(this.shader != null, 'Shader == null! Forgot to init HeightMapRenderer?');

        this.shader.use();

        const modelMatrixLocation = this.shader.getUniformLocation('u_model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model.data);

        const viewMatrixLocation = this.shader.getUniformLocation('u_view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view.data);

        const projectionMatrixLocation = this.shader.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj.data);

        gl.bindImageTexture(0, heightMapTexture, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(1, dilatedTexture, 0, false, 0, gl.READ_ONLY, gl.R32F);

        const colorLocation = this.shader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        const heightLocation = this.shader.getUniformLocation('u_height');
        gl.uniform1f(heightLocation, height);

        for (const chunkInfo of this.chunkInfos) {
            gl.bindVertexArray(chunkInfo.vao);
            gl.drawElements(gl.LINES , chunkInfo.elements, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }

        this.shader.unuse();
    }

    private createChunkInfo(vertices: Float32Array, indices: Uint16Array, pixels: Int32Array): ChunkDrawInfo {

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // POSITION
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // INDEX
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        const elements = indices.length;

        // Pixels
        const pixelBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pixelBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, pixels, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribIPointer(1, 2, gl.INT, 0, 0);
        gl.bindVertexArray(null);

        return new ChunkDrawInfo(vao, elements);
    }

}
