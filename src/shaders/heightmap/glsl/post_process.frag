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
    
    const float depthThreshold = 10.0;
    return distance(depth, gl_FragDepth) < depthThreshold;
}

float getHeight(int x, int y) {
    return texture(u_heightTexture, v_uv + toUv(vec2(x, y))).r;
}

float getDistanceToTarget(float target, ivec2 offset) {
    return distance(target, getHeight(offset.x, offset.y));
}

bool isClosestTo(float target) {
    float own_distance = getDistanceToTarget(target, ivec2(0, 0));
    if (valid( 1,  0) && getDistanceToTarget(target, ivec2( 1,  0)) < own_distance) return false;
    if (valid( 0,  1) && getDistanceToTarget(target, ivec2( 0,  1)) < own_distance) return false;
    if (valid(-1,  0) && getDistanceToTarget(target, ivec2(-1,  0)) < own_distance) return false;
    if (valid( 0, -1) && getDistanceToTarget(target, ivec2( 0, -1)) < own_distance) return false;
    return true;
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
        color = vec4(0);
    }
}
