#version 100
precision highp float;

attribute vec3 position;
attribute vec3 color;
attribute vec2 uvs;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

varying vec2 v_uv;
varying vec4 v_color;

uniform sampler2D heightmap;

void main() {

    v_uv = uvs;
    v_color = vec4(color, 1.0);
    vec4 hminfo = texture2D(heightmap, uvs);
    float height = (hminfo.r + hminfo.g + hminfo.b) / 3.0 * 2.0;
    vec3 modified_pos = vec3(position.x,  position.y + height, position.z);

    gl_Position = proj * view * model * vec4(modified_pos, 1.0);
}
