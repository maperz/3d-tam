#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) readonly buffer AttractionBuffer { vec2 forces[]; } attraction;
layout (std430, binding = 1) readonly buffer RepulsionBuffer { vec2 forces[]; } repulsion;
layout (std430, binding = 2) buffer VelocityBuffer { vec2 data[]; } velocity;

uniform uint u_numSamples;

void main() {
    uint id = gl_GlobalInvocationID.x;

    if (id >= u_numSamples) {
        return;
    }

    vec2 f_attraction = attraction.forces[id];
    vec2 f_repulsion = repulsion.forces[id];

    velocity.data[id] += (f_attraction + f_repulsion); 
}
