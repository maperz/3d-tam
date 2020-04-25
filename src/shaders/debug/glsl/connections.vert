#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;
layout (std430, binding = 0) buffer ConnectionsBuffer { ivec2 ids[]; } connections;
layout (std430, binding = 1) buffer Position3DBuffer { vec3 data[]; } positions;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_area;

uniform float u_height;
uniform vec2 u_size;
uniform vec2 u_pixel;

uniform int u_selectedId;

out float v_isSelected;

void main()
{
    int id = gl_VertexID;
    v_isSelected = id == u_selectedId ? 1.0f : 0.0f;

    vec2 factor = u_size / u_pixel;
    vec3 position = positions.data[id] * vec3(factor.x, u_height, factor.y);
    gl_Position = u_proj * u_view * u_model * u_area * vec4(position, 1.0);
}
