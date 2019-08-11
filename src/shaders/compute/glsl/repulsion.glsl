#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;


//layout(binding = 0, r32f) readonly highp uniform image2D[] density_pyramid;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer RepulsionBuffer { vec2 forces[]; } repulsion;
layout(binding = 2) uniform sampler2D u_density;

uniform uint u_pyramid_size;
uniform vec2 u_dimension;


vec2 getForcesForLevel(vec2 pos, vec2 dim, float level) {
    vec2 force = vec2(0, 0);
    vec2 off = pos / 2.0;
    for(float dx = 0.0; dx < 2.0; dx++) {
        for(float dy = 0.0; dy < 2.0; dy++) {
            vec2 p = off + vec2(dx, dy);
            if(p == pos) {
                continue;
            }

            vec4 dens = textureLod(u_density, p, level);
        }
    }
    return force;
}

void main() {

    uint id = gl_GlobalInvocationID.x;
    vec2 position = positions.data[id];

    vec2 force = vec2(0, 0);

    for(float l = 0.0; l < float(u_pyramid_size) - 1.0; l++) {
        float exp = pow(2.0, l);
        vec2 dim = u_dimension / exp;
        vec2 pos = position / exp;
        force += getForcesForLevel(pos, dim, l);
    }

    repulsion.forces[id] = force;
}
