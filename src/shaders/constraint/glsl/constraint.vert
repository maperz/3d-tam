#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (location=1) in float a_value;

uniform mat4 u_proj;
uniform float u_radius;

out float v_value;

void main()
{
    v_value = a_value;
    gl_Position = u_proj * vec4(a_position, 0, 1);
    gl_PointSize = max(1.0f, u_radius);
}
