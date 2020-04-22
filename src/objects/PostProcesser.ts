import { gl, canvas } from "../engine/Context";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { PostProcessingShader } from "../shaders/heightmap/PostProcessing";
import { TPAssert } from "../engine/error/TPException";

export class PostProcesser {
  private shader: Shader;
  private vertexBuffer: WebGLBuffer;
  private uvBuffer: WebGLBuffer;

  private colorFbo: WebGLFramebuffer;
  private colorTexture: WebGLTexture;
  private heightFbo: WebGLFramebuffer;
  private heightTexture: WebGLTexture;

  init() {
    this.shader = createShaderFromSources(PostProcessingShader);
    [this.colorTexture, this.colorFbo] = this.createFramebuffer(gl.RGBA);
    [this.heightTexture, this.heightFbo] = this.createFramebuffer(gl.RGBA);
  }

  startHeightRendering() {
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.heightFbo);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  startColorRendering() {
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.colorFbo);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  doPostProcess() {
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    this.shader.use();
    if (this.vertexBuffer == null) {
      var vertexData = [
        1.0,
        1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
      ];
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexData),
        gl.STATIC_DRAW
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.uniform1i(this.shader.getUniformLocation("u_colorTexture"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTexture);
    gl.uniform1i(this.shader.getUniformLocation("u_heightTexture"), 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Cleanup:
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.shader.unuse();
  }

  private createFramebuffer(format: GLenum) {
    let buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      canvas.width,
      canvas.height,
      0,
      format,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    TPAssert(
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE,
      "Framebuffer incomplete!"
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return [texture, buffer];
  }
}
