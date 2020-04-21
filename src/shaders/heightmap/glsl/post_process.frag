#version 310 es

precision highp float;

out vec4 color;

uniform vec2 u_size;

in vec2 v_uv;

uniform sampler2D u_beforeTexture;
uniform sampler2D u_heightTexture;

void main() {
    color = texture(u_beforeTexture, v_uv);
}
