#version 310 es

layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

layout (std430, binding = 0) buffer Positions { vec2 data[]; } positions;
layout (std430, binding = 1) buffer Density { float data[]; } density;

uniform uint u_num;
uniform int u_width;

void main() {
    uint index = gl_GlobalInvocationID.x;

    if(index >= u_num) {
        return;
    }

    vec2 pos = positions.data[index];
    ivec2 output_pos = ivec2(pos);

    int output_index = output_pos.x + output_pos.y * u_width;

    density.data[output_index] += 1.0;
}
