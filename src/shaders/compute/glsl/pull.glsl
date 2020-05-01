#version 310 es

#define WIDTH 512
#define HEIGHT 512

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_current;
layout(binding = 1, r32f) readonly highp uniform image2D u_lastPush;
layout(binding = 2, r32f) writeonly highp uniform image2D u_output;

uniform ivec2 u_currentSize;
uniform ivec2 u_outputSize;

void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);

    if (output_pos.x >= u_outputSize.x || output_pos.y >= u_outputSize.y)
        return;

    float cur_value = imageLoad(u_current, output_pos).r;

    if (cur_value != 0.0 && !isnan(cur_value))
    {
        imageStore(u_output, output_pos, vec4(cur_value));
    }
    else
    {
        float last_value = 0.0;
        float num_last_values = 0.0;
        ivec2 input_pos = output_pos / 2;

        for (int dx = -1; dx <= 1; ++dx)
        {
            for (int dy = -1; dy <= 1; ++dy)
            {
                float value = imageLoad(u_lastPush, input_pos + ivec2(dx, dy)).r;
                if(value != 0.0 && !isnan(value)) {
                    last_value += value;
                    num_last_values++;
                }
            }
        }

        if (num_last_values != 0.0 && !isnan(num_last_values))
        {
            last_value = last_value / num_last_values;
        }

        imageStore(u_output, output_pos, vec4(last_value));
    }

}
