import { AppConfig } from "../application/AppConfig";
import { gl } from "../engine/Context";
import { TPAssert } from "../engine/error/TPException";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { DataBuffers } from "./DataBuffers";
import { DensityBuffer } from "./DensityBuffer";
import { DensityBufferCompute } from "../shaders/compute/DensityBufferComput";
import { RasterizeBufferCompute } from "../shaders/compute/RasterizeBufferCompute";
import { ClearBufferCompute } from "../shaders/compute/ClearBufferCompute";

export class DensityBufferCalculator {
  private isInitialized = false;

  private width: number;
  private height: number;

  private densityBuffer: DensityBuffer;

  private clearShader: Shader;
  private densityShader: Shader;
  private rasterizeShader: Shader;

  private levels: number;

  private pyramid: WebGLTexture;

  init(width: number, height: number) {
    TPAssert(
      width == height,
      "Width and height must be the same, different sizes are not supported"
    );
    const exponent = Math.log2(width);
    TPAssert(
      Number.isInteger(exponent),
      "Width and height need to have a basis of 2."
    );

    this.width = width;
    this.height = height;
    this.levels = exponent + 1;

    this.densityBuffer = new DensityBuffer(width, height);

    this.densityShader = createShaderFromSources(DensityBufferCompute);
    this.rasterizeShader = createShaderFromSources(RasterizeBufferCompute);
    this.clearShader = createShaderFromSources(ClearBufferCompute);

    this.isInitialized = true;
  }

  calculateDensityBuffer(input: DataBuffers): WebGLBuffer {
    TPAssert(
      this.isInitialized,
      "DensityMapCalculator needs to be initialized before usage. Use GradientInterpolator::init."
    );

    this.clearDensity();
    this.rasterizePositions(input);
    this.calculateDensities();
    return this.densityBuffer.buffer;
  }

  private clearDensity() {
    this.clearShader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.densityBuffer.buffer);
    gl.uniform2i(
      this.clearShader.getUniformLocation("u_outputSize"),
      this.width,
      this.height
    );

    gl.dispatchCompute(
      Math.ceil(this.width / AppConfig.WORK_GROUP_SIZE),
      Math.ceil(this.height / AppConfig.WORK_GROUP_SIZE),
      1
    );
    gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

    this.clearShader.unuse();
  }

  private rasterizePositions(buffers: DataBuffers) {
    this.rasterizeShader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this.densityBuffer.buffer);

    const samples = buffers.numSamples;
    gl.uniform1ui(this.rasterizeShader.getUniformLocation("u_num"), samples);

    gl.uniform1i(
      this.rasterizeShader.getUniformLocation("u_width"),
      this.width
    );

    gl.dispatchCompute(Math.ceil(samples / AppConfig.WORK_GROUP_SIZE), 1, 1);
    gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

    this.rasterizeShader.unuse();
  }

  private calculateDensities() {
    // Rasterize position values to texture grid;
    this.densityShader.use();
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.densityBuffer.buffer);

    let lastOutOffset = 0;

    for (let iteration = 0; iteration < this.levels - 1; iteration++) {
      const inputWidth = this.width / 2 ** iteration;
      const outputWidth = inputWidth / 2;
      const inputOffset = lastOutOffset;
      const outputOffset = inputOffset + inputWidth * inputWidth;

      lastOutOffset = outputOffset;

      gl.uniform1i(
        this.densityShader.getUniformLocation("u_inputOffset"),
        inputOffset
      );
      gl.uniform1i(
        this.densityShader.getUniformLocation("u_outputOffset"),
        outputOffset
      );
      gl.uniform1i(
        this.densityShader.getUniformLocation("u_inputWidth"),
        inputWidth
      );
      gl.uniform1i(
        this.densityShader.getUniformLocation("u_outputWidth"),
        outputWidth
      );

      gl.dispatchCompute(
        Math.ceil(outputWidth / AppConfig.WORK_GROUP_SIZE),
        Math.ceil(outputWidth / AppConfig.WORK_GROUP_SIZE),
        1
      );

      gl.memoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT);
    }

    this.densityShader.unuse();
  }

  getLevels(): number {
    return this.levels;
  }
}
