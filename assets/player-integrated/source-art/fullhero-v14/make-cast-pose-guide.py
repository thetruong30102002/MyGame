"""Neutral one-staff casting choreography; guide only, never runtime art."""
from PIL import Image,ImageDraw
from pathlib import Path
from math import sin,cos,pi
out=Path(__file__).parent;im=Image.new('RGBA',(144*12,144*5))
poses=[(40,12,45,0,30,10),(41,12,45,0,36,14),(43,13,44,2,44,18),
       (46,15,43,5,54,20),(49,17,42,8,62,25),(49,20,40,12,64,32),
       (46,26,36,21,55,40),(42,28,33,25,46,40),(41,26,36,20,41,32),
       (41,20,40,12,36,22),(40,15,44,4,32,15),(40,12,45,0,30,10)]
for row,angle in enumerate([0,pi/2,pi,pi/4,3*pi/4]):
    for phase,(hy,hz,vy,vz,fy,fz) in enumerate(poses):
        tile=Image.new('RGBA',(144,144));d=ImageDraw.Draw(tile)
        lean=([0,0,-1,-2,-2,-1,4,5,3,1,0,0][phase]);crouch=2 if phase in [6,7,8] else 0
        def p(v):
            x,y,z=v;return (72+x*cos(angle)+z*sin(angle),128-y+.23*(z*cos(angle)-x*sin(angle)))
        def line(a,b,c,w=4):d.line([p(a),p(b)],fill=c,width=w)
        def dot(v,r,c):
            x,y=p(v);d.ellipse((x-r,y-r,x+r,y+r),fill=c)
        for side in [-1,1]:
            color=(245,177,85,255) if side==-1 else (103,190,255,255)
            hip=(side*5,28-crouch,lean/3);knee=(side*6,14-crouch,side*4+2);foot=(side*7,0,side*5)
            line(hip,knee,color,5);line(knee,foot,color,4);line(foot,(side*7,0,side*5+4),color,5)
        line((-9,45-crouch,lean),(9,45-crouch,lean),(215,215,215,255),5)
        line((0,45-crouch,lean),(0,28-crouch,lean/3),(215,215,215,255),9)
        dot((0,61-crouch,lean),12,(200,200,200,255));dot((0,61-crouch,lean+12),2,(60,60,60,255))
        # Anatomical right hand keeps exactly one rigid staff through every phase.
        hand=(-13,hy,hz);elbow=(-16,(45+hy)/2-6,(lean+hz)/2)
        line((-9,45-crouch,lean),elbow,(245,177,85,255),4);line(elbow,hand,(245,177,85,255),4)
        free=(12,fy,fz);felbow=(18,(45+fy)/2-5,(lean+fz)/2)
        line((9,45-crouch,lean),felbow,(103,190,255,255),4);line(felbow,free,(103,190,255,255),4)
        bottom=(-13,hy-vy*.9,hz-vz*.9);top=(-13,hy+vy,hz+vz)
        line(bottom,top,(177,116,54,255),3);dot(top,5,(98,206,255,255));dot(hand,3,(255,190,120,255));dot(free,3,(103,190,255,255))
        im.alpha_composite(tile,(phase*144,row*144))
im.save(out/'guide-cast-skeleton.png');im.resize((3456,1440),Image.Resampling.NEAREST).save(out/'guide-cast-skeleton-2x.png')
