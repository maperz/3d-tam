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

uniform float u_repulsionStrength;
uniform uint u_numSamples;

uniform uint u_maxCalculation;
uniform uint u_tick;

bool isNeighbour(PointInfo info, uint other) {
    for (int u = 0; u < info.count; u++) {
        if (uint(neighbours.data[info.offset + u]) == other) {
            return true;
        }
    }
    return false;
}

float rand(vec2 seed) {
     // glsl-random
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 random_jiggle(vec2 seed) {
    return (vec2(rand(seed), rand(seed.yx)) - vec2(0.5, 0.5)) * 0.000000001;
}

void main() {

    uint id = gl_GlobalInvocationID.x;
    if(id >= u_numSamples) {
        return;
    }

    PointInfo info = infos.infos[id];

    vec2 force = vec2(0, 0);

    vec2 position = positions.data[id];
    //uint numCalculations = u_numSamples;
    uint numCalculations = min(u_numSamples, u_maxCalculation);
    uint startFrame = (u_tick * numCalculations) % u_numSamples;

    for (uint i = 0u; i < numCalculations; ++i) 
    {
        uint index = startFrame + i;
        index = index >= u_numSamples ? index - u_numSamples : index;
        if (index == id) {
            continue;
        }
        vec2 other_pos = positions.data[index];
        vec2 vec = other_pos - position;

        if (vec == vec2(0.0)) { vec = random_jiggle(position - vec2(id)); }

        float l = length(vec);

        float strength = -u_repulsionStrength;

        vec2 f = normalize(vec) * strength / l;
        force += f;
    }
    repulsion.forces[id] = force;
}
