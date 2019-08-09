import {AppConfig} from '../application/AppConfig';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {AttractionCompute} from '../shaders/compute/AttractionCompute';
import {PositionUpdateCompute} from '../shaders/compute/PositionUpdateCompute';
import {RepulsionCompute} from '../shaders/compute/RepulsionCompute';
import {DensityMapCalculator} from './DensityMapCalculator';
import {FDGBuffers} from './FDGBuffers';
import {Texture} from './Texture';

export class FDGCalculator {

    readonly NUM_SAMPLES = 200;

    initialized = false;

    attractionShader: Shader;
    repulsionShader: Shader;
    updateShader: Shader;

    densityMapCalculator: DensityMapCalculator;

    repulsionPyramidSizeLoc: WebGLUniformLocation;


    init(width: number, height: number) {
        this.attractionShader = createShaderFromSources(AttractionCompute);
        this.repulsionShader = createShaderFromSources(RepulsionCompute);
        this.updateShader = createShaderFromSources(PositionUpdateCompute);
        this.densityMapCalculator = new DensityMapCalculator();
        this.densityMapCalculator.init(width, height);


        this.repulsionPyramidSizeLoc = this.repulsionShader.getUniformLocation('u_pyramid_size');

        this.initialized = true;
    }


    private calculateAttractionForces(buffers: FDGBuffers) {
        this.attractionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.infosBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.neighboursBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.attractionBuffers);

        gl.dispatchCompute(this.NUM_SAMPLES / AppConfig.WORK_GROUP_SIZE, 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, null);

        this.attractionShader.unuse();
    }

    private calculateRepulsionForces(buffers: FDGBuffers, density: WebGLTexture, levels: number) {
        this.repulsionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.repulsionBuffers);

        gl.uniform1ui(this.repulsionPyramidSizeLoc, levels);

        //for()
        //gl.bindImageTexture(0, input.texture, 0, false, 0, gl.READ_ONLY, gl.R32F);

        gl.dispatchCompute(this.NUM_SAMPLES / AppConfig.WORK_GROUP_SIZE, 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

        this.repulsionShader.unuse();
    }

    private calculatePositionUpdates(buffers: FDGBuffers) {
        this.updateShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.attractionBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.repulsionBuffers);

        gl.dispatchCompute(this.NUM_SAMPLES / AppConfig.WORK_GROUP_SIZE, 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);

        this.updateShader.unuse();
    }

    updatePositions(buffers: FDGBuffers) {
        TPAssert(this.initialized, 'FDGCalculator needs to be initialized first before usage.');

        this.densityMapCalculator.calculateDensityMap(buffers);

        const density = this.densityMapCalculator.getDensityTexture();
        const levels = this.densityMapCalculator.getLevels();

        this.calculateAttractionForces(buffers);
        this.calculateRepulsionForces(buffers, density, levels);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
        this.calculatePositionUpdates(buffers);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
    }

    getDMC(): DensityMapCalculator {
        return this.densityMapCalculator;
    }
}
