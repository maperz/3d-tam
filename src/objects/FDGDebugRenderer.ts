import {mat4} from "gl-matrix";
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {FDGDebugLineShader} from '../shaders/fdgdebug/FDGDebugLineShader';
import {FDGDebugShader} from '../shaders/fdgdebug/FDGDebugShader';
import {FDGBuffers} from './FDGBuffers';

export class FDGDebugRenderer {

    private initialized: boolean = false;
    private buffers: FDGBuffers;

    private nodesShader: Shader;
    private linesShader: Shader;
    private quadVao: WebGLVertexArrayObject;


    private readonly NODE_SIZE = 5.0;
    private readonly NODE_COLOR = [1.0, 0.2, 0.2];

    private readonly EDGE_SIZE = 2.0;
    private readonly EDGE_COLOR = [1.0, 1.0, 1.0];

    init(buffers: FDGBuffers) {

        this.buffers = buffers;
        this.initialized = true;

        this.nodesShader = createShaderFromSources(FDGDebugShader);
        this.linesShader = createShaderFromSources(FDGDebugLineShader);

        this.createInstanceInfo();
    }


    QUADDATA = new Float32Array([
        -1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
         -1.0, 1.0, 0.0,
         1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
    ]);

    private createInstanceInfo() {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // POSITION
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.QUADDATA, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);

        this.quadVao = vao;
    }


    private drawNodes(proj: mat4) {
        this.nodesShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.buffers.positionBuffer);

        const projectionMatrixLocation = this.nodesShader.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

        const colorLocation = this.nodesShader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, this.NODE_COLOR[0], this.NODE_COLOR[1], this.NODE_COLOR[2], 1.0);

        const sizeLocation = this.nodesShader.getUniformLocation('u_size');
        gl.uniform1f(sizeLocation, this.NODE_SIZE);

        gl.bindVertexArray(this.quadVao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 12, this.buffers.count);
        gl.bindVertexArray(null);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

        this.nodesShader.unuse();
    }


    private drawEdges(proj: mat4) {
        this.linesShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this.buffers.connectionsBuffer);

        const projectionMatrixLocation = this.linesShader.getUniformLocation('u_proj');
        gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

        const colorLocation = this.linesShader.getUniformLocation('u_color');
        gl.uniform4f(colorLocation, this.EDGE_COLOR[0], this.EDGE_COLOR[1], this.EDGE_COLOR[2], 1.0);

        const sizeLocation = this.linesShader.getUniformLocation('u_size');
        gl.uniform1f(sizeLocation, this.EDGE_SIZE);

        gl.bindVertexArray(this.quadVao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 12, this.buffers.connectionsCount);
        gl.bindVertexArray(null);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

        this.linesShader.unuse();
    }

    drawDebugInfo(width: number, height: number) {
        TPAssert(this.initialized, 'FDGDebugRenderer.ts not initialized');
        const ortho = mat4.ortho(mat4.create(), 0, width, 0, height, -2, 2);
        this.drawEdges(ortho);
        this.drawNodes(ortho);
    }

}
