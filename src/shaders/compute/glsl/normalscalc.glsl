#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_heightmap;
layout(binding = 0, std430) writeonly buffer Normals { vec4 data[]; } normals;

uniform uvec2 u_size;
uniform uvec2 u_pixels;
uniform vec2 u_tileSize;

uniform float u_height;

vec3 get3d(vec2 tile) {
    vec2 imageCoord = tile * vec2(u_pixels) / vec2(u_size);
    float height = imageLoad(u_heightmap, ivec2(round(imageCoord))).r;
    height *= u_height;
    vec2 pos = tile * u_tileSize;
    return vec3(pos.x, height, pos.y);
}

void main() {

    uvec2 pos = gl_GlobalInvocationID.xy;
    vec2 tile = vec2(pos);

    if (pos.x < 0u || pos.x >= u_size.x
    || pos.y < 0u || pos.y >= u_size.y) {
        return;
    }

    vec3 center = get3d(tile);

    // Foreach Vertex
    vec3 normal = vec3(0);
    float count = 0.0;

    if(pos.x > 0u && pos.y > 0u) {
        vec3 left = get3d(tile - vec2(1, 0));
        vec3 bot = get3d(tile - vec2(0, 1));
        
        vec3 a = bot - center;
        vec3 b = left - center;
        normal += cross(a, b);
    }

    if(pos.x > 0u && pos.y < u_size.y - 1u) {
        vec3 left = get3d(tile - vec2(1, 0));
        vec3 top = get3d(tile + vec2(0, 1));
        
        vec3 a = left - center;
        vec3 b = top - center;
        normal += cross(a, b);
    }

    if( pos.x < u_size.x - 1u && pos.y < u_size.y - 1u) {
        vec3 right = get3d(tile + vec2(1, 0));
        vec3 top = get3d(tile + vec2(0, 1));

        vec3 a = top - center;
        vec3 b = right - center;
        normal += cross(a, b);
    }

    if( pos.x < u_size.x - 1u && pos.y > 0u) {
        vec3 right = get3d(tile + vec2(1, 0));
        vec3 bot = get3d(tile - vec2(0, 1));

        vec3 a = right - center;
        vec3 b = bot - center;
        normal += cross(a, b);
    }

    uint index = pos.x + pos.y * u_size.x;
    normals.data[index].xyz  = normalize(normal);
}
