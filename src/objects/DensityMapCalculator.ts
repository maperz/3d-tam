import {AppConfig} from '../application/AppConfig';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {ClearCompute} from '../shaders/compute/ClearCompute';
import {DensityCompute} from '../shaders/compute/DensityCompute';
import {RasterizeCompute} from '../shaders/compute/RasterizeCompute';
import {DataBuffers} from './DataBuffers';
import {Texture} from './Texture';

export class DensityMapCalculator {

    private isInitialized = false;

    private width: number;
    private height: number;

    private textures: Texture[];
    private densityShader: Shader;
    private rasterizeShader: Shader;
    private clearShader: Shader;

    private levels: number;

    private densityTexture: WebGLTexture;

    private numSamplesLoc: WebGLUniformLocation;

    private outputSizeLoc: WebGLUniformLocation;
    private outputSizeClearShaderLoc: WebGLUniformLocation;

    private pyramid: WebGLTexture;

    init(width: number, height: number) {
        TPAssert(width == height, 'Width and height must be the same, different sizes are not supported');
        const exponent = Math.log2(width);
        TPAssert(Number.isInteger(exponent), 'Width and height need to have a basis of 2.');

        this.width = width;
        this.height = height;
        this.levels = exponent + 1;

        this.generateTextures();

        this.densityShader = createShaderFromSources(DensityCompute);
        this.outputSizeLoc = this.densityShader.getUniformLocation('u_outputSize');

        this.rasterizeShader = createShaderFromSources(RasterizeCompute);
        this.numSamplesLoc = this.rasterizeShader.getUniformLocation('u_num');

        this.clearShader = createShaderFromSources(ClearCompute);
        this.outputSizeClearShaderLoc = this.clearShader.getUniformLocation('u_outputSize');

        this.isInitialized = true;
    }

    calculateDensityMap(input: DataBuffers): Texture[] {
        TPAssert(this.isInitialized, 'DensityMapCalculator needs to be initialized before usage. Use GradientInterpolator::init.');
        this.clearTextureValues();
        this.rasterizePositions(input);
        this.calculateDensities();
        return this.textures;
    }

    getTexture(index: number) {
        return this.textures[index];
    }

    private clearTextureValues() {
        this.clearShader.use();

        for (let texture of this.textures) {
            gl.uniform2i(this.outputSizeClearShaderLoc, texture.width, texture.height);
            gl.bindImageTexture(0, texture.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);
            gl.dispatchCompute(Math.ceil(texture.width / AppConfig.WORK_GROUP_SIZE), Math.ceil(texture.height / AppConfig.WORK_GROUP_SIZE), 1);
        }
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        this.clearShader.unuse();
    }

    private generateTextures() {

        this.textures = new Array<Texture>();

        for (let iteration = 0; iteration < this.levels; iteration++) {
            const w = this.width / (2 ** iteration);
            const h = this.height / (2 ** iteration);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.textures.push(new Texture(w, h, texture));
        }

        // Generate Pyramid
        this.pyramid = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.pyramid);
        gl.texStorage2D(gl.TEXTURE_2D, this.levels, gl.R32F, this.width, this.height);

        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 8);
    }

    private rasterizePositions(buffers: DataBuffers) {
        this.rasterizeShader.use();

        const output = this.textures[0];

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);

        gl.bindImageTexture(0, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        const samples = buffers.numSamples;
        gl.uniform1ui(this.rasterizeShader.getUniformLocation('u_num'), samples);

        gl.dispatchCompute(Math.ceil(samples / AppConfig.WORK_GROUP_SIZE), 1, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

        this.rasterizeShader.unuse();
    }

    private calculateDensities() {

        // Rasterize position values to texture grid;
        this.densityShader.use();

        for (let iteration = 0; iteration < this.levels - 1; iteration++) {

            const input = this.textures[iteration];
            const output = this.textures[iteration + 1];

            gl.uniform2i(this.outputSizeLoc, output.width, output.height);

            gl.bindImageTexture(0, input.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            const num_groups_x = Math.ceil(output.width / AppConfig.WORK_GROUP_SIZE);
            const num_groups_y = Math.ceil(output.height / AppConfig.WORK_GROUP_SIZE);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

            //gl.bindTexture(gl.TEXTURE_2D, this.pyramid);
            //gl.texImage2D(gl.TEXTURE_2D, iteration + 1, gl.R32F, output.width, output.height, 0, gl.R32F, gl.UNSIGNED_BYTE, )

        }

        this.densityShader.unuse();
    }

    get densityPyramid() : Texture[]{
        return this.textures;
    }


    getDensityTexture() : WebGLTexture {
        return this.densityTexture;
    }

    getLevels() : number {
        return this.levels;
    }
}
