#version 310 es

precision highp float;

in float v_pixelvalue;
in vec4 v_color;
in vec2 v_uv;

uniform sampler2D u_circleTex;

out vec4 color;

void main() {
    vec4 texCol = texture(u_circleTex, v_uv);
    color = v_color;
    color.a = texCol.a;
}