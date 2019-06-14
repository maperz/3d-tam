#version 310 es

precision highp float;

in float v_pixelvalue;

uniform vec4 u_color;

out vec4 color;

void main() {
    color = vec4(v_pixelvalue, v_pixelvalue, v_pixelvalue, 1.0);
}
