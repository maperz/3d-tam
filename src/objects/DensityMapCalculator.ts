import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {DensityCompute} from '../shaders/compute/DensityCompute';
import {PullCompute} from '../shaders/compute/PullCompute';
import {PushCompute} from '../shaders/compute/PushCompute';
import {Texture} from './Texture';



export class DensityMapCalculator {

    readonly WORKGROUP_SIZE = 16;

    private isInitialized = false;

    private width : number;
    private height: number;

    private textures: Array<Texture>;
    private densityShader: Shader;
    private levels: number;

    init(width: number, height: number) {
        TPAssert(width == height, 'Width and height must be the same, different sizes are not supported');
        const exponent = Math.log2(width);
        TPAssert(Number.isInteger(exponent), 'Width and height need to have a basis of 2.');

        this.width = width;
        this.height = height;
        this.levels = exponent + 1;

        this.generateTextures();
        this.densityShader = createShaderFromSources(DensityCompute);

        this.isInitialized = true;
    }

    private generateTextures() {

        this.textures = new Array<Texture>();

        // Texture is null since it will be passed at runtime
        const startTexture = new Texture(this.width, this.height, null);
        this.textures.push(startTexture)

        for (let iteration = 1; iteration < this.levels; iteration++) {
            const w = this.width / (2 ** iteration);
            const h = this.height / (2 ** iteration);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.textures.push(new Texture(w, h, texture));
        }
    }


    private calculateDensities(start: WebGLTexture) {
        this.textures[0].texture = start;

        this.densityShader.use();
        const inputSizeLoc = this.densityShader.getUniformLocation("u_inputSize");
        const outputSizeLoc = this.densityShader.getUniformLocation("u_outputSize");

        for (let iteration = 0; iteration < this.levels - 1; iteration++) {

            const input = this.textures[iteration];
            const output = this.textures[iteration + 1];

            gl.uniform2i(inputSizeLoc, input.width, input.height);
            gl.uniform2i(outputSizeLoc, output.width, output.height);

            gl.bindImageTexture(0, input.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            const num_groups_x = Math.ceil(output.width / this.WORKGROUP_SIZE);
            const num_groups_y = Math.ceil(output.height / this.WORKGROUP_SIZE);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        }

        this.densityShader.unuse();
    }


    calculateDensityMap(input: WebGLTexture): Array<Texture> {
        TPAssert(this.isInitialized, 'DensityMapCalculator needs to be initialized before usage. Use GradientInterpolator::init.');
        this.calculateDensities(input);
        return this.textures;
    }

    getTexture(index: number) {
        return this.textures[index];
    }
}
