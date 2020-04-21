#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (location=1) in vec2 a_textureCoords;

out vec2 v_uv;

void main()
{
    gl_Position =  vec4(a_position.xy, 1, 1.0);
    v_uv = a_textureCoords;
}
