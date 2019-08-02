#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_input;
layout(binding = 1, r32f) writeonly highp uniform image2D u_output;

uniform ivec2 u_outputSize;

void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);

    if(output_pos.x >= u_outputSize.x || output_pos.y >= u_outputSize.y)
        return;

    ivec2 input_pos = output_pos * 2;

    float sum = 0.0;

    for(int dx = 0; dx < 2; ++dx) {
        for(int dy = 0; dy < 2; ++dy) {
            sum += imageLoad(u_input, input_pos + ivec2(dx, dy)).r;
        }
    }

    imageStore(u_output, output_pos, vec4(sum));
}
