import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {NormalsCalculatorCompute} from '../shaders/compute/NormalsCalculatorCompute';

export class NormalsCalculator {

    readonly WORKGROUP_SIZE = 16;

    tilesX: number;
    tilesY: number;

    pixelsX: number;
    pixelsY: number;

    tileWidth: number;
    tileHeight: number;

    shader: Shader;

    normals: WebGLBuffer;


    init(tilesX: number, tilesY: number, pixelsX: number, pixelsY: number, tileWidth: number, tileHeight: number) {
        this.tilesX = tilesX;
        this.tilesY = tilesY;

        this.pixelsX = pixelsX;
        this.pixelsY = pixelsY;

        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        this.shader = createShaderFromSources(NormalsCalculatorCompute);

        this.createBuffer();
    }

    private createBuffer() {
        const buffer = gl.createBuffer();

        const count = this.tilesX * this.tilesY * 3;
        const data = new Float64Array(new Array(count).fill(0));

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, data, gl.STATIC_COPY);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

        this.normals = buffer;
    }

    calculateNormals(heightmap: WebGLTexture, height: number) {
        TPAssert(this.shader != null, 'NormalsCalculator must be initialized before usage!');
        TPAssert(this.normals != null, 'NormalsCalculator must be initialized before usage!');

        this.shader.use();

        gl.bindImageTexture(0, heightmap, 0, false, 0, gl.READ_ONLY, gl.R32F);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.normals);

        gl.uniform2ui(this.shader.getUniformLocation('u_size'), this.tilesX, this.tilesY);
        gl.uniform2ui(this.shader.getUniformLocation('u_pixels'), this.pixelsX, this.pixelsY);
        gl.uniform2f(this.shader.getUniformLocation('u_tileSize'), this.tileWidth, this.tileHeight);

        gl.uniform1f(this.shader.getUniformLocation('u_height'), height);

        const num_groups_x = Math.ceil(this.tilesX / this.WORKGROUP_SIZE);
        const num_groups_y = Math.ceil(this.tilesY / this.WORKGROUP_SIZE);

        gl.dispatchCompute(num_groups_x, num_groups_y, 1);

        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

        this.shader.unuse();
    }

    getNormalsBuffer(): WebGLBuffer {
        return this.normals;
    }

}
