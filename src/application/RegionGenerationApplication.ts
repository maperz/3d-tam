import {vec2} from 'gl-matrix';
import {WebGLApplication} from '../engine/application/WebGLApplication';
import {canvas, gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {DilationShader} from '../shaders/DilationShader';
import {TextureRenderer} from '../texture/TextureRenderer';

export class RegionGenerationApplication extends WebGLApplication {

    readonly WIDTH = 500;
    readonly HEIGHT = 500;
    readonly CHANNELS = 3;

    input: WebGLTexture;
    shader: Shader;

    renderTarget: WebGLFramebuffer;
    renderTexture: WebGLTexture;

    textureRenderer: TextureRenderer;

    start(): void {
        super.start({antialias : false});
    }

    onStart(): void {
        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;
        gl.viewport(0, 0, this.WIDTH, this.HEIGHT);
        this.input = this.generateRandomImage(15);

        this.shader = createShaderFromSources(DilationShader);

        //this.createFramebufferObjects();

        this.textureRenderer = new TextureRenderer();
        this.textureRenderer.init();
    }


    renderToFrameBuffer(): void {
        this.shader.use();
        gl.bindTexture(gl.TEXTURE_2D, this.input);

        const viewportLocation = this.shader.getUniformLocation('u_viewport');
        gl.uniform2f(viewportLocation, this.WIDTH, this.HEIGHT);

        const inputLocation = this.shader.getUniformLocation('inputData');
        gl.activeTexture(gl.TEXTURE20);
        gl.uniform1i(inputLocation, 0);

    }

    renderToScreen(texture: WebGLTexture): void {

        this.shader.use();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const viewportLocation = this.shader.getUniformLocation('u_viewport');
        gl.uniform2f(viewportLocation, this.WIDTH, this.HEIGHT);

        const inputLocation = this.shader.getUniformLocation('inputData');
        gl.activeTexture(gl.TEXTURE20);
        gl.uniform1i(inputLocation, 0);

        this.bindRenderTarget(null, this.WIDTH, this.HEIGHT);
    }

    onUpdate(deltaTime: number): void {
        /*this.renderToFrameBuffer();

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.renderTarget);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.blitFramebuffer(0, 0,
            this.WIDTH, this.HEIGHT,
            0, 0,
            this.WIDTH, this.HEIGHT,
            gl.COLOR_BUFFER_BIT, gl.NEAREST);

        // this.renderToScreen(this.renderTexture);
         */
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.textureRenderer.renderTexture(this.input, vec2.fromValues(0, 0), vec2.fromValues(canvas.width, canvas.height));
    }

    private createFramebufferObjects() {
        this.renderTarget = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget);

        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.WIDTH, this.HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTexture, 0);

        TPAssert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
            'Framebuffer could not be created');
    }

    private bindRenderTarget(fbo: WebGLFramebuffer, width: number = null, height: number = null) {
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbo);
        gl.viewport(0, 0, width, height);
    }

    private generateRandomImage(samples: number): WebGLTexture {
        const data = new Array<number>();

        for (let x = 0; x < this.WIDTH * this.HEIGHT * this.CHANNELS; ++x) {
            data[x] = 0.0;
        }

        for (let x = 0; x < samples; ++x) {
            const pos = vec2.fromValues(Math.random(), Math.random());
            const r = 255 * Math.random();
            const g = 255 * Math.random();
            const b = 255 * Math.random();

            vec2.floor(pos, vec2.mul(pos, pos, vec2.fromValues(this.WIDTH, this.HEIGHT)));
            const index = this.CHANNELS * (pos[0] + pos[1] * this.WIDTH);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
        }

        const pixels = new Uint8Array(data);

        const texture = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.WIDTH, this.HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }
}
