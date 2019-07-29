import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {PullCompute} from '../shaders/compute/PullCompute';
import {PushCompute} from '../shaders/compute/PushCompute';


export class Texture {
    constructor(public width: number, public height: number, public texture: WebGLTexture){}
}

export class GradientInterpolator {

    readonly WORKGROUP_SIZE = 16;

    private isInitialized = false;

    private width : number;
    private height: number;
    private levels: number;

    private pushTextures: Array<Texture>;
    private pullTextures: Array<Texture>;

    private pushShader: Shader;
    private pullShader: Shader;

    private numberIterationsPush: number;
    private numberIterationsPull: number;


    init(width: number, height: number) {
        TPAssert(width == height, 'Width and height must be the same, different sizes are not supported yet');
        const exponent = Math.log2(width);
        TPAssert(Number.isInteger(exponent), 'Width and height need to have a basis of 2.');

        this.width = width;
        this.height = height;
        this.levels = exponent + 1;

        this.generateTextures();
        this.pushShader = createShaderFromSources(PushCompute);
        this.pullShader = createShaderFromSources(PullCompute);

        this.isInitialized = true;
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

        for (let iteration = 1; iteration < this.levels; iteration++) {
            const w = 2 ** iteration;
            const h = w;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, w, h);
            this.pullTextures.push(new Texture(w, h, texture));
        }

        console.log(this.pushTextures);
        console.log(this.pullTextures);

        this.numberIterationsPush = this.levels - 1;
        this.numberIterationsPull = this.levels - 1;

    }


    private doPush(startInput: Texture) {
        this.pushShader.use();

        let input = startInput;
        for (let iteration = 0; iteration < this.numberIterationsPush; iteration++) {

            const output = this.pushTextures[iteration];
            gl.uniform2i(this.pushShader.getUniformLocation("u_inputSize"), input.width, input.height);
            gl.uniform2i(this.pushShader.getUniformLocation("u_outputSize"), output.width, output.height);

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
        this.pullShader.use();

        let lastPull = this.pushTextures[this.pushTextures.length - 1];

        for (let iteration = 0; iteration < this.numberIterationsPull; iteration++) {

            let currentState : Texture;

            if(iteration == this.numberIterationsPull - 1) {
                currentState = startInput;
            }
            else {
                let pushIterationIndex = this.numberIterationsPush - iteration - 2;
                TPAssert(pushIterationIndex >= 0 && pushIterationIndex < this.pushTextures.length, `Index out of bounds: ${pushIterationIndex}`);
                currentState = this.pushTextures[pushIterationIndex];
            }

            const output = this.pullTextures[iteration];

            gl.uniform2i(this.pullShader.getUniformLocation("u_currentSize"), currentState.width, currentState.height);
            gl.uniform2i(this.pullShader.getUniformLocation("u_outputSize"), output.width, output.height);

            // gl.bindImageTexture(0, this.input, 0, false, 0, gl.READ_ONLY, gl.RGBA8);
            gl.bindImageTexture(0, currentState.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(1, lastPull.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);
            gl.bindImageTexture(2, output.texture, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

            const num_groups_x = Math.ceil(output.width / this.WORKGROUP_SIZE);
            const num_groups_y = Math.ceil(output.height / this.WORKGROUP_SIZE);
            //console.log("Iteration: " + iteration + " Size: " + output.width + "/" + output.height + " NumGroups: " + num_groups_x + "/" + num_groups_y);

            gl.dispatchCompute(num_groups_x, num_groups_y, 1);
            gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

            lastPull = output;
        }
        this.pullShader.unuse();
        return this.pullTextures[this.pullTextures.length - 1].texture;
    }


    getPushTexture(iteration: number): WebGLTexture {
        TPAssert(iteration >= 0 && iteration < this.pushTextures.length, 'Iteration of push texture not in bounds!');
        return this.pushTextures[iteration].texture;
    }

    getPullTexture(iteration: number): WebGLTexture {
        TPAssert(iteration >= 0 && iteration < this.pullTextures.length, 'Iteration of pull texture not in bounds!');
        return this.pullTextures[iteration].texture;
    }

    getNumberIterationsPush(): number {
        return this.numberIterationsPush;
    }

    getNumberIterationsPull(): number {
        return this.numberIterationsPull;
    }

    calculateGradient(input: WebGLTexture): WebGLTexture {
        TPAssert(this.isInitialized, 'GradientInterpolator needs to be initialized before usage. Use GradientInterpolator::init.');
        let inputTexture = new Texture(this.width, this.height, input);
        this.doPush(inputTexture);
        const output = this.doPull(inputTexture);
        return output;
    }
}
