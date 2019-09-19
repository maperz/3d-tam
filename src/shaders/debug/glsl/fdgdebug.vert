#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;

uniform mat4 u_proj;

uniform float u_size;

uniform vec4 u_color;

out vec4 v_color;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;

void main()
{
    int id = gl_InstanceID;

    vec2 position = a_position.xy;

    vec2 cur = positions.data[id];

    position *= u_size / 2.0;
    position += cur;

    gl_Position = u_proj * vec4(position, 0.0 , 1.0);

    v_color = u_color;
}
