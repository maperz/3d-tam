#version 310 es

#define WORKGROUP_SIZE 16
#define MAX_PYRAMID_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;


//layout(binding = 0, r32f) readonly highp uniform image2D[] density_pyramid;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer RepulsionBuffer { vec2 forces[]; } repulsion;

uniform uint u_pyramid_size;
uniform vec2 u_dimension;
uniform uint u_numSamples;

layout(binding = 0, r32f) readonly highp uniform image2D u_pyramid[MAX_PYRAMID_SIZE];

vec2 getForcesForLevel(vec2 pos, vec2 dim, uint level, vec2 origPos) {
    vec2 force = vec2(0, 0);
    vec2 off = pos / 2.0;
    for(float dx = 0.0; dx < 2.0; dx++) {
        for(float dy = 0.0; dy < 2.0; dy++) {
            if(dx == 0.0 && dy == 0.0) {
                continue;
            }

            vec2 p = off + vec2(dx, dy);

            float dens = imageLoad(u_pyramid[level], ivec2(p.x, p.y)).r;
            float exp = pow(2.0, float(level));
            vec2 center = (p + vec2(0.5)) * exp;

            vec2 vec = origPos - vec2(u_dimension) / 2.0;
            float dist = length(vec);

            vec2 f = normalize(vec) * dens / max(1.0, dist * dist * dist) * 100000.0;

            force += f;
        }
    }
    return vec2(0.0);
    return force;
}

void main() {

    uint id = gl_GlobalInvocationID.x;
    if(id >= u_numSamples) {
        return;
    }

    vec2 position = positions.data[id];

    vec2 force = vec2(0, 0);

    for(uint l = 0u; l < u_pyramid_size - 1u; l++) {
        float exp = pow(2.0, float(l));
        vec2 dim = u_dimension / exp;
        vec2 pos = position / exp;
        force += getForcesForLevel(pos, dim, l, position);
    }

    repulsion.forces[id] = force;
}
