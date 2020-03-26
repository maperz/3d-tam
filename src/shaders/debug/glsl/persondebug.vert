#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

uniform vec2 u_scale;
uniform float u_height;
uniform vec2 u_sizeMap;
uniform float u_cubeSize;

uniform vec4 u_color;

uniform uint u_renderIds;
uniform int u_selectedId;

out vec4 v_color;

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer ValueBuffer { float data[]; } values;


vec4 colorFromId(int id) {
    int i = id + 1;
    int r = i & 0xFF;
    int g = (i >> 8) & 0xFF;
    int b = (i >> 16) & 0xFF;
    int a = (i >> 24) & 0xFF;
    return vec4(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0, float(a) / 255.0);
}

void main()
{
    int id = gl_InstanceID;

    vec3 position = a_position;

    position *= 0.03 * u_cubeSize;

    vec2 currentGridPos = positions.data[id];
    currentGridPos *= u_scale;

    currentGridPos -= u_sizeMap / 2.0;

    float currentHeight =  values.data[id] * u_height;

    position += vec3(currentGridPos.x, currentHeight, currentGridPos.y);
    gl_Position = u_proj *  u_view * u_model * vec4(position, 1.0);

    if(u_renderIds > 0u) {
        v_color = colorFromId(id);
    }
    else if (u_selectedId >= 0 && u_selectedId == id) {
        v_color = vec4(1, 0, 1, 1);
    }
    else {
        v_color = u_color;
    }

}
