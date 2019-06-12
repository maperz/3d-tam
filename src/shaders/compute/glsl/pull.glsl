#version 310 es

#define WIDTH 512
#define HEIGHT 512

layout (local_size_x = 2, local_size_y = 2, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_current;
layout(binding = 1, r32f) readonly highp uniform image2D u_lastPush;
layout(binding = 2, r32f) writeonly highp uniform image2D u_output;

void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);
    float cur_value = imageLoad(u_current, output_pos).r;

    if(cur_value != 0.0) {
        imageStore(u_output, output_pos, vec4(cur_value));
    }
    else {
        ivec2 input_pos = output_pos / 2;
        // Should calculate the average here

        float last_value = imageLoad(u_lastPush, input_pos).r;
        imageStore(u_output, output_pos, vec4(last_value));

        //imageStore(u_output, output_pos, vec4(255));

    }

}
