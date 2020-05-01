#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) readonly buffer FamilyInfoBuffer { float data[]; } familyInfo;

uniform uint u_numSamples;

void main() {
    uint id = gl_GlobalInvocationID.x;

    if(id >= u_numSamples) {
        return;
    }


    uint familyInfoIndex = id * 2u;
    int famId = int(familyInfo.data[familyInfoIndex]);
    float famDistance = familyInfo.data[familyInfoIndex + 1u];
    vec2 pos = positions.data[id];

    if (famId >= 0 && famId < int(u_numSamples)) {
        vec2 famPos = positions.data[famId];
        vec2 famDir = normalize(famPos - pos);
        float dist = distance(pos, famPos);
        float factor = (dist - famDistance) / dist;
        pos += (famDir) * factor;
    }
    positions.data[id] = pos;
}
