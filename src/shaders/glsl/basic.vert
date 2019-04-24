#version 100
precision highp float;

varying vec3 position;

void main() {
    gl_Position = vec4(position, 1.0);
}
