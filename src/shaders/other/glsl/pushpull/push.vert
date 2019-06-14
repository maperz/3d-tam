#version 100
precision highp float;

attribute vec2 position;
attribute vec2 uvs;
varying vec2 u_inputSize;
varying vec2 u_outputSize;

varying vec2 v_uv;
varying vec2 v_inputSize;
varying vec2 v_outputSize;
void main() {
    v_uv = uvs;
    v_inputSize = u_inputSize;
    v_outputSize = u_outputSize;
    gl_Position = vec4(position, 0.0, 1.0);
}
