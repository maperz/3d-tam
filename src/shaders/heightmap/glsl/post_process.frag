#version 310 es

precision highp float;

out vec4 color;

uniform vec2 u_size;

in vec2 v_uv;

uniform sampler2D u_colorTexture;
uniform sampler2D u_heightTexture;

float getValue(int x, int y) {
    return texture(u_heightTexture, v_uv + vec2(x, y)).r;
}

void main() {

    const float segments = 34.0;

    vec4 col = texture(u_colorTexture, v_uv);
    
    float height = texture(u_heightTexture, v_uv).r;

    if (height == 0.0) {
        color = vec4(0);
        return;
    }

    float valuePercent = height * 100.0f;
    if(abs(mod(valuePercent, 100.0 / float(segments))) < 0.08) {
        col = vec4(1,0,1, 1);
    }

    color = col;

}
