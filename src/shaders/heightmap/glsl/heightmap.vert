#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (location=1) in ivec2 a_pixel;

layout(binding = 0, r32f) readonly highp uniform image2D u_heightmap;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

out float v_pixelvalue;

void main() {

    v_pixelvalue = imageLoad(u_heightmap, a_pixel).r;
    float height =  v_pixelvalue * 2.0;
    vec3 position = vec3(a_position.x,  height, a_position.y);
    gl_Position = u_proj * u_view * u_model * vec4(position, 1.0);
}
