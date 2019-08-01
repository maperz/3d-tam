#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

layout (std430, binding = 0) buffer SSBO {
    float data[];
} ssbo_input;

uniform int u_size;
uniform uvec2 u_inputSize;

void main() {
    ivec2 position = ivec2(gl_GlobalInvocationID.xy);

    uint index = gl_GlobalInvocationID.x + gl_GlobalInvocationID.y * u_inputSize.x;

    float value = ssbo_input.data[index];

    if(value == 0.0)
        return;

    for(int dx = -u_size; dx <= u_size; ++dx) {
        for(int dy = -u_size; dy <= u_size; ++dy) {
            imageStore(u_output, position + ivec2(dx, dy), vec4(value));
        }
    }
}
