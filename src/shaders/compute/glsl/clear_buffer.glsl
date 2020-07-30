#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (std430, binding = 0) buffer Density { float data[]; } density;

uniform ivec2 u_outputSize;

void main() {
    ivec2 pos = ivec2(gl_GlobalInvocationID.x, gl_GlobalInvocationID.y);

    if(pos.x >= u_outputSize.x || pos.y >= u_outputSize.y) {
        return;
    }

    int index = pos.x + pos.y * u_outputSize.x;
    density.data[index] = 0.0;
}
