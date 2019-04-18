import {ObjectGenerator} from '../application/ObjectGenerator';
import {gl} from '../engine/GLContext';
import {Shader} from '../engine/Shader';
import {Renderable} from './Renderable';

export class Plane implements Renderable {


    vertBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    numElements: number;

    vao: WebGLVertexArrayObject;
    private color = [1.0, 1.0, 1.0];

    constructor(private numX: number, private numY: number, private sizeX: number, private sizeY: number, private wireframe: boolean = false) {
    }


    init(shader: Shader): void {
        let [vertices, indices] = ObjectGenerator.generateGridData(this.numX, this.numY, this.sizeX, this.sizeY, this.wireframe);

        let colors : number[] = []
        for(let _ in vertices){
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

        // COLOR

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const colorLocation = shader.getAttribLocation('color');
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        gl.bindVertexArray(null);

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
