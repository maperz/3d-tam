#version 310 es

precision highp float;

in float v_pixelvalue;
in vec3 v_color;
in vec2 v_uv;
in float v_shouldDrop;

uniform sampler2D u_texture;

out vec4 color;

void main() {
    vec4 texCol = texture(u_texture, v_uv);
    color = vec4(v_color, texCol.a);

    if (v_shouldDrop > 0.0) {
        discard;
    }
}