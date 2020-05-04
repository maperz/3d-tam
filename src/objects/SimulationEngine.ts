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
import { vec2 } from 'gl-matrix';
import { BoundaryCompute } from '../shaders/compute/BoundaryCompute';
import { FamilyForceCompute } from '../shaders/compute/FamilyForceCompute';

export class SimulationEngine {

    width: number;
    height: number;

    initialized = false;

    attractionShader: Shader;
    repulsionShader: Shader;
    updateShader: Shader;
    boundaryShader: Shader;
    familyForceShader: Shader;

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
    tick : number;


    private boundaries = new Float32Array(4);

    private boundaryTimeStamp = 0;
    private boundaryBuffers = [];
    private roundsBoundary : number;

    init(width: number, height: number) {

        this.width = width;
        this.height = height;
        this.tick = 0;

        this.attractionShader = createShaderFromSources(AttractionCompute);
        this.repulsionShader = createShaderFromSources(RepulsionCompute);
        this.updateShader = createShaderFromSources(PositionUpdateCompute);
        //this.densityMapCalculator = new DensityMapCalculator();
        //this.densityMapCalculator.init(width, height);

        this.attractionStiffnessLoc = this.attractionShader.getUniformLocation('u_stiffness');
        this.attractionLengthLoc = this.attractionShader.getUniformLocation('u_length');
        this.attractionShaderNumSamplesLoc = this.attractionShader.getUniformLocation('u_numSamples');

        this.repulsionPyramidSizeLoc = this.repulsionShader.getUniformLocation('u_pyramid_size');
        this.repulsionDimensionLoc = this.repulsionShader.getUniformLocation('u_dimension');
        this.repulsionShaderNumSamplesLoc = this.repulsionShader.getUniformLocation('u_numSamples');

        this.selectedIdLoc = this.updateShader.getUniformLocation('u_selectedId');
        this.dragForceLoc = this.updateShader.getUniformLocation('u_f_drag');
        this.updateShaderNumSamplesLoc = this.updateShader.getUniformLocation('u_numSamples');

        this.boundaryShader = createShaderFromSources(BoundaryCompute);
        this.boundaryBuffers = null;

        this.familyForceShader = createShaderFromSources(FamilyForceCompute);

        this.initialized = true;
    }

    private calculateAttractionForces(buffers: DataBuffers) {
        this.attractionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.infosBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.neighboursBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.attractionBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, buffers.familyInfoBuffer);

        gl.uniform1f(this.attractionStiffnessLoc, AppSettings.attraction_stiffness);
        gl.uniform1f(this.attractionLengthLoc, AppSettings.attraction_length);
        gl.uniform1ui(this.attractionShaderNumSamplesLoc, buffers.numSamples);

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, null);

        this.attractionShader.unuse();
    }

    private calculateRepulsionForces(buffers: DataBuffers) {
        this.repulsionShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.repulsionBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.infosBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.neighboursBuffer);
1
        gl.uniform1ui (this.repulsionShader.getUniformLocation('u_maxCalculation'), 600);
        gl.uniform1ui(this.repulsionShader.getUniformLocation('u_tick'), this.tick);
        gl.uniform1f(this.repulsionShader.getUniformLocation('u_repulsionForce'), AppSettings.repulsionForce);
        gl.uniform1ui(this.repulsionShaderNumSamplesLoc, buffers.numSamples);

        gl.uniform2f(this.repulsionDimensionLoc, this.width, this.height);

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
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, buffers.familyForceBuffers);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, buffers.position3dBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 5, buffers.valuesBuffer);

        gl.uniform2f(this.updateShader.getUniformLocation('u_gravity'), AppSettings.gravity_x, AppSettings.gravity_y);
        gl.uniform2f(this.updateShader.getUniformLocation('u_center'), 0, 0);
        gl.uniform1ui(this.updateShaderNumSamplesLoc, buffers.numSamples);
        gl.uniform2f(this.updateShader.getUniformLocation('u_dimension'), this.width, this.height);

        let selectedId = -1;
        let force = vec2.fromValues(0, 0);
        if(selected != null && dragForce != null) {
            selectedId = selected;
            force = dragForce;
        }
        gl.uniform1i(this.selectedIdLoc, selectedId);
        gl.uniform2f(this.dragForceLoc, force[0], force[1]);

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 5, null);

        this.updateShader.unuse();
    }

    private calculateFamilyForces(buffers: DataBuffers) {
        this.familyForceShader.use();

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.familyInfoBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, buffers.familyForceBuffers);

        gl.uniform1ui(this.familyForceShader.getUniformLocation("u_numSamples"), buffers.numSamples);

        gl.dispatchCompute(Math.ceil(buffers.numSamples / AppConfig.WORK_GROUP_SIZE), 1, 1);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, null);
        this.familyForceShader.unuse();
    }

    private initBoundaryBuffers(buffers: DataBuffers) {

        this.boundaryBuffers = [];

        const positionBufferSize = buffers.numSamples;
        this.roundsBoundary = Math.ceil(Math.log(buffers.count) / Math.log(16));
        this.boundaryBuffers[0] = { buffer : buffers.positionBuffer, size : positionBufferSize };

        const boxedTotalValues = positionBufferSize % 16 == 0 ? positionBufferSize : positionBufferSize + (16 - (positionBufferSize) % 16)

        for (let round = 1; round <= this.roundsBoundary; round++) {
            let buffer = gl.createBuffer();
            let numValues = Math.ceil(boxedTotalValues / Math.pow(16, round));
            let data = new Float32Array(numValues * 4);
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
            gl.bufferData(gl.SHADER_STORAGE_BUFFER, data, gl.STATIC_COPY);
            this.boundaryBuffers[round] =  { buffer : buffer, size : numValues};
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
        }
    }

    private calculateBoundaries(buffers: DataBuffers) {
        if (this.boundaryBuffers == null) {
            this.initBoundaryBuffers(buffers);
        } 

        this.boundaryTimeStamp = this.tick;
    
        this.boundaryShader.use();
        for (let round = 0; round < (this.boundaryBuffers.length - 1); round++) {
            let inputBuffer = this.boundaryBuffers[round];
            let outputBuffer = this.boundaryBuffers[round + 1];
            gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, inputBuffer.buffer);
            gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, outputBuffer.buffer);

            gl.uniform1ui(this.boundaryShader.getUniformLocation("u_numHigher"), inputBuffer.size);
            gl.uniform1ui(this.boundaryShader.getUniformLocation("u_numLower"), outputBuffer.size);
            
            const iterations = outputBuffer.size;
            gl.dispatchCompute(iterations, 1, 1);

            gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
        }

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
        this.boundaryShader.unuse();

        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.boundaryBuffers[this.boundaryBuffers.length-1].buffer);
        gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, this.boundaries);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);

    }

    getBoundaries(buffers: DataBuffers) {
        if (this.boundaryTimeStamp != this.tick && buffers != null) {
            this.calculateBoundaries(buffers);
        }
        return this.boundaries;
    }

    updatePositions(buffers: DataBuffers, selected?: number, dragForce?: vec2) {
        TPAssert(this.initialized, 'FDGCalculator needs to be initialized first before usage.');

        //const pyramid = this.densityMapCalculator.calculateDensityMap(buffers);
        //const density = this.densityMapCalculator.getDensityTexture();
        //const levels = this.densityMapCalculator.getLevels();

        this.calculateAttractionForces(buffers);
        this.calculateRepulsionForces(buffers);
        this.calculateFamilyForces(buffers);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
        this.calculatePositionUpdates(buffers, selected, dragForce);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);

        this.tick++;
    }

    getDMC(): DensityMapCalculator {
        return this.densityMapCalculator;
    }
}
