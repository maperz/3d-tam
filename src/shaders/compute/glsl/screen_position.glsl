#version 310 es
layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) readonly buffer Position3DBuffer { vec4 data[]; } positions;
layout (std430, binding = 1) writeonly buffer ScreenPositionBuffer { vec2 data[]; } screen;

uniform mat4 u_mvp;
uniform mat4 u_scaling;

uniform int u_count;
uniform vec2 u_screenSize;

void main()
{
    int id = int(gl_GlobalInvocationID.x);

    if(id >= u_count) {
        return;
    }

    vec4 position = u_scaling * vec4(positions.data[id].xyz, 1.0);
    vec4 screenPosition = u_mvp * position;

    vec3 normalized = screenPosition.xyz / screenPosition.w;
    screen.data[id] = ((normalized.xy + vec2(1.0)) / 2.0) * u_screenSize;
}
