#version 310 es

precision highp float;

out vec4 color;

uniform vec2 u_size;

in vec2 v_uv;

uniform sampler2D u_colorTexture;
uniform sampler2D u_heightTexture;
uniform sampler2D u_depthTexture;

uniform int u_numSegments;

vec2 toUv(vec2 pixel) {
    return pixel / u_size;
}

bool valid(int x, int y) {
    vec2 otherUv = v_uv + toUv(vec2(x, y));
    bool onTexture =  otherUv.x >= 0.0 && otherUv.y >= 0.0 && otherUv.x <= 1.0 && otherUv.y <= 1.0;

    if (!onTexture) {
        return false;
    }

    float depth = texture(u_depthTexture, otherUv).r;
    
    const float depthThreshold = 100.0;
    return distance(depth, gl_FragDepth) < depthThreshold;
}

float getHeight(int x, int y) {
    return texture(u_heightTexture, v_uv + toUv(vec2(x, y))).r;
}

float signedDistanceToTarget(float target, ivec2 offset) {
    return target - getHeight(offset.x, offset.y);
}

bool isClosestTo(float target) {
    float c = signedDistanceToTarget(target, ivec2(0, 0));
    float l = signedDistanceToTarget(target, ivec2(-1,  0));
    float r = signedDistanceToTarget(target, ivec2( 1,  0));
    float t = signedDistanceToTarget(target, ivec2( 0,  1));
    float b = signedDistanceToTarget(target, ivec2( 0, -1));

    float a_c = abs(c);
    float a_l = abs(l);
    float a_r = abs(r);
    float a_t = abs(t);
    float a_b = abs(b);

    if (a_c < a_l && a_c < a_r && ((l < c && c < r) || (r < c && c < l)))
        return true;

    if (a_c < a_t && a_c < a_b && ((t < c && c < b) || (b < c && c < t)))
        return true;

    return false;
}

void main() {

    color = texture(u_colorTexture, v_uv);
    float depth = texture(u_depthTexture, v_uv).r;
    gl_FragDepth = depth;
    float height = getHeight(0, 0);
    if (height == 0.0 || u_numSegments < 2) {
        return;
    }

    float segments = float(u_numSegments);
    float segmentLines = segments - 1.0;
    float stepSize = 1.0 / segments;
    
    float lowerSegment = floor(segments * height);
    float heigherSegment = ceil(segments * height);

    float lowerTarget = lowerSegment * stepSize;
    float heigherTarget = heigherSegment * stepSize;

    if (isClosestTo(lowerTarget) || isClosestTo(heigherTarget)) {
        color *= 0.8;
    }
}
