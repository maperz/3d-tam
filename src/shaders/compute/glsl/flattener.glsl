#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_input;
layout(binding = 1, r32f) writeonly highp uniform image2D u_output;

uniform uvec2 u_outputSize;
uniform int u_numSegments;

float transform(float x) {

    float step = 1.0;

    if(u_numSegments > 1) {
        step /= float(u_numSegments);
    }

    for(float i = 0.0; i < 1.0; i += step) {
        if(x < i) {
            return i;
        }
    }
    return 1.0;
}

void main() {
    uvec2 pos = gl_GlobalInvocationID.xy;

    if (pos.x < 0u || pos.x >= u_outputSize.x
    || pos.y < 0u || pos.y >= u_outputSize.y) {
        return;
    }

    float value = imageLoad(u_input, ivec2(pos)).r;
    float transformed = transform(value);
    imageStore(u_output, ivec2(pos), vec4(transformed));
}
