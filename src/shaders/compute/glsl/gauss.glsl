#version 310 es

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout(binding = 0, r32f) readonly highp uniform image2D u_input;
layout(binding = 1, r32f) writeonly highp uniform image2D u_output;
uniform ivec2 u_size;

float get(int x, int y) {
    if (x < 0 || y < 0 || x >= int(u_size.x) || y >= int(u_size.y)) {
        return 0.0f;
    }

    return imageLoad(u_input, ivec2(x, y)).r;
}

void main() {

    ivec2 pos = ivec2(gl_GlobalInvocationID.xy);
    
    int x = pos.x;
    int y = pos.y;

    float w0 = 0.25f, w1 = 0.125f, w2 = 0.0625f;
    float w = 0.0f, sum = 0.0f, a = 0.0f;
    float value_self = get(x, y);

    a = get(x-1, y-1); if(a > 0.0) { sum += a*w2; w += w2; } 
    a = get(x  , y-1); if(a > 0.0) { sum += a*w1; w += w1; }
    a = get(x+1, y-1); if(a > 0.0) { sum += a*w2; w += w2; }
    a = get(x-1,   y); if(a > 0.0) { sum += a*w1; w += w1; }
    a = get(x  ,   y); if(a > 0.0) { sum += a*w0; w += w0; }
    a = get(x+1,   y); if(a > 0.0) { sum += a*w1; w += w1; }
    a = get(x-1, y+1); if(a > 0.0) { sum += a*w2; w += w2; }
    a = get(x  , y+1); if(a > 0.0) { sum += a*w1; w += w1; }
    a = get(x+1, y+1); if(a > 0.0) { sum += a*w2; w += w2; }

    float output_value = value_self;

    if (w > 0.0)
    {
        output_value = sum / w;
    }

    imageStore(u_output, ivec2(pos), vec4(output_value));
}
