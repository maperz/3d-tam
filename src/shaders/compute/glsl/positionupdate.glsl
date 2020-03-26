#version 310 es

#define WORKGROUP_SIZE 16

layout (local_size_x = WORKGROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer AttractionBuffer { vec2 forces[]; } attraction;
layout (std430, binding = 2) buffer RepulsionBuffer { vec2 forces[]; } repulsion;

uniform vec2 u_gravity;
uniform vec2 u_center;

uniform int u_selectedId;
uniform vec2 u_f_drag;

uniform uint u_numSamples;

void main() {
    uint id = gl_GlobalInvocationID.x;

    if(id >= u_numSamples) {
        return;
    }

    vec2 f_attr = attraction.forces[id];
    vec2 f_rep = repulsion.forces[id];
    vec2 pos = positions.data[id];

    vec2 f_grav = vec2(0, 0);
    if(u_center != pos) {
        f_grav = normalize(u_center - pos) * u_gravity;
    }

    if(int(id) == u_selectedId) {
        positions.data[id] = u_f_drag;
    }
    else {
        positions.data[id] = pos + f_attr + f_rep + f_grav;
    }
}
