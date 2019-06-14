import {GUI} from 'dat.gui';
import {mat4, vec2} from 'gl-matrix';
import {ComputeGLApplication} from '../engine/application/ComputeGLApplication';
import {canvas, gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {HeightMapRenderer} from '../engine/HeightMapRenderer';
import {Mat4} from '../engine/math/mat4';
import {inRadians} from '../engine/math/Utils';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {DilationCompute} from '../shaders/compute/DilationCompute';
import {PullCompute} from '../shaders/compute/PullCompute';
import {PushCompute} from '../shaders/compute/PushCompute';
import {TextureRenderer} from '../texture/TextureRenderer';

enum RenderMode {
    ShowDilate = "Show Dilate",
    ShowPush = "Show Push",
    ShowPull = "Show Pull",
    Show3D = "Show 3D",
}

export class ComputeApplication extends ComputeGLApplication {

    readonly WIDTH = 512;
    readonly HEIGHT = 512;
    readonly NUMBER_ITERATIONS_PUSH = 8;

    dilationShader: Shader;
    textureRenderer: TextureRenderer;

    dilateOut: WebGLTexture;
    pushOutputs: Array<WebGLTexture>;
    pullOutputs: Array<WebGLTexture>;

    frameBuffer: WebGLFramebuffer;

    modelRotationY: number = 0;

    heightMapRenderer: HeightMapRenderer;
    perspective: Mat4;


    private settings = {
        pushIteration: 1,
        pullIteration: 1,
        mode : RenderMode.Show3D,
    };

    start(): void {
        super.start({antialias : false});
    }

    onStart(): void {

        let ext = gl.getExtension("EXT_color_buffer_float");
        TPAssert(ext != null, "Cannot render to floating point FBOs!");


        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;
        gl.viewport(0, 0, this.WIDTH, this.HEIGHT);

        //this.input = this.generateRandomImage(10);

        this.textureRenderer = new TextureRenderer();
        this.textureRenderer.init();

        const input = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, input);

        const values = this.generateRandomInput(100);

        gl.bufferData(gl.SHADER_STORAGE_BUFFER, values, gl.DYNAMIC_COPY);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, input);

        //
        // Dilation
        //

        // create texture for ComputeShader write to
        const outputDilation = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, outputDilation);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.WIDTH, this.HEIGHT);
        gl.bindImageTexture(0, outputDilation, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        this.dilationShader = createShaderFromSources(DilationCompute);
        this.dilationShader.use();
        //gl.bindImageTexture(0, this.input, 0, false, 0, gl.READ_ONLY, gl.RGBA8);
        gl.bindImageTexture(1, outputDilation, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        gl.uniform1i(this.dilationShader.getUniformLocation("u_size"), 2);

        gl.dispatchCompute(this.WIDTH / 16, this.HEIGHT / 16, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        this.dilationShader.unuse();
        this.dilateOut = outputDilation;

        //
        // Push
        //

        const pushShader = createShaderFromSources(PushCompute);

        this.pushOutputs = new Array<WebGLTexture>();

        let lastPush = outputDilation;
        for(let iteration = 1; iteration <= this.NUMBER_ITERATIONS_PUSH; iteration++) {

            const output = this.doPushOperation(lastPush, pushShader, iteration);
            lastPush = output;
            this.pushOutputs.push(output);
        }

        //
        // Pull
        //

        const pullShader = createShaderFromSources(PullCompute);

        this.pullOutputs = new Array<WebGLTexture>();

        let inputToPull = lastPush;
        for(let iteration = this.NUMBER_ITERATIONS_PUSH - 1; iteration >= 1; iteration--) {
            const currentState = this.pushOutputs[iteration - 1];
            const output = this.doPullOperation(inputToPull, currentState, pullShader, iteration);
            inputToPull = output;
            this.pullOutputs.push(output);
        }

        this.pullOutputs.reverse();

        // create frameBuffer to read from texture
        this.frameBuffer = gl.createFramebuffer();

        this.initGUI();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        this.heightMapRenderer = new HeightMapRenderer();
        this.heightMapRenderer.init(10, 10, 512, 512);

        const aspect = canvas.width / canvas.height;
        this.perspective = Mat4.perspective(70, aspect, 0.1, 30);
    }


    doPushOperation(input: WebGLTexture, pushShader: Shader, iteration: number): WebGLTexture {
        const fraction = 2 ** iteration;

        const output = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, output);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.WIDTH / fraction, this.HEIGHT / fraction);

        pushShader.use();
        //gl.bindImageTexture(0, this.input, 0, false, 0, gl.READ_ONLY, gl.RGBA8);
        gl.bindImageTexture(0, input, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(1, output, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        gl.dispatchCompute(this.WIDTH / 2 / fraction, this.HEIGHT / 2 / fraction, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        pushShader.unuse();

        return output;
    }


    doPullOperation(lastPull: WebGLTexture, currentState: WebGLTexture, pullShader: Shader, iteration: number): WebGLTexture {

        const fraction = 2 ** (iteration - 1);

        const output = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, output);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.WIDTH / fraction, this.HEIGHT / fraction);

        pullShader.use();
        //gl.bindImageTexture(0, this.input, 0, false, 0, gl.READ_ONLY, gl.RGBA8);
        gl.bindImageTexture(0, currentState, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(1, lastPull, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindImageTexture(2, output, 0, false, 0, gl.WRITE_ONLY, gl.R32F);

        gl.dispatchCompute(this.WIDTH / 2 / fraction, this.HEIGHT / 2 / fraction, 1);
        gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
        pullShader.unuse();

        return output;
    }

    initGUI(): void {
        const gui: GUI = new GUI({width: 300});

        gui.remember(this.settings);
        let iterations = []
        for(let iteration = 1; iteration <= this.NUMBER_ITERATIONS_PUSH; iteration++) {
            iterations.push(iteration);
        }
        gui.add(this.settings, 'pushIteration', iterations);

        iterations.splice(-1,1)
        gui.add(this.settings, 'pullIteration', iterations);
        gui.add(this.settings, 'mode', [
            RenderMode.ShowDilate,
            RenderMode.ShowPush,
            RenderMode.ShowPull,
            RenderMode.Show3D]);
    }

    onUpdate(deltaTime: number): void {

        switch (this.settings.mode) {
            case RenderMode.ShowPush: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

                const iteration = this.settings.pushIteration;
                const index =  iteration - 1;
                const output = this.pushOutputs[index];
                const fraction = 2 ** iteration;

                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
                gl.blitFramebuffer(
                    0, 0, this.WIDTH / fraction, this.HEIGHT / fraction,
                    0, 0, this.WIDTH, this.HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
                break;
            }

            case RenderMode.ShowPull: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

                const iteration = this.settings.pullIteration;
                const index =  iteration - 1;
                const output = this.pullOutputs[index];
                const fraction = 2 ** iteration;

                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
                gl.blitFramebuffer(
                    0, 0, this.WIDTH / fraction, this.HEIGHT / fraction,
                    0, 0, this.WIDTH, this.HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);

                break;
            }

            case RenderMode.ShowDilate: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dilateOut, 0);
                gl.blitFramebuffer(
                    0, 0, this.WIDTH, this.HEIGHT,
                    0, 0, this.WIDTH, this.HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
                break;
            }

            case RenderMode.Show3D: {

                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.clearDepth(1.0);

                this.modelRotationY += 5 * deltaTime;

                const model = Mat4.multiply(
                    Mat4.rotationY(inRadians(this.modelRotationY)),
                    Mat4.rotationX(inRadians(-30))
                    //Mat4.rotationX(inRadians(  Math.sin(deltaTime / 10) * 15 - 15))
                );
                const view = Mat4.translate(0, 0, -15);
                this.heightMapRenderer.drawWireFrame(this.pullOutputs[0], deltaTime, model, view, this.perspective);
            }

        }

    }

    private generateRandomInput(samples: number): Float32Array {
        const data = new Float32Array(this.WIDTH * this.HEIGHT);

        for (let x = 0; x < samples; ++x) {
            const pos = vec2.fromValues(Math.random(), Math.random());
            vec2.floor(pos, vec2.mul(pos, pos, vec2.fromValues(this.WIDTH, this.HEIGHT)));
            const index = pos[0] + pos[1] * this.WIDTH;

            const value = Math.random();
            data[index] = value;
        }

        return data;
    }

}
