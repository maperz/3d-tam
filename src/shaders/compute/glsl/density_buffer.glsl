#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (std430, binding = 0) buffer DensityBuffer { float data[]; } density;

uniform int u_inputOffset;
uniform int u_inputWidth;

uniform int u_outputOffset;
uniform int u_outputWidth;

int getIn(int x, int y) {
    return x + y * u_inputWidth + u_inputOffset;
}

int getOut(int x, int y) {
    return (x + y * u_outputWidth) + u_outputOffset;
}

void main() {
    ivec2 output_pos = ivec2(gl_GlobalInvocationID.xy);

    if(output_pos.x >= u_outputWidth || output_pos.y >= u_outputWidth)
        return;
    
    ivec2 input_pos = output_pos * 2;

    float sum = 0.0;
    int x = input_pos.x;
    int y = input_pos.y;
    for(int dx = 0; dx < 2; ++dx) {
        for(int dy = 0; dy < 2; ++dy) {
            int index = getIn(x + dx, y + dy);
            sum += density.data[index];
        }
    }

    int out_index = getOut(output_pos.x, output_pos.y);
    density.data[out_index] = sum;
}
