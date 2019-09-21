#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_heightmap;
layout(binding = 0, std430) writeonly buffer Normals { vec3 data[]; } normals;

uniform uvec2 u_size;
uniform uvec2 u_pixels;
uniform vec2 u_tileSize;

uniform float u_height;

vec3 get3d(vec2 position, vec2 factor) {
    vec2 uv = position * factor;
    vec2 pos = position * u_tileSize;
    float height = imageLoad(u_heightmap, ivec2(uv)).r;
    height *= log(1.0+u_height);
    return vec3(pos.x, height, pos.y);
}

void main() {

    uvec2 pos = gl_GlobalInvocationID.xy;
    uint index = pos.x + pos.y * u_size.x;

    if (pos.x < 0u || pos.x >= u_size.x
    || pos.y < 0u || pos.y >= u_size.y) {
        return;
    }

    // Foreach Quad this is executed once
    // a---b
    // | / |
    // c---d

    vec2 a = vec2(pos);
    vec2 b =  a + vec2(1.0, 0.0);
    vec2 c =  a + vec2(0.0, 1.0);
    vec2 d =  a + vec2(1.0, 1.0);

    // Calculate positions in 3D
    vec2 factor = vec2(u_pixels) / vec2(u_size);

    vec3 a_3d = get3d(a, factor);
    vec3 b_3d = get3d(b, factor);
    vec3 c_3d = get3d(c, factor);
    vec3 d_3d = get3d(d, factor);

    // Calculate both normals for quad

    vec3 norm_abc = normalize(cross(a_3d - b_3d, c_3d - a_3d));
    vec3 norm_bcd = normalize(cross(b_3d - d_3d, c_3d - b_3d));

    // Store them in normals buffer

    normals.data[index * 2u] = norm_abc;
    normals.data[index * 2u + 1u]  = norm_bcd;
}
