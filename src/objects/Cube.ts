import {gl} from '../engine/Context';
import {Shader} from '../engine/Shader';
import {IRenderable} from './IRenderable';
import {ObjectGenerator} from './ObjectGenerator';

export class Cube implements IRenderable {

    vertBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;

    vao: WebGLVertexArrayObject;

    numElements: number;

    constructor(private size: number = 1) {

    }

    init(shader: Shader): void {

        const [vertices, indices] = ObjectGenerator.generateCube(this.size);

        const colors = [
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ];

        this.numElements = indices.length;

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

        // COLOR

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const colorLocation = shader.getAttribLocation('a_color');
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        gl.bindVertexArray(null);
    }

    draw(shader: Shader): void {
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

}
