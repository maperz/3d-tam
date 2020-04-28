#version 310 es

precision highp float;

in float v_pixelvalue;
in vec4 v_color;

out vec4 color;

void main() {
    color = v_color;
}