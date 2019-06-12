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
        float last_value = 0.0;
        float num_last_values = 0.0;
        ivec2 input_pos = output_pos / 2;

        for(int dx = -1; dx < 2; ++dx) {
            for(int dy = -1; dy < 2; ++dy) {
                float value = imageLoad(u_lastPush, input_pos + ivec2(dx, dy)).r;
                if(value != 0.0) {
                    last_value += value;
                    num_last_values++;
                }
            }
        }

        if(num_last_values != 0.0) {
            last_value = last_value / num_last_values;
        }

        imageStore(u_output, output_pos, vec4(last_value));
    }

}
