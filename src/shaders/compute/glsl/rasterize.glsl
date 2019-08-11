#version 310 es

layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

layout (std430, binding = 0) buffer Positions { vec2 data[]; } positions;

uniform uint u_num;

void main() {
    uint index = gl_GlobalInvocationID.x;

    if(index > u_num) {
        return;
    }

    vec2 pos = positions.data[index];
    ivec2 output_pos = ivec2(pos);

    imageStore(u_output, output_pos, vec4(1.0));
}
