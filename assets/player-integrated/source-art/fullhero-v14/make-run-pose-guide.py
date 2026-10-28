"""Neutral motion reference only. These stick figures are never game art."""
from PIL import Image, ImageDraw
from pathlib import Path
from math import sin,cos,pi,sqrt

out=Path(__file__).parent
im=Image.new('RGBA',(144*8,144*5))
feet=[(14,0),(3,0),(-11,0),(-16,5),(-6,14),(7,17),(16,9),(18,2)]
for row,angle in enumerate([0,pi/2,pi,pi/4,3*pi/4]):
    for phase in range(8):
        tile=Image.new('RGBA',(144,144)); d=ImageDraw.Draw(tile)
        bob=[0,-1,1,3,0,-1,1,3][phase]
        def p(v):
            x,y,z=v
            return (72+x*cos(angle)+z*sin(angle),128-y+.23*(z*cos(angle)-x*sin(angle)))
        def line(a,b,c,w=4): d.line([p(a),p(b)],fill=c,width=w)
        def dot(v,r,c):
            x,y=p(v);d.ellipse((x-r,y-r,x+r,y+r),fill=c)
        # Far limb first; colours identify anatomical legs throughout the cycle.
        for side in sorted([-1,1],key=lambda s:s*sin(angle),reverse=True):
            fp=(phase+(4 if side==1 else 0))%8
            z,h=feet[fp];hip=(side*5,28+bob,2)
            foot=(side*5,h,z)
            dz=z-2;dy=h-28-bob;dist=sqrt(dz*dz+dy*dy)
            bend=sqrt(max(0,17*17-(dist/2)**2))
            knee=(side*5,(hip[1]+h)/2+dz/dist*bend,(2+z)/2-dy/dist*bend)
            color=(245,177,85,255) if side==-1 else (103,190,255,255)
            line(hip,knee,color,5);line(knee,foot,color,4)
            dot(knee,2,(255,255,255,255));line(foot,(side*5,h,z+5),color,5)
            shoulder=(side*9,45+bob,7)
            elbow=(side*11,34+bob,7-z*.40)
            hand=(side*10,39+bob,13-z*.55)
            line(shoulder,elbow,color,4);line(elbow,hand,color,4);dot(hand,2,color)
        line((-9,45+bob,7),(9,45+bob,7),(215,215,215,255),5)
        line((0,45+bob,7),(0,28+bob,2),(215,215,215,255),9)
        line((-5,28+bob,2),(5,28+bob,2),(215,215,215,255),5)
        dot((0,61+bob,9),12,(200,200,200,255))
        # Eye/nose marker shows facing, no costume/hair to contaminate style.
        dot((0,61+bob,21),2,(70,70,70,255))
        im.alpha_composite(tile,(phase*144,row*144))
im.save(out/'guide-run-skeleton.png')
im.resize((2304,1440),Image.Resampling.NEAREST).save(out/'guide-run-skeleton-2x.png')
