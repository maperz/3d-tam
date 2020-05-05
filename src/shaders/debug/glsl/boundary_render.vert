#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;

uniform mat4 u_mvp;
uniform mat4 u_scaling;

uniform vec3 u_boundarySize;
uniform vec3 u_boundaryCenter;

void main()
{
    vec3 position = (u_boundarySize * a_position * 0.5) + u_boundaryCenter;
    gl_Position = u_mvp  * u_scaling * vec4(position, 1.0);
}
