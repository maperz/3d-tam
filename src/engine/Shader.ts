import {TPException} from './error/TPException';
import {gl} from './GLContext';

export class Shader {
    program: WebGLProgram;

    create(vertexSource: string, fragmentSource: string): void {
        const vertex = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragment = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (gl.getError() != gl.NO_ERROR) {
            gl.deleteProgram(this.program);
        }

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errorLog = gl.getProgramInfoLog(program);
            throw new TPException(`Failed to link ShaderProgram: ${errorLog}`);
        }

        gl.detachShader(program, vertex);
        gl.deleteShader(vertex);

        gl.detachShader(program, fragment);
        gl.deleteShader(fragment);

        this.program = program;
    }

    delete(): void {
        gl.deleteProgram(this.program);
    }

    use(): void {
        gl.useProgram(this.program);
    }

    getAttribLocation(attribute: string): number {
        return gl.getAttribLocation(this.program, attribute);
    }

    getUniformLocation(uniform: string): WebGLUniformLocation {
        return gl.getUniformLocation(this.program, uniform);
    }

    private createShader(type: GLenum, source: string): WebGLShader {

        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const errorLog = gl.getShaderInfoLog(shader);

        if (errorLog.length > 0) {
            // Error or Warning - We do not tolerate either

            const typeString = (type == gl.VERTEX_SHADER) ? 'Vertex' :
                (type == gl.FRAGMENT_SHADER) ? 'Fragment' : 'Unknown';

            throw new TPException(`Failed to compile shader [${typeString}]: ${errorLog}`);
        }

        return shader;
    }
}
