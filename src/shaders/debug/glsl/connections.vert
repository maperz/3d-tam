#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;
layout (std430, binding = 0) buffer Position3DBuffer { vec3 data[]; } positions;
layout (std430, binding = 1) buffer EdgesInfoBuffer { vec2 data[]; } edges;

uniform mat4 u_mvp;
uniform mat4 u_scaling;

uniform int u_selectedId;

out float v_isSelected;

void main()
{
    vec2 edge = edges.data[gl_InstanceID];

    int id = gl_VertexID == 0 ? int(edge.x) : int(edge.y);
    int otherId = gl_VertexID == 0 ? int(edge.y) : int(edge.x);

    v_isSelected = id == u_selectedId ? 1.0f : 0.0f;

    vec3 myPosition = positions.data[id];
    vec3 otherPosition = positions.data[otherId];
    vec3 dir = otherPosition - myPosition;
    vec3 pointPosition = myPosition + (normalize(dir) * 8.0);

    vec4 position = u_scaling * vec4(pointPosition, 1);
    gl_Position =  u_mvp * position;
}
