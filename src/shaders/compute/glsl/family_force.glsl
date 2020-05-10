#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) readonly buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) readonly buffer FamilyInfoBuffer { float data[]; } familyInfo;
layout (std430, binding = 2) writeonly buffer FamilyForceBuffer { vec2 data[]; } familyForce;

uniform uint u_numSamples;
uniform float u_famDistanceFactor;

void main() {
    uint id = gl_GlobalInvocationID.x;

    if(id >= u_numSamples) {
        return;
    }


    uint familyInfoIndex = id * 2u;
    int famId = int(familyInfo.data[familyInfoIndex]);
    float famDistance = familyInfo.data[familyInfoIndex + 1u] * u_famDistanceFactor;
    vec2 pos = positions.data[id];

    vec2 force = vec2(0.0);

    if (famId >= 0 && famId < int(u_numSamples)) {
        vec2 famPos = positions.data[famId];
        float dist = distance(pos, famPos);
		if (dist > famDistance)
		{
			float fac = (dist - famDistance) / dist;
		    force = (famPos - pos) * fac;
		}
    }

    familyForce.data[id] = force;
}
