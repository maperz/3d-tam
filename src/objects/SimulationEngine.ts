import {AppConfig} from '../application/AppConfig';
import {AppSettings} from '../application/AppSettings';
import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {AttractionCompute} from '../shaders/compute/AttractionCompute';
import {PositionUpdateCompute} from '../shaders/compute/PositionUpdateCompute';
import {RepulsionCompute} from '../shaders/compute/RepulsionCompute';
import {DensityMapCalculator} from './DensityMapCalculator';
import {DataBuffers} from './DataBuffers';
import {Texture} from './Texture';
import { vec2 } from 'gl-matrix';

export class SimulationEngine {

    width: number;
    height: number;

    initialized = false;

    attractionShader: Shader;
    repulsionShader: Shader;
    updateShader: Shader;

    densityMapCalculator: DensityMapCalculator;

    attractionStiffnessLoc: WebGLUniformLocation;
    attractionLengthLoc: WebGLUniformLocation;
    attractionShaderNumSamplesLoc: WebGLUniformLocation;

    repulsionPyramidSizeLoc: WebGLUniformLocation;
    repulsionDimensionLoc: WebGLUniformLocation;
    repulsionShaderNumSamplesLoc: WebGLUniformLocation;

    updateShaderNumSamplesLoc: WebGLUniformLocation;

    selectedIdLoc: WebGLUniformLocation;
    dragForceLoc: WebGLUniformLocation;


    init(width: number, height: number) {

        this.width = width;
        this.height = height;

        this.attractionShader = createShaderFromSources(AttractionCompute);
        this.repulsionShader = createShaderFromSources(RepulsionCompute);
        this.updateShader = createShaderFromSources(PositionUpdateCompute);
        this.densityMapCalculator = new DensityMapCalculator();
        this.densityMapCalculator.init(width, height);

        this.attractionStiffnessLoc = this.attractionShader.getUniformLocation('u_stiffness');
        this.attractionLengthLoc = this.attractionShader.getUniformLocation('u_length');
        this.attractionShaderNumSamplesLoc = this.attractionShader.getUniformLocation('u_numSamples');

        this.repulsionPyramidSizeLoc = this.repulsionShader.getUniformLocation('u_pyramid_size');
        this.repulsionDimensionLoc = this.repulsionShader.getUniformLocation('u_dimension');
        this.repulsionShaderNumSamplesLoc = this.repulsionShader.getUniformLocation('u_numSamples');

        this.selectedIdLoc = this.updateShader.getUniformLocation('u_selectedId');
        this.dragForceLoc = this.updateShader.getUniformLocation('u_f_drag');
        this.updateShaderNumSamplesLoc = this.updateShader.getUniformLocation('u_numSamples');

        this.initialized = true;
    }

    private calculateAttractionForces(buffers: DataBuffers) {
        this.attractionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.infosBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.neighboursBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.attractionBuffers);

        gl.uniform1f(this.attractionStiffnessLoc, AppSettings.attraction_stiffness);
        gl.uniform1f(this.attractionLengthLoc, AppSettings.attraction_length);
        gl.uniform1ui(this.attractionShaderNumSamplesLoc, buffers.numSamples);

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, null);

        this.attractionShader.unuse();
    }

    private calculateRepulsionForces(buffers: DataBuffers, pyramid: Texture[], levels: number) {
        this.repulsionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.repulsionBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.infosBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.neighboursBuffer);

        gl.uniform1ui(this.repulsionPyramidSizeLoc, levels);
        gl.uniform1i(this.repulsionShader.getUniformLocation('u_totalCount'), buffers.numSamples);
        gl.uniform1f(this.repulsionShader.getUniformLocation('u_repulsionForce'), AppSettings.repulsionForce);
        gl.uniform1ui(this.repulsionShaderNumSamplesLoc, buffers.numSamples);

        gl.uniform2f(this.repulsionDimensionLoc, this.width, this.height);

        for(let l = 0; l < levels; l++)
        {
            gl.bindImageTexture(0, pyramid[l].texture, 0, false, l, gl.READ_ONLY, gl.R32F);
        }

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, null);


        this.repulsionShader.unuse();
    }

    private calculatePositionUpdates(buffers: DataBuffers, selected?: number, dragForce?: vec2) {
        this.updateShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.attractionBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.repulsionBuffers);


        gl.uniform2f(this.updateShader.getUniformLocation('u_gravity'), AppSettings.gravity_x, AppSettings.gravity_y);
        gl.uniform2f(this.updateShader.getUniformLocation('u_center'), this.width / 2, this.height / 2);
        gl.uniform1ui(this.updateShaderNumSamplesLoc, buffers.numSamples);

        let selectedId = -1;
        let force = vec2.fromValues(0, 0);
        if(selected && dragForce) {
            selectedId = selected;
            force = dragForce;
        }
        gl.uniform1i(this.selectedIdLoc, selectedId);
        gl.uniform2f(this.dragForceLoc, force[0], force[1]);

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);

        this.updateShader.unuse();
    }

    updatePositions(buffers: DataBuffers, selected?: number, dragForce?: vec2) {
        TPAssert(this.initialized, 'FDGCalculator needs to be initialized first before usage.');

        const pyramid = this.densityMapCalculator.calculateDensityMap(buffers);
        //const density = this.densityMapCalculator.getDensityTexture();
        const levels = this.densityMapCalculator.getLevels();


        this.calculateAttractionForces(buffers);
        this.calculateRepulsionForces(buffers, pyramid, levels);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
        this.calculatePositionUpdates(buffers, selected, dragForce);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
    }

    getDMC(): DensityMapCalculator {
        return this.densityMapCalculator;
    }
}
