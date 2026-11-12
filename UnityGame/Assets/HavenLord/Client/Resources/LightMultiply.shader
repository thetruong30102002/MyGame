// Bản đồ ánh sáng 2D (Lighting.cs, 06/11/2026): NHÂN màu bản đồ sáng lên cảnh đã vẽ — chỗ tối giữ màu / tương phản nhưng sậm theo
// màu trời (xanh tím đêm, cam hồng hoàng hôn, đen lạnh trong hang), chỗ đèn chiếu sáng ấm. `_Strength` = độ mạnh (0 = không đổi gì).
Shader "Haven Lord/LightMultiply"
{
    Properties
    {
        _MainTex ("Light map", 2D) = "white" {}
        _Strength ("Strength", Range(0, 1)) = 1
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" }
        Cull Off ZWrite Off ZTest Always
        Blend DstColor Zero
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            float _Strength;
            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f { float4 pos : SV_POSITION; float2 uv : TEXCOORD0; };
            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 l = tex2D(_MainTex, i.uv);
                return lerp(fixed4(1, 1, 1, 1), fixed4(l.rgb, 1), _Strength);
            }
            ENDCG
        }
    }
}
