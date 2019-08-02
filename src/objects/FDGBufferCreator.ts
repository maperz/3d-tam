import {gl} from '../engine/Context';

export class FDGBufferCreator {

    get positionBuffer(): WebGLBuffer {
        return this._positionBuffer;
    }

    get infosBuffer(): WebGLBuffer {
        return this._infosBuffer;
    }

    get neighboursBuffer(): WebGLBuffer {
        return this._neighboursBuffer;
    }

    get attractionBuffers(): WebGLBuffer {
        return this._attractionBuffers;
    }

    get repulsionBuffers(): WebGLBuffer {
        return this._repulsionBuffers;
    }

    private _positionBuffer: WebGLBuffer;
    private _infosBuffer: WebGLBuffer;
    private _neighboursBuffer: WebGLBuffer;
    private _attractionBuffers: WebGLBuffer;
    private _repulsionBuffers: WebGLBuffer;

    createBuffers() {
        const samples = 200;
        this._attractionBuffers = this.createAttractionBuffer(samples);
        this._repulsionBuffers = this.createRepulsionBuffer(samples);
        this._positionBuffer = this.createPositionsBuffer(samples);
        this._infosBuffer = this.createInfoBuffer(samples);
        this._neighboursBuffer = this.createNeighboursBuffer(samples);
    }

    private createPositionsBuffer(numSamples: number): WebGLBuffer {
        /* Position buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of position
        // Y: y-value of position
        */
        const buffer = gl.createBuffer();
        const data = new Array(numSamples * 2).fill(0);
        const positions = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, positions, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createInfoBuffer(numSamples: number): WebGLBuffer {
        /* Info buffer has following entries:
        //
        // | count (Int) | offset (Int) |
        //
        // count: number of neighbours this entry has
        // offset: the offset into the neighbours buffer
        */

        const buffer = gl.createBuffer();
        const data = new Array(numSamples * 2).fill(0);
        const infos = new Int32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, infos, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createNeighboursBuffer(numSamples: number): WebGLBuffer {
        /* Neighbours buffer has following entries:
        //
        // | id_0 (Int) | id_1 (Int) | ... | id_(count-1) (Int) |
        //
        // id_j: id of the j'th neighbour
        //
        // Note: This does not need to contain neighbours for every
        // id, since count can be zero.
        */

        const buffer = gl.createBuffer();
        const data = new Array(0).fill(0);
        const infos = new Int32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, infos, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createAttractionBuffer(numSamples: number): WebGLBuffer {
        /* Attraction buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of attraction force
        // Y: y-value of attraction force
        */

        const buffer = gl.createBuffer();
        const data = new Array(numSamples * 2).fill(0);
        const forces = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, forces, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createRepulsionBuffer(numSamples: number): WebGLBuffer {
        /* Repulsion buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of repulsion force
        // Y: y-value of repulsion force
        */

        const buffer = gl.createBuffer();
        const data = new Array(numSamples * 2).fill(0);
        const forces = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, forces, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }
}
