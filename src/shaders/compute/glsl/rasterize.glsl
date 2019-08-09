#version 310 es

layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

layout (std430, binding = 0) buffer Positions { vec2 data[]; } positions;
layout (std430, binding = 1) buffer Values { float data[]; } values;

uniform uint u_num;
uniform int u_size;
uniform uvec2 u_outputSize;

void main() {
    uint index = gl_GlobalInvocationID.x;

    if(index > u_num) {
        return;
    }

    vec2 pos = positions.data[index];
    float value = values.data[index];

    ivec2 output_pos = ivec2(pos);

    for(int dx = -u_size; dx <= u_size; ++dx) {
        for(int dy = -u_size; dy <= u_size; ++dy) {
            imageStore(u_output, output_pos + ivec2(dx, dy), vec4(value));
        }
    }
}
