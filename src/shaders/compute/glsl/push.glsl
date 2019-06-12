#version 310 es

#define WIDTH 512
#define HEIGHT 512

layout (local_size_x = 2, local_size_y = 2, local_size_z = 1) in;


layout(binding = 0, r32f) readonly highp uniform image2D u_input;
layout(binding = 1, r32f) writeonly highp uniform image2D u_output;

layout (std430, binding = 0) buffer SSBO {
    float data[];
} ssbo_input;


void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);
    ivec2 input_pos = output_pos * 2;

    float sum = 0.0;
    float values = 0.0;

    for(int dx = 0; dx < 2; ++dx) {
        for(int dy = 0; dy < 2; ++dy) {
            float value = imageLoad(u_input, input_pos + ivec2(dx, dy)).r;

            if(value != 0.0) {
                sum += value;
                values++;
            }
        }
    }


    if(values == 0.0) {
        return;
    }

    float result =  sum / values;

    imageStore(u_output, output_pos, vec4(result));


}
