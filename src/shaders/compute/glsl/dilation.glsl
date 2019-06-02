#version 430

uniform image2D inputTex;
uniform image2D outputTex;

layout (local_size_x = 16, local_size_y = 16) in;

void main() {
    ivec2 position = ivec2(gl_GlobalInvocationID.xy);
    imageStore(outputTex, position, vec4(1.0, 0.0, 0.0, 0.0));
}
