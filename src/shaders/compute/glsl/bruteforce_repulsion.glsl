#version 310 es

#define WORKGROUP_SIZE 16
#define MAX_PYRAMID_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;


struct PointInfo {
    int count;
    int offset;
};


layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer RepulsionBuffer { vec2 forces[]; } repulsion;

layout (std430, binding = 2) buffer InfoBuffer { PointInfo infos[]; } infos;
layout (std430, binding = 3) buffer NeighboursBuffer { int data[]; } neighbours;

uniform vec2 u_dimension;

uniform int u_totalCount;

void main() {
    uint id = gl_GlobalInvocationID.x;
    PointInfo info = infos.infos[id];

    vec2 force = vec2(0, 0);

    vec2 position = positions.data[id];
    for(int i = 0; i < u_totalCount; ++i){
        vec2 other_pos = positions.data[i];
        vec2 vec = position - other_pos;
        float dist = length(vec);
        vec2 f = normalize(vec) / max(1.0, dist * dist) * 1000.0;
        force += f;
    }

    repulsion.forces[id] = force;
}
