import {mat4} from 'gl-matrix';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {PersonDebugShader} from '../shaders/debug/PersonDebugShader';
import {HeightMapShader} from '../shaders/heightmap/HeightMapShader';
import {FDGBuffers} from './FDGBuffers';
import {NormalsCalculator} from './NormalsCalculator';
import {PixelGrid} from './PixelGrid';

class ChunkDrawInfo {
    constructor(public vao: WebGLVertexArrayObject, public elements: number) {}
}

export class HeightMapRenderer {

    private shader: Shader;
    private personDebug: Shader;

    private chunkInfos: ChunkDrawInfo[];
    private pixelsX: number;
    private pixelsY: number;
    private width: number;
    private height: number;

    private cubeVAO: WebGLVertexArrayObject;

    private normalsCalculator: NormalsCalculator;

    private createInstanceInfo() {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // POSITION
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, CUBEDATA, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBEINDICES, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        this.cubeVAO = vao;
    }


    init(width: number, height: number, tilesX: number, tilesY: number, pixelsX: number, pixelsY: number) {

        this.width = width;
        this.height = height;

        this.pixelsX = pixelsX;
        this.pixelsY = pixelsY;

        this.shader = createShaderFromSources(HeightMapShader);
        this.personDebug = createShaderFromSources(PersonDebugShader);

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

        this.normalsCalculator = new NormalsCalculator();
        this.normalsCalculator.init(tilesX, tilesY, pixelsX, pixelsY, width / tilesX, height / tilesY);

        this.createInstanceInfo();
    }

    drawWireFrame(buffer: FDGBuffers, heightMapTexture: WebGLTexture, height: number, model: mat4, view: mat4, proj: mat4, renderPerson: boolean = false) {

        this.normalsCalculator.calculateNormals(heightMapTexture, height);

        TPAssert(this.shader != null, 'Shader == null! Forgot to init HeightMapRenderer?');

        this.shader.use();

        const modelMatrixLocation = this.shader.getUniformLocation('u_model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model);

        const viewMatrixLocation = this.shader.getUniformLocation('u_view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view);

        const projectionMatrixLocation = this.shader.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

        gl.bindImageTexture(0, heightMapTexture, 0, false, 0, gl.READ_ONLY, gl.R32F);

        const colorLocation = this.shader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        gl.uniform2f(this.shader.getUniformLocation('u_size'), this.pixelsX, this.pixelsY);

        const heightLocation = this.shader.getUniformLocation('u_height');
        gl.uniform1f(heightLocation, height);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.normalsCalculator.getNormalsBuffer());
        gl.uniform2f(this.shader.getUniformLocation('u_gridSize'), this.normalsCalculator.tilesX, this.normalsCalculator.tilesY);

        for (const chunkInfo of this.chunkInfos) {
            gl.bindVertexArray(chunkInfo.vao);
            gl.drawElements(gl.LINES , chunkInfo.elements, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

        this.shader.unuse();

        if(renderPerson) {
            this.renderPersonDebug(buffer, height, model, view, proj);
        }
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


    public renderPersonDebug(buffers: FDGBuffers, height: number, model: mat4, view: mat4, proj: mat4) {
        this.personDebug.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.valuesBuffer);

        const modelMatrixLocation = this.personDebug.getUniformLocation('u_model');
        gl.uniformMatrix4fv(modelMatrixLocation, false, model);

        const viewMatrixLocation = this.personDebug.getUniformLocation('u_view');
        gl.uniformMatrix4fv(viewMatrixLocation, false, view);

        const projectionMatrixLocation = this.personDebug.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

        gl.uniform2f(this.personDebug.getUniformLocation('u_sizeMap'), this.width, this.height);
        gl.uniform2f(this.personDebug.getUniformLocation('u_scale'), this.width / this.pixelsX, this.height / this.pixelsY);

        const heightLocation = this.personDebug.getUniformLocation('u_height');
        gl.uniform1f(heightLocation, height);

        const colorLocation = this.personDebug.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

        gl.bindVertexArray(this.cubeVAO);
        gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, buffers.count);
        gl.bindVertexArray(null);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

        this.personDebug.unuse();
    }

}

const CUBEDATA = new Float32Array([
    // Front face
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
]);

const CUBEINDICES = new Int16Array([
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
]);
