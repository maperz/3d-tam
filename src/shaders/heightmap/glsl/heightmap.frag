#version 310 es

precision highp float;

layout(binding = 0, std430) readonly buffer Normals { vec3 data[]; } normals;

in float v_pixelvalue;
in vec4 v_color;


in vec2 v_gridPosition;
in vec3 v_position;
in vec2 v_gridSize;

out vec4 color;


vec3 getNormal(vec2 pos) {

    vec2 floored = floor(pos);
    vec2 reminder = pos - floored;
    int offset = (reminder.x >= 0.5 || reminder.y >= 0.5) ? 1 : 0;
    int quadId = int(floored.x + floored.y * v_gridSize.x);

    return normals.data[quadId * 2 + offset];
}

void main() {

    vec3 lightPos = vec3(0, 10, 0);

    vec3 normal = getNormal(v_gridPosition);
    vec3 lightDir = normalize(lightPos - v_position);

    float light = clamp(dot(normal, lightDir), 0.0, 1.0);

    color = vec4(0, light, 0, 1);
    //color = v_color;


    //color = vec4(normal, 1.0);
}
