#version 310 es

precision highp float;

layout(binding = 0, std430) readonly buffer Normals { vec3 data[]; } normals;

in float v_pixelvalue;
in vec2 v_gridPosition;
in vec3 v_position;
in vec2 v_gridSize;

out vec4 color;

uniform sampler2D u_colorRamp;
uniform int u_useLights;

vec3 getNormal(vec2 pos) {


    vec2 floored = floor(pos);
    vec2 reminder = pos - floored;
    int offset = reminder.y >= reminder.x ? 1 : 0;
    int triangleId = int(floored.x + floored.y * v_gridSize.x);

    return normals.data[triangleId * 2 + offset];
}

void main() {

    vec3 lightPos = vec3(0, 10, 0);

    vec3 normal = getNormal(v_gridPosition);
    vec3 lightDir = normalize(lightPos - v_position);Is

    float lightFactor = clamp(dot(normal, lightDir), 0.2, 1.0);

    lightFactor = u_useLights != 0 ? lightFactor : 1.0;

    color = texture(u_colorRamp, vec2(v_pixelvalue, 0)) * lightFactor;

}
