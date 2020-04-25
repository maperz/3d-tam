#version 310 es
layout (local_size_x = 16, local_size_y = 1, local_size_z = 1) in;

layout (std430, binding = 0) readonly buffer Position3DBuffer { vec4 data[]; } positions;
layout (std430, binding = 1) writeonly buffer ScreenPositionBuffer { vec2 data[]; } screen;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_area;

uniform float u_height;
uniform vec2 u_sizeMap;
uniform vec2 u_pixel;

uniform int u_count;
uniform vec2 u_screenSize;

void main()
{
    int id = int(gl_GlobalInvocationID.x);

    if(id >= u_count) {
        return;
    }

    vec2 factor = u_sizeMap / u_pixel;
    vec3 position = positions.data[id].xyz * vec3(factor.x, u_height, factor.y);
    vec4 screenPosition = u_proj * u_view * u_model * u_area * vec4(position, 1.0);

    vec3 normalized = screenPosition.xyz / screenPosition.w;
    screen.data[id] = ((normalized.xy + vec2(1.0)) / 2.0) * u_screenSize;
}
