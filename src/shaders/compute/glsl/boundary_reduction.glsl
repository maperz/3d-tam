#version 310 es

layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) readonly buffer BoundaryInBuffer { vec2 data[]; } higher;
layout (std430, binding = 1) writeonly buffer BoundaryOutBuffer { vec2 data[]; } lower;

// Number of values in the higher input buffer
uniform uint u_numHigher;
uniform uint u_numLower;

void main() {
    uint indexLower = gl_GlobalInvocationID.x * 2u;
    uint indexHigher = gl_GlobalInvocationID.x * 16u;

    if(indexLower >= u_numLower) {
        return;
    }

    vec2 min = higher.data[indexHigher];
    vec2 max = higher.data[indexHigher];

    for (uint i = 1u; i < 16u; ++i) {

        uint index = indexHigher + i;
        if (index >= u_numHigher) {
            break;
        }
        vec2 val = higher.data[index];
        min.x = (val.x < min.x) ? val.x : min.x;
        min.y = (val.y < min.y) ? val.y : min.y;
        max.x = (val.x > max.x) ? val.x : max.x;
        max.y = (val.y > max.y) ? val.y : max.y;
    }

    lower.data[indexLower] = min; 
    lower.data[indexLower + 1u] = max; 
}
