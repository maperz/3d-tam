import {gl} from './Context';
import {TPException} from './error/TPException';

export class Shader {
    program: WebGLProgram;

    constructor(public name: string) {}

    create(vertexSource: string, fragmentSource: string, computeShader: string = null): void {
        let vertex = null;
        let fragment = null;
        let compute = null;

        const program = gl.createProgram();
        if(vertexSource != null) {
            vertex = this.createShader(gl.VERTEX_SHADER, vertexSource);
            gl.attachShader(program, vertex);
        }

        if(fragmentSource != null) {
            fragment = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
            gl.attachShader(program, fragment);
        }

        if(computeShader != null) {
            compute = this.createShader(gl.COMPUTE_SHADER, computeShader);
            gl.attachShader(program, compute);
        }

        gl.linkProgram(program);

        if (gl.getError() !== gl.NO_ERROR) {
            gl.deleteProgram(this.program);
        }

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errorLog = gl.getProgramInfoLog(program);
            throw new TPException(`Failed to link Shader [${errorLog}]: ${errorLog}`);
        }

        if(vertex != null) {
            gl.detachShader(program, vertex);
            gl.deleteShader(vertex);
        }

        if(fragment != null) {
            gl.detachShader(program, fragment);
            gl.deleteShader(fragment);
        }

        if(compute != null) {
            gl.detachShader(program, compute);
            gl.deleteShader(compute);
        }

        this.program = program;
    }

    delete(): void {
        gl.deleteProgram(this.program);
    }

    use(): void {
        gl.useProgram(this.program);
    }

    unuse(): void {
        gl.useProgram(null);
    }

    getAttribLocation(attribute: string): number {
        return gl.getAttribLocation(this.program, attribute);
    }

    getUniformLocation(uniform: string): WebGLUniformLocation {
        return gl.getUniformLocation(this.program, uniform);
    }

    private shaderTypeToString(type: GLenum): string {
        switch (type) {
            case gl.VERTEX_SHADER:
                return "Vertex";
            case gl.FRAGMENT_SHADER:
                return "Fragment";
            case gl.COMPUTE_SHADER:
                return "Compute";
            default:
                return "Unknown";
        }
    }

    private createShader(type: GLenum, source: string): WebGLShader {

        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const errorLog = gl.getShaderInfoLog(shader);

        if (errorLog.length > 0) {
            // Error or Warning - We do not tolerate either

            const typeString = this.shaderTypeToString(type);

            throw new TPException(`Failed to compile ${this.name}[${typeString}]: ${errorLog}`);
        }

        return shader;
    }
}
