#version 100
precision highp float;

attribute vec3 position;
attribute vec2 uvs;
attribute vec3 a_color;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

varying vec2 v_uv;
varying vec4 v_color;

void main() {

    v_color = vec4(a_color, 1.0);

    v_uv = uvs;

    gl_Position = proj * view * model * vec4(position, 1.0);
}
