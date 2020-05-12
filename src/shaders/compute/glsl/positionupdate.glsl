#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer VelocityBuffer { vec2 data[]; } velocity;

layout (std430, binding = 2) readonly buffer FamilyInfoBuffer { float data[]; } familyInfo;
layout (std430, binding = 3) writeonly buffer Position3dBuffer { vec4 data[]; } positions3d;
layout (std430, binding = 4) readonly buffer ValuesBuffer { float data[]; } values;

uniform vec2 u_gravity;
uniform vec2 u_center;

uniform int u_selectedId;
uniform vec2 u_f_drag;

uniform uint u_numSamples;
uniform vec2 u_dimension;

uniform float u_velocityDecay;
uniform float u_famDistanceFactor;
uniform int u_enabledFamilyConstraint;

void main() {
    uint id = gl_GlobalInvocationID.x;

    if (id >= u_numSamples) {
        return;
    }

    velocity.data[id] *= 1.0 - u_velocityDecay;
    vec2 vel = velocity.data[id];

    vec2 pos = positions.data[id];

    if (int(id) == u_selectedId) {
        pos = u_f_drag;
        velocity.data[id] = vec2(0);
    }
    else {
        pos += vel;

        if (u_enabledFamilyConstraint > 0) {
            uint familyInfoIndex = id * 2u;
            int famId = int(familyInfo.data[familyInfoIndex]);
            float famDistance = familyInfo.data[familyInfoIndex + 1u] * u_famDistanceFactor;

            if (famId >= 0 && famId < int(u_numSamples)) {
                vec2 famPos = positions.data[famId];
                float dist = distance(pos, famPos);
                if (dist > famDistance)
                {
                    float fac = (dist - famDistance) / dist;
                    pos += (famPos - pos) * fac;
                }
            }              
        }
    }

    positions.data[id] = pos;

    float value = values.data[id];

    positions3d.data[id].xyz = vec3(pos.x, value, pos.y);
}
