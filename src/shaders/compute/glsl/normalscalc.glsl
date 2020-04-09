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


vec3 getNormal(vec2 center, vec2 offsetA, vec2 offsetB) {

    vec2 first = center + offsetA;
    vec2 second = center + offsetB;
    vec2 size = vec2(u_size);

    if (first.x < 0.0 || first.y < 0.0 || first.x >= size.x || first.y >= size.y 
    || second.x < 0.0 || second.y < 0.0 || second.x >= size.x || second.y >= size.y ) {
        return vec3(0.0);
    }

    return cross(get3d(first), get3d(second));
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
    normal += getNormal(tile, vec2(-1, 0), vec2(-1, 1));
    normal += getNormal(tile, vec2(-1, 1), vec2(0, 1));

    normal += getNormal(tile, vec2(0, 1), vec2(1, 1));
    normal += getNormal(tile, vec2(1, 1), vec2(1, 0));

    normal += getNormal(tile, vec2(1, 0), vec2(1, -1));
    normal += getNormal(tile, vec2(1, -1), vec2(0, -1));

    normal += getNormal(tile, vec2(0, -1), vec2(-1, -1));
    normal += getNormal(tile, vec2(-1, -1), vec2(-1, 0));

    uint index = pos.x + pos.y * u_size.x;
    normals.data[index].xyz  = normalize(normal);
}
