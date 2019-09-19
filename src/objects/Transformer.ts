
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {FlattenerCompute} from '../shaders/compute/FlattenerCompute';


export class Transformer {

    private shader: Shader;
    private width: number;
    private height: number;
    private output: WebGLTexture;

    private WORKGROUP_SIZE = 16;

    init(width: number, height: number) {

        this.width = width;
        this.height = height;

        this.shader = createShaderFromSources(FlattenerCompute);

        this.output = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.output);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.width, this.height);
    }

    transform(input: WebGLTexture): WebGLTexture {
        TPAssert(this.shader != null, 'Transformer must be initialized before usage.');
        this.shader.use();
        gl.bindImageTexture(0, input, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(1, this.output, 0, false, 0, gl.WRITE_ONLY, gl.R32F);
        gl.uniform2ui(this.shader.getUniformLocation('u_outputSize'), this.width, this.height);

        const num_groups_x = Math.ceil(this.width / this.WORKGROUP_SIZE);
        const num_groups_y = Math.ceil(this.height / this.WORKGROUP_SIZE);

        gl.dispatchCompute(num_groups_x, num_groups_y, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        this.shader.unuse();
        return this.output;
    }

}
