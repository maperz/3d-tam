#version 100
precision highp float;

attribute vec2 position;
attribute vec2 uvs;

uniform vec2 u_viewport;


varying vec2 v_uv;
varying vec2 v_viewport;


void main() {
    v_uv = uvs;
    v_viewport = u_viewport;
    gl_Position = vec4(position, 0.0, 1.0);
}
