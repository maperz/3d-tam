#version 100
precision highp float;

attribute vec2 position;
attribute vec2 uvs;

varying vec2 v_uv;

void main() {
    v_uv = uvs;
    gl_Position = vec4(position, 0.0, 1.0);
}
