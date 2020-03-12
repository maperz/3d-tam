#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_input;
layout(binding = 1, r32f) writeonly highp uniform image2D u_output;

//layout(binding=0, r32f) uniform sampler2D pyramid;
//uniform uint level;

void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);

    ivec2 output_size = imageSize(u_output);

    if(output_pos.x >= output_size.x || output_pos.y >= output_size.y)
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
