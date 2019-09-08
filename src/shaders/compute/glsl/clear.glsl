#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) writeonly highp uniform image2D u_output;

uniform ivec2 u_outputSize;

uniform float u_value;
uniform float u_border_value;
uniform int u_setborder;

void main() {
    ivec2 pos = ivec2(gl_GlobalInvocationID.x, gl_GlobalInvocationID.y);

    if(pos.x >= u_outputSize.x || pos.y >= u_outputSize.y) {
        return;
    }

    if(u_setborder > 0 && pos.x == 0 ||  pos.x == u_outputSize.x - 1 ||
        pos.y == 0 ||  pos.y == u_outputSize.y - 1) {
        imageStore(u_output, pos, vec4(u_border_value));
        return;
    }

    imageStore(u_output, pos, vec4(u_value));

}
