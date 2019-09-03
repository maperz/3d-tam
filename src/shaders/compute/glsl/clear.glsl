#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

uniform ivec2 u_outputSize;

void main() {
    ivec2 pos = ivec2(gl_GlobalInvocationID.x, gl_GlobalInvocationID.y);

    if(pos.x >= u_outputSize.x || pos.y >= u_outputSize.y) {
        return;
    }

    imageStore(u_output, pos, vec4(0.0));

}
