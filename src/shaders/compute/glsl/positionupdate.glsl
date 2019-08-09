#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer AttractionBuffer { vec2 forces[]; } attraction;
layout (std430, binding = 2) buffer RepulsionBuffer { vec2 forces[]; } repulsion;

void main() {
    uint id = gl_GlobalInvocationID.x;

    vec2 f_attr = attraction.forces[id];
    vec2 f_rep = attraction.forces[id];
    vec2 pos = positions.data[id];
    positions.data[id] = pos + f_attr + f_rep;
}
