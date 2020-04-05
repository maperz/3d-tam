#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (location=1) in vec2 a_pixel;

layout(binding = 0, r32f) readonly highp uniform image2D u_heightmap;
layout(binding = 0, std430) readonly buffer Normals { vec4 data[]; } normals;

uniform float u_height;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

uniform vec2 u_size;

uniform vec2 u_gridSize;

uniform vec4 u_color;

out float v_pixelvalue;
out vec2 v_gridPosition;
out vec3 v_position;
out vec2 v_gridSize;
out float v_value;

out vec3 v_normal;

void main()
{

    v_pixelvalue = imageLoad(u_heightmap, ivec2(a_pixel * u_size)).r;

    float height =  v_pixelvalue * u_height;
    vec3 position = vec3(a_position.x,  height, a_position.y);
    gl_Position = u_proj * u_view * u_model * vec4(position, 1.0);

    v_position = position;
    v_gridSize = u_gridSize;
    v_gridPosition = a_pixel * u_gridSize;

    int index = int(v_gridPosition.x + v_gridPosition.y * v_gridSize.x);
    v_normal = normals.data[index].xyz;
}
