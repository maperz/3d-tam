#version 310 es

precision highp float;

in float v_value;

out vec4 color;

void main() {
    color = vec4(v_value);
}
