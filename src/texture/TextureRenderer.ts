import {mat4, vec2, vec3} from 'gl-matrix';
import {gl} from '../engine/Context';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {ObjectGenerator} from '../objects/ObjectGenerator';
import {TexturedQuadShader} from '../shaders/texture/TexturedQuadShader';

export class TextureRenderer {

    private readonly MATRIX_LOCATION_NAME = "u_matrix";
    private readonly TEXTURE_LOCATION_NAME = "u_texture";

    private readonly POSITION_ATTRIBUTE = "a_position";
    private readonly UV_ATTRIBUTE = "a_texcoord";

    private shader: Shader;
    private matrixLocation: WebGLUniformLocation;
    private textureLocation: WebGLUniformLocation;

    private vao: WebGLVertexArrayObject;
    private numElements: number;

    private generateQuad(shader: Shader) {

        shader.use();

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertices = [
            0, 0,
            0, 1,
            1, 1,
            1, 0,
        ];

        const uvs = [
            0, 0,
            0, 1,
            1, 1,
            1, 0,
        ];

        const indices = [
            0, 1, 2,
            2, 3, 0,
        ];

        // POSITION
        const vertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const positionLocation = shader.getAttribLocation(this.POSITION_ATTRIBUTE);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        // INDEX
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.numElements = indices.length;

        // UV
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        const uvLocation = shader.getAttribLocation(this.UV_ATTRIBUTE);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvLocation);

        gl.bindVertexArray(null);
        this.shader.unuse();
    }

    init() : void {
        this.shader = createShaderFromSources(TexturedQuadShader);
        this.matrixLocation = this.shader.getUniformLocation(this.MATRIX_LOCATION_NAME);
        this.textureLocation = this.shader.getUniformLocation(this.TEXTURE_LOCATION_NAME);
        this.generateQuad(this.shader);
    }

    renderTexture(texture: WebGLTexture, position: vec2, size: vec2) {
        gl.bindTexture(gl.TEXTURE_2D, texture);

        this.shader.use();
        let matrix = mat4.ortho(mat4.create(), 0, gl.canvas.width, 0,  gl.canvas.height, -1, 1);
        mat4.translate(matrix, matrix, vec3.fromValues(position[0], position[1], 0));
        mat4.scale(matrix, matrix, vec3.fromValues(size[0], size[1], 1));

        gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
        gl.uniform1i(this.textureLocation, 0);

        gl.bindVertexArray(this.vao);
        gl.drawElements( gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        this.shader.unuse();
    }
}
