import {gl} from '../engine/Context';
import {IRenderable} from '../engine/IRenderable';
import {Shader} from '../engine/Shader';
import {ObjectGenerator} from './ObjectGenerator';

export class Plane implements IRenderable {

    vertBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    uvBuffer: WebGLBuffer;

    numElements: number;

    vao: WebGLVertexArrayObject;
    private color = [1.0, 1.0, 1.0];

    constructor(private width: number,
                private height: number,
                private sizeX: number,
                private sizeY: number,
                private wireframe: boolean = false) {
    }

    init(shader: Shader): void {
        shader.use();
        const numTilesX = this.width / this.sizeX;
        const numTilesY = this.height / this.sizeY;

        const [vertices, indices, uvs] = ObjectGenerator.generateGridData(numTilesX, numTilesY,
            this.sizeX, this.sizeY, this.wireframe);

        const colors: number[] = [];
        for (const _ of vertices) {
            colors.push(this.color[0], this.color[1], this.color[2]);
        }

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // POSITION
        this.vertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const positionLocation = shader.getAttribLocation('position');
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        // INDEX

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.numElements = indices.length;

        // UV

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

        const uvLocation = shader.getAttribLocation('uvs');
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvLocation);

        // COLOR

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        shader.unuse();
    }

    draw(shader: Shader): void {
        gl.bindVertexArray(this.vao);
        gl.drawElements(this.wireframe ? gl.LINES : gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    setColor(x: number, y: number, z: number) {
        this.color = [x, y, z];
    }

}
