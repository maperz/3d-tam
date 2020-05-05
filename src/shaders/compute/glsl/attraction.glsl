#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

struct PointInfo {
    int count;
    int offset;
};

layout (std430, binding = 0) readonly buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) readonly buffer InfoBuffer { PointInfo infos[]; } infos;
layout (std430, binding = 2) readonly buffer NeighboursBuffer { int data[]; } neighbours;
layout (std430, binding = 3) writeonly buffer AttractionBuffer { vec2 forces[]; } attraction;
layout (std430, binding = 4) readonly buffer FamilyInfoBuffer { float data[]; } familyInfo;

uniform float u_stiffness;
uniform float u_length;
uniform uint u_numSamples;


vec2 getTargetDistance(int myId, int otherId) {
    int myFamilyInfo = myId * 2;
    int myFamId = int(familyInfo.data[myFamilyInfo]);

    float familyStiffness = u_stiffness;

    if (myFamId == otherId) {
        return vec2(familyInfo.data[myFamilyInfo + 1], familyStiffness);
    }

    int otherFamilyInfo = otherId * 2;
    int otherFamId = int(familyInfo.data[otherFamilyInfo]);

    if (otherFamId == myId) {
        return vec2(familyInfo.data[otherFamilyInfo + 1], familyStiffness);;
    }

    return vec2(u_length, u_stiffness);
} 

void main() {
    uint id = gl_GlobalInvocationID.x;
    if(id >= u_numSamples) {
        return;
    }

    PointInfo info = infos.infos[id];

    vec2 force = vec2(0, 0);

    if(info.count > 0) {
        vec2 position = positions.data[id];
        for(int i = 0; i < info.count; i++) {
            int neighbourId = neighbours.data[info.offset + i];

            vec2 target = getTargetDistance(int(id), neighbourId);
            vec2 neighbour_pos = positions.data[neighbourId];
            float target_length = target.x;
            float stiffness = target.y;
            // Calculate attraction based on neighbour position
            // f = k*(distance(A,B)-SpringLength)
            vec2 dir = neighbour_pos - position;
            float distance = distance(neighbour_pos, position);
            float f = stiffness * (distance - target_length);
            force += dir * f * 0.001;
        }
    }

    attraction.forces[id] = force;
}
