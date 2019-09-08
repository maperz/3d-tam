import {mat4} from 'gl-matrix';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {HeightMapShader} from '../shaders/heightmap/HeightMapShader';
import {PixelGrid} from './PixelGrid';

class ChunkDrawInfo {
    constructor(public vao: WebGLVertexArrayObject, public elements: number) {}
}

export class HeightMapRenderer {

    private shader: Shader;
    private chunkInfos: ChunkDrawInfo[];
    private pixelsX: number;
    private pixelsY: number;

    // TODO: Add numTilesX and numTilesY to control the resolution
    init(width: number, height: number, tilesX: number, tilesY: number, pixelsX: number, pixelsY: number) {

        this.pixelsX = pixelsX;
        this.pixelsY = pixelsY;

        this.shader = createShaderFromSources(HeightMapShader);
        const grid = new PixelGrid(width, height, tilesX, tilesY);

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

    drawWireFrame(dilatedTexture: WebGLTexture, heightMapTexture: WebGLTexture, height: number, model: mat4, view: mat4, proj: mat4) {

        TPAssert(this.shader != null, 'Shader == null! Forgot to init HeightMapRenderer?');

        this.shader.use();

        const modelMatrixLocation = this.shader.getUniformLocation('u_model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model);

        const viewMatrixLocation = this.shader.getUniformLocation('u_view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view);

        const projectionMatrixLocation = this.shader.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

        gl.bindImageTexture(0, heightMapTexture, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(1, dilatedTexture, 0, false, 0, gl.READ_ONLY, gl.R32F);

        const colorLocation = this.shader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        gl.uniform2f(this.shader.getUniformLocation('u_size'), this.pixelsX, this.pixelsY);

        const heightLocation = this.shader.getUniformLocation('u_height');
        gl.uniform1f(heightLocation, height);

        for (const chunkInfo of this.chunkInfos) {
            gl.bindVertexArray(chunkInfo.vao);
            gl.drawElements(gl.LINES , chunkInfo.elements, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }

        this.shader.unuse();
    }

    private createChunkInfo(vertices: Float32Array, indices: Uint16Array, pixels: Float32Array): ChunkDrawInfo {

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
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        return new ChunkDrawInfo(vao, elements);
    }

}
