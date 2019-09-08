#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

struct PointInfo {
    int count;
    int offset;
};

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer InfoBuffer { PointInfo infos[]; } infos;
layout (std430, binding = 2) buffer NeighboursBuffer { int data[]; } neighbours;
layout (std430, binding = 3) buffer AttractionBuffer { vec2 forces[]; } attraction;

uniform float u_stiffness;
uniform float u_length;

void main() {
    uint id = gl_GlobalInvocationID.x;
    PointInfo info = infos.infos[id];

    vec2 force = vec2(0, 0);

    if(info.count > 0) {
        vec2 position = positions.data[id];
        for(int i = 0; i < info.count; i++) {
            int neighbourId = neighbours.data[info.offset + i];
            vec2 neighbour_pos = positions.data[neighbourId];

            // Calculate attraction based on neighbour position
            // f = k*(distance(A,B)-SpringLength)
            vec2 dir = normalize(neighbour_pos - position);
            float distance = distance(neighbour_pos, position);
            float f = u_stiffness * (distance - u_length);
            force += dir * f;
        }
    }

    attraction.forces[id] = force;
}
