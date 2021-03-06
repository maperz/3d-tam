import {AppConfig} from '../application/AppConfig';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {ClearCompute} from '../shaders/compute/ClearCompute';
import {PullCompute} from '../shaders/compute/PullCompute';
import {PushCompute} from '../shaders/compute/PushCompute';
import {Texture} from './Texture';
import { GaussCompute } from '../shaders/compute/GaussCompute';
import { AppSettings } from '../application/AppSettings';

export class GradientInterpolator {

    readonly WORKGROUP_SIZE = 16;

    private isInitialized = false;

    private width: number;
    private height: number;
    private levels: number;

    private pushTextures: Texture[];
    private pullTextures: Texture[];
    private smoothedPullTextures: Texture[];

    private pushShader: Shader;
    private pullShader: Shader;
    private clearShader: Shader;
    private gaussShader: Shader;

    private numberIterationsPush: number;
    private numberIterationsPull: number;

    private pushOutputSizeLoc: WebGLUniformLocation;
    private pullInputSizeLoc: WebGLUniformLocation;
    private pullOutputSizeLoc: WebGLUniformLocation;
    private outputSizeClearShaderLoc: WebGLUniformLocation;
    
    private sizeGaussLoc: WebGLUniformLocation;

    init(width: number, height: number) {
        TPAssert(width == height, 'Width and height must be the same, different sizes are not supported yet');
        const exponent = Math.log2(width);
        TPAssert(Number.isInteger(exponent), 'Width and height need to have a basis of 2.');

        this.width = width;
        this.height = height;
        this.levels = exponent + 1;

        this.generateTextures();
        this.pushShader = createShaderFromSources(PushCompute);

        this.pushOutputSizeLoc = this.pushShader.getUniformLocation('u_outputSize');

        this.pullShader = createShaderFromSources(PullCompute);

        this.pullInputSizeLoc = this.pullShader.getUniformLocation('u_inputSize');
        this.pullOutputSizeLoc = this.pullShader.getUniformLocation('u_outputSize');

        this.clearShader  = createShaderFromSources(ClearCompute);
        this.outputSizeClearShaderLoc = this.clearShader.getUniformLocation('u_outputSize');

        this.gaussShader = createShaderFromSources(GaussCompute);
        this.sizeGaussLoc = this.gaussShader.getUniformLocation('u_size');
        

        this.isInitialized = true;
    }

    getPushTexture(iteration: number): WebGLTexture {
        TPAssert(iteration >= 0 && iteration < this.pushTextures.length, 'Iteration of push texture not in bounds!');
        return this.pushTextures[iteration].texture;
    }

    getPullTexture(iteration: number): WebGLTexture {
        TPAssert(iteration >= 0 && iteration < this.pullTextures.length, 'Iteration of pull texture not in bounds!');
        return this.pullTextures[iteration].texture;
    }

    getSmoothedPullTexture(iteration: number): WebGLTexture {
        TPAssert(iteration >= 0 && iteration < this.smoothedPullTextures.length, 'Iteration of smoothed pull texture not in bounds!');
        return this.smoothedPullTextures[iteration].texture;
    }

    getNumberIterationsPush(): number {
        return this.numberIterationsPush;
    }

    getNumberIterationsPull(): number {
        return this.numberIterationsPull;
    }

    calculateGradient(input: WebGLTexture): WebGLTexture {
        TPAssert(this.isInitialized, 'GradientInterpolator needs to be initialized before usage. Use GradientInterpolator::init.');
        this.clearAllTextureValues();
        const inputTexture = new Texture(this.width, this.height, input);
        this.doPush(inputTexture);
        const output = this.doPull(inputTexture);
        return output;
    }


    private clearAllTextureValues() {
        this.clearShader.use();

        let firstLayer = true;
        gl.uniform1f(this.clearShader.getUniformLocation('u_value'), 0.0);
        gl.uniform1f(this.clearShader.getUniformLocation('u_border_value'), 0.000000001);

        for (let texture of this.pushTextures) {

            if(firstLayer) {
                gl.uniform1i(this.clearShader.getUniformLocation('u_setborder'), 1);
                firstLayer = false;
            }
            else {
                gl.uniform1i(this.clearShader.getUniformLocation('u_setborder'), 0);
            }

            gl.uniform2i(this.outputSizeClearShaderLoc, texture.width, texture.height);
            gl.bindImageTexture(0, texture.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);
            gl.dispatchCompute(Math.ceil(texture.width / AppConfig.WORK_GROUP_SIZE), Math.ceil(texture.height / AppConfig.WORK_GROUP_SIZE), 1);
        }

        for (let texture of this.pullTextures) {
            gl.uniform2i(this.outputSizeClearShaderLoc, texture.width, texture.height);
            gl.bindImageTexture(0, texture.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);
            gl.dispatchCompute(Math.ceil(texture.width / AppConfig.WORK_GROUP_SIZE), Math.ceil(texture.height / AppConfig.WORK_GROUP_SIZE), 1);
        }

        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        this.clearShader.unuse();
    }

    private generateTextures() {

        this.pushTextures = new Array<Texture>();

        for (let iteration = 1; iteration < this.levels; iteration++) {
            const w = this.width / (2 ** iteration);
            const h = this.height / (2 ** iteration);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.pushTextures.push(new Texture(w, h, texture));
        }

        this.pullTextures = new Array<Texture>();
        this.smoothedPullTextures = new Array<Texture>();

        for (let iteration = 1; iteration < this.levels; iteration++) {
            const w = 2 ** iteration;
            const h = w;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.pullTextures.push(new Texture(w, h, texture));

            const textureSmooth = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textureSmooth);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.smoothedPullTextures.push(new Texture(w, h, textureSmooth));
        }

        // console.log(this.pushTextures);
        // console.log(this.pullTextures);

        this.numberIterationsPush = this.levels - 1;
        this.numberIterationsPull = this.levels - 1;
    }

    private doPush(startInput: Texture) {
        this.pushShader.use();

        let input = startInput;

        for (let iteration = 0; iteration < this.numberIterationsPush; iteration++) {

            const output = this.pushTextures[iteration];
            // gl.uniform2i(inputSizeLoc, input.width, input.height);
            gl.uniform2i(this.pushOutputSizeLoc, output.width, output.height);

            gl.bindImageTexture(0, input.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            const num_groups_x = Math.ceil(output.width / this.WORKGROUP_SIZE);
            const num_groups_y = Math.ceil(output.height / this.WORKGROUP_SIZE);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

            input = output;
        }

        this.pushShader.unuse();
    }

    private doPull(startInput: Texture): WebGLTexture {

        let lastPull = this.pushTextures[this.pushTextures.length - 1];

        for (let iteration = 0; iteration < this.numberIterationsPull; iteration++) {
            this.pullShader.use();

            let currentState: Texture;

            if (iteration == this.numberIterationsPull - 1) {
                currentState = startInput;
            } else {
                const pushIterationIndex = this.numberIterationsPush - iteration - 2;
                TPAssert(pushIterationIndex >= 0 && pushIterationIndex < this.pushTextures.length, `Index out of bounds: ${pushIterationIndex}`);
                currentState = this.pushTextures[pushIterationIndex];
            }

            const output = this.pullTextures[iteration];

            gl.uniform2i(this.pullInputSizeLoc, currentState.width, currentState.height);
            gl.uniform2i(this.pullOutputSizeLoc, output.width, output.height);

            // gl.bindImageTexture(0, this.input, 0, false, 0, gl.READ_ONLY, gl.RGBA8);
            gl.bindImageTexture(0, currentState.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, lastPull.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(2, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            const num_groups_x = Math.ceil(output.width / this.WORKGROUP_SIZE);
            const num_groups_y = Math.ceil(output.height / this.WORKGROUP_SIZE);
            // console.log("Iteration: " + iteration + " Size: " + output.width + "/" + output.height + " NumGroups: " + num_groups_x + "/" + num_groups_y);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

            if(!AppSettings.smoothPullStep) {
                lastPull = output;
                continue;
            }
            
            this.pullShader.unuse();

            const output_smooth = this.smoothedPullTextures[iteration];

            this.gaussShader.use();

            gl.uniform2i(this.sizeGaussLoc, currentState.width, currentState.height);

            gl.bindImageTexture(0, output.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, output_smooth.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

            this.gaussShader.unuse();

            lastPull = output_smooth;

        }
        return this.pullTextures[this.pullTextures.length - 1].texture;
    }
}
