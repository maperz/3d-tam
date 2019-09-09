#version 310 es
precision highp float;

layout (location=0) in vec3 a_position;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

uniform float u_size;

uniform vec4 u_color;

out vec4 v_color;

struct ConnectionInfo {
    int first;
    int second;
};

layout (std430, binding = 0) buffer PositionBuffer { vec2 data[]; } positions;
layout (std430, binding = 1) buffer ConnectionBuffer { ConnectionInfo infos[]; } connections;

void main()
{
    int id = gl_InstanceID;
    ConnectionInfo connection = connections.infos[id];
    vec2 first = positions.data[connection.first];
    vec2 second = positions.data[connection.second];

    vec2 center = (first + second) / 2.0;

    vec2 position = a_position.xy;
    // Divide size by 2 since quad has a width of 2
    position.y *= u_size / 2.0;


    // 1) Scale by half of distance AB in both dir
    float scale = distance(first, center);
    position.x *= scale;

    // 2) Rotate so to face direction AB
    vec2 dir = normalize(first - second);
    // Sinus and Cosinus since we are dealing with a unit vector
    float sinus = dir.y;
    float cosinus = dir.x;

    vec2 rotated = vec2(position.x * cosinus - position.y * sinus,
                        position.x * sinus + position.y * cosinus);

    position = rotated;

    // 3) Translate to center
    position += center;

    // Ensure that lines are behind nodes
    gl_Position = u_proj * vec4(position, -1.0, 1.0);

    v_color = u_color;
}
