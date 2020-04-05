import {vec2} from 'gl-matrix';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {GraphData} from './GraphData';

export class DataBuffers {
    private width: number;
    private height: number;

    get positionBuffer(): WebGLBuffer {
        TPAssert(this._positionBuffer != null, 'Position Buffer not created yet!');
        return this._positionBuffer;
    }

    get edgeIndexBuffer(): WebGLBuffer {
        TPAssert(this._edgeIndexBuffer != null, 'Edge Index Buffer not created yet!');
        return this._edgeIndexBuffer;
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

    get connectionsBuffer(): WebGLBuffer {
        TPAssert(this._connectionsBuffer != null, 'Connections Buffer not created yet!');
        return this._connectionsBuffer;
    }

    get position3dBuffer(): WebGLBuffer {
        TPAssert(this._position3dBuffer != null, 'Position3d Buffer not created yet!');
        return this._position3dBuffer;
    }

    get numSamples(): number {
        return this._numSamples;
    }

    get count(): number {
        return this._numSamples;
    }

    get connectionsCount(): number {
        return this._numConnections;
    }

    get edgeIndiciesCount(): number {
        return this._numIndicies;
    }

    private _numSamples: number = 0;
    private _numConnections: number = 0;
    private _numIndicies: number = 0;

    private _positionBuffer: WebGLBuffer;
    private _infosBuffer: WebGLBuffer;
    private _neighboursBuffer: WebGLBuffer;
    private _attractionBuffers: WebGLBuffer;
    private _repulsionBuffers: WebGLBuffer;
    private _valuesBuffer: WebGLBuffer;
    private _connectionsBuffer: WebGLBuffer;
    private _edgeIndexBuffer: WebGLBuffer;
    private _position3dBuffer: WebGLBuffer;


    init(width: number, height: number, graph: GraphData) {

        this.width = width;
        this.height = height;

        this._numSamples = graph.getCount();
        this._attractionBuffers = this.createAttractionBuffer(graph);
        this._repulsionBuffers = this.createRepulsionBuffer(graph);
        this._positionBuffer = this.createPositionsBuffer(graph);
        this._infosBuffer = this.createInfoBuffer(graph);
        this._neighboursBuffer = this.createNeighboursBuffer(graph);
        this._valuesBuffer = this.createValuesBuffer(graph);
        this._position3dBuffer = this.createPositionsBuffer3d(graph);

        [this._connectionsBuffer, this._numConnections] = this.createConnectionsBuffer(graph);

        [this._edgeIndexBuffer, this._numIndicies] = this.createEdgeIndexBuffer(graph);
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

        const tw = this.width / 3;
        const th = this.height / 3;

        for(let i = 0; i < graph.getCount(); i++) {
            let position = graph.getPosition(i);

            if(!position) {
                const x = (Math.random() + 1) * tw;
                const y = (Math.random() + 1) * th;
                position = vec2.fromValues(x, y);
            }
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
            for(let neighbour of neighbours) {
                data.push(neighbour);
            }
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

    private createConnectionsBuffer(graph: GraphData): [WebGLBuffer, number] {
        /* Connections buffer has following entries:
        //
        // | Id_0a |  Id_0b | Id_1a ...
        //
        // Id_0a: First id of node in connection 0
        // Id_0a: Second id of node in connection 0
        */

        const buffer = gl.createBuffer();

        let count = 0;
        let data = [];

        for(let i = 0; i < graph.getCount(); i++) {
            const neighbours = graph.getNeighbours(i);
            for(const n of neighbours) {
                if(n > i) {
                    data.push(i, n);
                    count++;
                }
            }
        }

        const values = new Int32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, values, gl.STATIC_COPY);
        gl.bindBuffer( gl.SHADER_STORAGE_BUFFER, null);

        return [buffer, count];
    }

    private createEdgeIndexBuffer(graph: GraphData): [WebGLBuffer, number]  {
        // Indices for all lines between graph nodes

        const buffer = gl.createBuffer();

        const data = [];

        for(let i = 0; i < graph.getCount(); i++) {
            const neighbours = graph.getNeighbours(i);
            for(let neighbour of neighbours) {
                if(neighbour > i) {
                    data.push(i, neighbour);
                }
            }
        }

        const values = new Int16Array(data);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STATIC_COPY);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return [buffer, values.length];
    }

    private createPositionsBuffer3d(graph: GraphData): WebGLBuffer {
        /* Position buffer has following entries:
        //
        // | X (Float) | Y (Float) | Z (Float) | W (Float)
        //
        // X: x-value of position in model space
        // Y: y-value of position in model space
        // Z: z-value of position in model space
        */
        const buffer = gl.createBuffer();
        const count = graph.getCount() * 4;
        const data = new Array(count).fill(0);
        const positions = new Float32Array(data);

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, positions, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        return buffer;
    }
}
