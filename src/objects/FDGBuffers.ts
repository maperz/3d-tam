import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {GraphData} from './GraphData';

export class FDGBuffers {

    get positionBuffer(): WebGLBuffer {
        TPAssert(this._positionBuffer != null, 'Position Buffer not created yet!');
        return this._positionBuffer;
    }

    get infosBuffer(): WebGLBuffer {
        TPAssert(this._infosBuffer != null, 'Infos Buffer not created yet!');
        return this._infosBuffer;
    }

    get neighboursBuffer(): WebGLBuffer {
        TPAssert(this._neighboursBuffer != null, 'Neighbours Buffer not created yet!');
        return this._neighboursBuffer;
    }

    get attractionBuffers(): WebGLBuffer {
        TPAssert(this._attractionBuffers != null, 'Attraction Buffer not created yet!');
        return this._attractionBuffers;
    }

    get repulsionBuffers(): WebGLBuffer {
        TPAssert(this._repulsionBuffers != null, 'Repulsion Buffer not created yet!');
        return this._repulsionBuffers;
    }

    get valuesBuffer(): WebGLBuffer {
        TPAssert(this._valuesBuffer != null, 'Values Buffer not created yet!');
        return this._valuesBuffer;
    }

    get numSamples(): number {
        return this._numSamples;
    }

    private _numSamples: number = 0;
    private _positionBuffer: WebGLBuffer;
    private _infosBuffer: WebGLBuffer;
    private _neighboursBuffer: WebGLBuffer;
    private _attractionBuffers: WebGLBuffer;
    private _repulsionBuffers: WebGLBuffer;
    private _valuesBuffer: WebGLBuffer;

    init(graph: GraphData) {
        this._numSamples = graph.getCount();
        this._attractionBuffers = this.createAttractionBuffer(graph);
        this._repulsionBuffers = this.createRepulsionBuffer(graph);
        this._positionBuffer = this.createPositionsBuffer(graph);
        this._infosBuffer = this.createInfoBuffer(graph);
        this._neighboursBuffer = this.createNeighboursBuffer(graph);
        this._valuesBuffer = this.createValuesBuffer(graph);
    }

    private createPositionsBuffer(graph: GraphData): WebGLBuffer {
        /* Position buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of position
        // Y: y-value of position
        */
        const buffer = gl.createBuffer();
        const count = graph.getCount();
        const data = new Array(count * 2).fill(0);

        for(let i = 0; i < graph.getCount(); i++) {
            const position = graph.getPosition(i);
            const index = i * 2;
            data[index] = position[0];
            data[index + 1] = position[1];
        }

        const positions = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, positions, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createInfoBuffer(graph: GraphData): WebGLBuffer {
        /* Info buffer has following entries:
        //
        // | count (Int) | offset (Int) |
        //
        // count: number of neighbours this entry has
        // offset: the offset into the neighbours buffer
        */

        const buffer = gl.createBuffer();
        const count = graph.getCount();
        const data = new Array(count * 2).fill(0);
        let offset = 0;
        for(let i = 0; i < count; i++) {
            const neighbours = graph.getNeighbours(i);
            const numNeighbours = neighbours.length;

            const index = i * 2;
            data[index] = numNeighbours;
            data[index + 1] = offset;
            offset += numNeighbours;
        }
        const infos = new Int32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, infos, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createNeighboursBuffer(graph: GraphData): WebGLBuffer {
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

        const data = [];

        for(let i = 0; i < graph.getCount(); i++) {
            const neighbours = graph.getNeighbours(i);
            data.push(neighbours);
        }

        const infos = new Int32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, infos, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createAttractionBuffer(graph: GraphData): WebGLBuffer {
        /* Attraction buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of attraction force
        // Y: y-value of attraction force
        */

        const buffer = gl.createBuffer();
        const data = new Array(graph.getCount() * 2).fill(0);
        const forces = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, forces, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createRepulsionBuffer(graph: GraphData): WebGLBuffer {
        /* Repulsion buffer has following entries:
        //
        // | X (Float) | Y (Float) |
        //
        // X: x-value of repulsion force
        // Y: y-value of repulsion force
        */

        const buffer = gl.createBuffer();
        const data = new Array(graph.getCount() * 2).fill(0);
        const forces = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, forces, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }

    private createValuesBuffer(graph: GraphData): WebGLBuffer {
        /* Value buffer has following entries:
        //
        // | Value (Float) |
        //
        // Value: value of entry
        */

        const buffer = gl.createBuffer();

        const count = graph.getCount();
        const data = new Array(count).fill(0);

        for(let i = 0; i < graph.getCount(); i++) {
            data[i] = graph.getValue(i);
        }

        const values = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, values, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }
}
