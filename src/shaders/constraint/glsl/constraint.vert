#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (location=1) in float a_value;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform float u_radius;
uniform vec2 u_textureSize;

out float v_value;

void main()
{
    v_value = a_value;
    vec2 position = (u_textureSize / 2.0) + a_position;

    vec4 normalizedSpace = (u_proj * vec4(position, 0, 1)).xzyw;
    gl_Position =  (u_view * normalizedSpace).xzyw;
    gl_PointSize = max(1.0f, u_radius);
}
