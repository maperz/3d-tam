#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;
layout (std430, binding = 0) buffer Position3DBuffer { vec3 data[]; } positions;

uniform mat4 u_mvp;
uniform mat4 u_scaling;

uniform int u_selectedId;

out float v_isSelected;

void main()
{
    int id = gl_VertexID;
    v_isSelected = id == u_selectedId ? 1.0f : 0.0f;

    vec4 position = u_scaling * vec4(positions.data[id], 1);
    gl_Position =  u_mvp * position;
}
