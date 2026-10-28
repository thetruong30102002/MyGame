"""Neutral two-handed overhead choreography reference; not game art."""
from PIL import Image,ImageDraw
from pathlib import Path
from math import sin,cos,pi
out=Path(__file__).parent
im=Image.new('RGBA',(144*12,144*5))
# Hilt height/depth then blade height/depth, one continuous overhead chop.
poses=[(32,18,-24,18),(40,16,5,35),(53,13,32,17),(66,4,37,-8),
       (78,-6,34,-16),(76,0,34,-12),(65,20,26,33),(42,27,-20,37),
       (26,28,-27,13),(26,23,-27,19),(30,20,-25,20),(32,18,-24,18)]
for row,angle in enumerate([0,pi/2,pi,pi/4,3*pi/4]):
    for phase,(hy,hz,by,bz) in enumerate(poses):
        tile=Image.new('RGBA',(144,144));d=ImageDraw.Draw(tile)
        lean=[0,-1,-2,-3,-3,-2,1,6,7,5,2,0][phase]
        crouch=[0,0,0,1,1,0,1,3,4,3,1,0][phase]
        def p(v):
            x,y,z=v
            return (72+x*cos(angle)+z*sin(angle),128-y+.23*(z*cos(angle)-x*sin(angle)))
        def line(a,b,c,w=4):d.line([p(a),p(b)],fill=c,width=w)
        def dot(v,r,c):
            x,y=p(v);d.ellipse((x-r,y-r,x+r,y+r),fill=c)
        white=(215,215,215,255)
        for side in [-1,1]:
            color=(245,177,85,255) if side==-1 else (103,190,255,255)
            hip=(side*5,28-crouch,lean/3);knee=(side*7,14-crouch,side*4+3);foot=(side*8,0,side*7)
            line(hip,knee,color,5);line(knee,foot,color,4);line(foot,(side*8,0,side*7+4),color,5)
        line((-9,45-crouch,lean),(9,45-crouch,lean),white,5)
        line((0,45-crouch,lean),(0,28-crouch,lean/3),white,9)
        dot((0,61-crouch,lean),12,(200,200,200,255))
        dot((0,61-crouch,lean+12),2,(60,60,60,255))
        # Arms surround the single hilt; no floating weapon or spare hand.
        for side in [-1,1]:
            color=(245,177,85,255) if side==-1 else (103,190,255,255)
            shoulder=(side*9,45-crouch,lean)
            elbow=(side*12,(45-crouch+hy)/2-3,(lean+hz)/2+7)
            hand=(side*2,hy+(2 if side==1 else -2),hz)
            line(shoulder,elbow,color,4);line(elbow,hand,color,4)
        # The complete rigid sword, hilt and blade use separate guide colours.
        hilt=(0,hy,hz);base=(0,hy+by*.12,hz+bz*.12);tip=(0,hy+by,hz+bz)
        line((0,hy-by*.2,hz-bz*.2),base,(171,113,45,255),3)
        line((-7,base[1],base[2]),(7,base[1],base[2]),(245,220,100,255),3)
        line(base,tip,(225,240,255,255),4)
        for side in [-1,1]:dot((side*2,hy+(2 if side==1 else -2),hz),2,(255,190,120,255))
        im.alpha_composite(tile,(phase*144,row*144))
im.save(out/'guide-chop-skeleton.png')
im.resize((3456,1440),Image.Resampling.NEAREST).save(out/'guide-chop-skeleton-2x.png')
