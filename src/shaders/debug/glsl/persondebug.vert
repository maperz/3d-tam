#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

uniform vec2 u_scale;
uniform float u_height;
uniform vec2 u_sizeMap;

uniform vec4 u_color;

out vec4 v_color;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer ValueBuffer { float data[]; } values;

void main()
{
    int id = gl_InstanceID;

    vec3 position = a_position;

    position *= 0.03;

    vec2 currentGridPos = positions.data[id];
    currentGridPos *= u_scale;

    currentGridPos -= u_sizeMap / 2.0;

    float currentHeight =  values.data[id] * log((1.0+u_height));

    position += vec3(currentGridPos.x, currentHeight, currentGridPos.y);
    gl_Position = u_proj *  u_view * u_model * vec4(position, 1.0);

    v_color = u_color;
}
