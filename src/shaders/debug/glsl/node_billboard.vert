#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (std430, binding = 0) readonly buffer Position3DBuffer { vec4 data[]; } positions;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_scaling;

uniform float u_cubeSize;

uniform vec4 u_color;

uniform uint u_renderIds;
uniform int u_selectedId;

out vec2 v_uv;
out vec4 v_color;

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

    mat4 view = u_view * u_model;
    vec3 camRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 camUp = vec3(view[0][1], view[1][1], view[2][1]);
    vec3 alignedPos = camRight * a_position.x + camUp * a_position.y;

    vec3 position = alignedPos;

    position *= 0.03 * u_cubeSize;

    vec4 gridOffset = u_scaling * vec4(positions.data[id].xyz, 1.0);
    position += gridOffset.xyz;

    gl_Position = u_proj * u_view * u_model * vec4(position, 1.0);

    v_uv = (a_position + vec2(1.0)) / 2.0;
    float type = positions.data[id].w;

    if(u_renderIds > 0u) {
        v_color = colorFromId(id);
    }
    else if (u_selectedId >= 0 && u_selectedId == id) {
        v_color = vec4(1, 0, 1, 1);
    }
    else {
        v_color = type != 0.0 ? u_color : vec4(0.8, 0 , 0, 1);
    }
}
