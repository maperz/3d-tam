import {AppConfig} from '../application/AppConfig';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {DilationCompute} from '../shaders/compute/DilationCompute';

export class Dilator {

    private width: number;
    private height: number;
    private output: WebGLTexture;
    private dilationShader: Shader;
    private radius: number;

    private initialized = false;

    init(width: number, height: number, radius: number) {
        this.radius = radius;
        this.width = width;
        this.height = height;

        this.output = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.output);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.width, this.height);
        gl.bindImageTexture(0, this.output, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        this.dilationShader = createShaderFromSources(DilationCompute);
        this.initialized = true;
    }

    dilate(input: WebGLBuffer): WebGLTexture {

        TPAssert(this.initialized, 'Dilator needs to be initialized before usage.');

        this.dilationShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, input);
        gl.bindImageTexture(0, this.output, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        gl.uniform1i(this.dilationShader.getUniformLocation('u_size'), this.radius);
        gl.uniform2ui(this.dilationShader.getUniformLocation('u_inputSize'), this.width, this.height);

        gl.dispatchCompute(this.width / AppConfig.WORK_GROUP_SIZE, this.height / AppConfig.WORK_GROUP_SIZE, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        this.dilationShader.unuse();
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

        return this.output;
    }
}
