import { gl } from "../engine/Context";

export class DensityBuffer {
  public buffer: WebGLBuffer;

  constructor(private width: number, private height: number) {
    this.init();
  }

  private init() {
    this.buffer = gl.createBuffer();

    const count = this.calculateCount(this.width * this.height);
    const data = new Array(count).fill(0);

    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.buffer);
    gl.bufferData(
      gl.SHADER_STORAGE_BUFFER,
      new Float32Array(data),
      gl.STATIC_COPY
    );
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
  }

  calculateCount(value: number) {
    if (value == 1) {
      return value;
    };

    return value + this.calculateCount(value / 4);
  }
}
