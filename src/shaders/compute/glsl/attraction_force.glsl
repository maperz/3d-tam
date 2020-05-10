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
layout (std430, binding = 3) readonly buffer VelocityBuffer { vec2 data[]; } velocity;

layout (std430, binding = 4) buffer AttractionBuffer { vec2 forces[]; } attraction;

uniform float u_stiffness;
uniform float u_length;
uniform uint u_numSamples;

float rand(vec2 seed) {
     // glsl-random
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 random_jiggle(vec2 seed) {
    return (vec2(rand(seed), rand(seed.yx)) - vec2(0.5, 0.5)) * 1.01;
}

void main() {
    uint id = gl_GlobalInvocationID.x;
    if(id >= u_numSamples) {
        return;
    }

    PointInfo info = infos.infos[id];

    vec2 force = vec2(0, 0);

    vec2 position = positions.data[id] + velocity.data[id];
    for(int i = 0; i < info.count; i++) {
        int neighbourId = neighbours.data[info.offset + i];

        vec2 neighbour_pos = positions.data[neighbourId] + velocity.data[id];
        float targetDistance = u_length;

        float count = float(info.count);
        float otherCount = float(infos.infos[neighbourId].count);

        float strength = 1.0 / min(count, otherCount);

        vec2 dir = neighbour_pos - position;
        if (dir == vec2(0.0)) { dir = random_jiggle(position - vec2(id)); }
        float l = length(dir);
        l = (l - targetDistance) / l * strength;
        dir *= l;
        // count[link.source.index] / (count[link.source.index] + count[link.target.index])
        float bias = otherCount / (count + otherCount);
        force += dir * bias;
    }

    attraction.forces[id] = force;
}
