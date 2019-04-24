#version 100
precision highp float;

varying vec2 v_uv;

uniform sampler2D heightmap;

void main() {
    gl_FragColor = texture2D(heightmap, v_uv);
}
