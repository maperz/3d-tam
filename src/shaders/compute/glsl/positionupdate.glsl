#version 310 es

#define WORKGROUP_SIZE_X 16
#define WORKGROUP_SIZE_Y 16

layout (local_size_x = WORKGROUP_SIZE_X, local_size_y = WORKGROUP_SIZE_Y, local_size_z = 1) in;

layout (std430, binding = 0) buffer AttractionBuffer { vec2 forces[]; } attraction;
layout (std430, binding = 1) buffer RepulsionBuffer { vec2 forces[]; } repulsion;
layout (std430, binding = 2) buffer PositionBuffer { vec2 data[]; } positions;

void main() {
    ivec2 invocId = ivec2(gl_GlobalInvocationID.xy);
    int id = invocId.x + invocId.y * int(gl_WorkGroupSize.x);

    vec2 f_attr = attraction.forces[id];
    vec2 f_rep = attraction.forces[id];
    vec2 pos = positions.data[id];
    positions.data[id] = pos + f_attr + f_rep;
}
