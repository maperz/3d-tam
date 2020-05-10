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

    vec2 offset = u_textureSize / 2.0;
    vec4 position = u_view * vec4(a_position.x, 0, a_position.y, 1.0);
    
    vec2 position2d = position.xz + offset;

    // Use value on z-axis to seperate overlapping lines
    gl_Position =  u_proj * vec4(position2d, v_value, 1);
    gl_PointSize = max(1.0f, u_radius);
}
