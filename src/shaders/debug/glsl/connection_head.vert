#version 310 es
precision highp float;

layout (location=0) in vec2 a_position;
layout (std430, binding = 0) buffer Position3DBuffer { vec3 data[]; } positions;
layout (std430, binding = 1) buffer EdgesInfoBuffer { vec2 data[]; } edges;
layout (std430, binding = 2) buffer FamilyInfoBuffer { vec2 data[]; } familyInfo;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_scaling;

uniform int u_selectedId;
uniform float u_cubeSize;
uniform vec4 u_color;

out float v_isSelected;
out vec2 v_uv;
out vec3 v_color;
out float v_shouldDrop;


void main()
{
    vec2 edge = edges.data[gl_InstanceID];

    ivec2 ids = ivec2(edge);
    v_isSelected = ids.x == u_selectedId  || ids.y == u_selectedId ? 1.0f : 0.0f;

    int childId = ids.x;
    int famId = ids.y;

    if (int(familyInfo.data[ids.x].x) == ids.y) {
        childId = ids.x;
        famId = ids.y;
    }
    else if (int(familyInfo.data[ids.y].x) == ids.x) {
        childId = ids.y;
        famId = ids.x;
    }
    else {
        v_shouldDrop = 1.0;
        return;
    }

    vec3 childPosition = positions.data[childId];
    vec3 famPosition = positions.data[famId];

    vec3 dir = childPosition - famPosition;
    vec3 headPosition = famPosition + (normalize(dir) * 8.0);

    vec4 worldOffset = u_scaling * vec4(headPosition, 1);

    // Do billboarding
    mat4 view = u_view * u_model;
    vec3 camRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 camUp = vec3(view[0][1], view[1][1], view[2][1]);
    vec3 alignedPos = camRight * a_position.x + camUp * a_position.y;

    vec3 position = alignedPos;

    position *= 0.01 * u_cubeSize;

    position += worldOffset.xyz;

    v_uv = (a_position + vec2(1.0)) / 2.0;

    gl_Position = u_mvp * vec4(position, 1.0);

    v_color =  v_isSelected != 0.0 ? vec3(1, 0, 1) : u_color.xyz;

    v_shouldDrop = 0.0;

}
