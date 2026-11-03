var vt=Object.defineProperty;var Lt=(_,t,e)=>t in _?vt(_,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):_[t]=e;var h=(_,t,e)=>Lt(_,typeof t!="symbol"?t+"":t,e);class ${constructor(t=0,e=0){h(this,"x");h(this,"y");this.x=t,this.y=e}set(t,e){return this.x=t,this.y=e,this}copy(t){return this.x=t.x,this.y=t.y,this}clone(){return new $(this.x,this.y)}add(t){return this.x+=t.x,this.y+=t.y,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.lengthSq())}normalize(){const t=this.length();return t>0&&this.multiplyScalar(1/t),this}}class J{constructor(t=0,e=0,i=0,s=1){h(this,"x");h(this,"y");h(this,"z");h(this,"w");h(this,"onChangeCallback",null);this.x=t,this.y=e,this.z=i,this.w=s}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this.onChangeCallback&&this.onChangeCallback(),this}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w,this.onChangeCallback&&this.onChangeCallback(),this}clone(){return new J(this.x,this.y,this.z,this.w)}identity(){return this.set(0,0,0,1)}setFromEuler(t){const e=Math.cos(t.x/2),i=Math.cos(t.y/2),s=Math.cos(t.z/2),n=Math.sin(t.x/2),r=Math.sin(t.y/2),a=Math.sin(t.z/2);return this.x=n*i*s+e*r*a,this.y=e*r*s-n*i*a,this.z=e*i*a+n*r*s,this.w=e*i*s-n*r*a,this.onChangeCallback&&this.onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,s=Math.sin(i);return this.x=t.x*s,this.y=t.y*s,this.z=t.z*s,this.w=Math.cos(i),this.onChangeCallback&&this.onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.x*e.x+t.y*e.y+t.z*e.z+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?this.set(-t.y,t.x,0,i):this.set(0,-t.z,t.y,i)):this.set(t.y*e.z-t.z*e.y,t.z*e.x-t.x*e.z,t.x*e.y-t.y*e.x,i),this.normalize()}multiplyQuaternions(t,e){const i=t.x,s=t.y,n=t.z,r=t.w,a=e.x,l=e.y,o=e.z,u=e.w;return this.x=i*u+r*a+s*o-n*l,this.y=s*u+r*l+n*a-i*o,this.z=n*u+r*o+i*l-s*a,this.w=r*u-i*a-s*l-n*o,this.onChangeCallback&&this.onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this.x,s=this.y,n=this.z,r=this.w;let a=r*t.w+i*t.x+s*t.y+n*t.z;if(a<0?(this.w=-t.w,this.x=-t.x,this.y=-t.y,this.z=-t.z,a=-a):this.copy(t),a>=1)return this.w=r,this.x=i,this.y=s,this.z=n,this;const l=1-a*a;if(l<=Number.EPSILON){const c=1-e;return this.w=c*r+e*this.w,this.x=c*i+e*this.x,this.y=c*s+e*this.y,this.z=c*n+e*this.z,this.normalize(),this}const o=Math.sqrt(l),u=Math.atan2(o,a),f=Math.sin((1-e)*u)/o,d=Math.sin(e*u)/o;return this.w=r*f+this.w*d,this.x=i*f+this.x*d,this.y=s*f+this.y*d,this.z=n*f+this.z*d,this.onChangeCallback&&this.onChangeCallback(),this}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.lengthSq())}setFromRotationMatrix(t){const e=t.elements,i=e[0],s=e[4],n=e[8],r=e[1],a=e[5],l=e[9],o=e[2],u=e[6],f=e[10],d=i+a+f;if(d>0){const c=.5/Math.sqrt(d+1);this.w=.25/c,this.x=(u-l)*c,this.y=(n-o)*c,this.z=(r-s)*c}else if(i>a&&i>f){const c=2*Math.sqrt(1+i-a-f);this.w=(u-l)/c,this.x=.25*c,this.y=(s+r)/c,this.z=(n+o)/c}else if(a>f){const c=2*Math.sqrt(1+a-i-f);this.w=(n-o)/c,this.x=(s+r)/c,this.y=.25*c,this.z=(l+u)/c}else{const c=2*Math.sqrt(1+f-i-a);this.w=(r-s)/c,this.x=(n+o)/c,this.y=(l+u)/c,this.z=.25*c}return this.onChangeCallback&&this.onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this.onChangeCallback&&this.onChangeCallback(),this}conjugate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.onChangeCallback&&this.onChangeCallback(),this}invert(){return this.conjugate()}normalize(){let t=this.length();return t===0?(this.x=0,this.y=0,this.z=0,this.w=1):(t=1/t,this.x*=t,this.y*=t,this.z*=t,this.w*=t),this.onChangeCallback&&this.onChangeCallback(),this}}class w{constructor(t=0,e=0,i=0){h(this,"x");h(this,"y");h(this,"z");this.x=t,this.y=e,this.z=i}set(t,e,i){return this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}clone(){return new w(this.x,this.y,this.z)}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}subScaledVector(t,e){return this.x-=t.x*e,this.y-=t.y*e,this.z-=t.z*e,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}divideScalar(t){return this.multiplyScalar(1/t)}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}crossVectors(t,e){const i=t.x,s=t.y,n=t.z,r=e.x,a=e.y,l=e.z;return this.x=s*l-n*a,this.y=n*r-i*l,this.z=i*a-s*r,this}cross(t){return this.crossVectors(this,t)}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.lengthSq())}normalize(){const t=this.length();return t>0?this.multiplyScalar(1/t):this}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}applyMatrix4(t){const e=this.x,i=this.y,s=this.z,n=t.elements,r=1/(n[3]*e+n[7]*i+n[11]*s+n[15]);return this.x=(n[0]*e+n[4]*i+n[8]*s+n[12])*r,this.y=(n[1]*e+n[5]*i+n[9]*s+n[13])*r,this.z=(n[2]*e+n[6]*i+n[10]*s+n[14])*r,this}transformDirection(t){const e=this.x,i=this.y,s=this.z,n=t.elements;return this.x=n[0]*e+n[4]*i+n[8]*s,this.y=n[1]*e+n[5]*i+n[9]*s,this.z=n[2]*e+n[6]*i+n[10]*s,this.normalize()}applyQuaternion(t){const e=this.x,i=this.y,s=this.z,n=t.x,r=t.y,a=t.z,l=t.w,o=l*e+r*s-a*i,u=l*i+a*e-n*s,f=l*s+n*i-r*e,d=-n*e-r*i-a*s;return this.x=o*l+d*-n+u*-a-f*-r,this.y=u*l+d*-r+f*-n-o*-a,this.z=f*l+d*-a+o*-r-u*-n,this}applyEuler(t){const e=new J().setFromEuler(t);return this.applyQuaternion(e)}toArray(){return[this.x,this.y,this.z]}equals(t){return this.x===t.x&&this.y===t.y&&this.z===t.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}}class q{static getStatus(){if(this._status)return this._status;const t=typeof WebAssembly<"u"&&typeof WebAssembly.validate=="function";let e=!1;if(t)try{const s=new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,22,1,20,0,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11]);e=WebAssembly.validate(s)}catch{e=!1}const i=e?"wasm-simd":t?"wasm-scalar":"js-unrolled";return this._status={hasWebAssembly:t,hasSIMD:e,backend:i},this._status}static batchMultiplyMatrix4(t,e,i,s){const n=e.length===16&&s>1,r=i.length===16&&s>1;for(let a=0;a<s;a++){const l=a*16,o=n?0:a*16,u=r?0:a*16,f=e[o],d=e[o+1],c=e[o+2],x=e[o+3],y=e[o+4],S=e[o+5],g=e[o+6],m=e[o+7],E=e[o+8],C=e[o+9],b=e[o+10],v=e[o+11],L=e[o+12],T=e[o+13],p=e[o+14],M=e[o+15],A=i[u],I=i[u+1],O=i[u+2],P=i[u+3],N=i[u+4],z=i[u+5],D=i[u+6],R=i[u+7],B=i[u+8],U=i[u+9],k=i[u+10],X=i[u+11],H=i[u+12],V=i[u+13],j=i[u+14],K=i[u+15];t[l]=f*A+y*I+E*O+L*P,t[l+1]=d*A+S*I+C*O+T*P,t[l+2]=c*A+g*I+b*O+p*P,t[l+3]=x*A+m*I+v*O+M*P,t[l+4]=f*N+y*z+E*D+L*R,t[l+5]=d*N+S*z+C*D+T*R,t[l+6]=c*N+g*z+b*D+p*R,t[l+7]=x*N+m*z+v*D+M*R,t[l+8]=f*B+y*U+E*k+L*X,t[l+9]=d*B+S*U+C*k+T*X,t[l+10]=c*B+g*U+b*k+p*X,t[l+11]=x*B+m*U+v*k+M*X,t[l+12]=f*H+y*V+E*j+L*K,t[l+13]=d*H+S*V+C*j+T*K,t[l+14]=c*H+g*V+b*j+p*K,t[l+15]=x*H+m*V+v*j+M*K}}static batchFrustumCullAABB(t,e,i,s){const n=e[0],r=e[1],a=e[2],l=e[3],o=e[4],u=e[5],f=e[6],d=e[7],c=e[8],x=e[9],y=e[10],S=e[11],g=e[12],m=e[13],E=e[14],C=e[15],b=e[16],v=e[17],L=e[18],T=e[19],p=e[20],M=e[21],A=e[22],I=e[23];let O=0;for(let P=0;P<i;P++){const N=P*6,z=t[N],D=t[N+1],R=t[N+2],B=t[N+3],U=t[N+4],k=t[N+5],X=n>=0?B:z,H=r>=0?U:D,V=a>=0?k:R;if(n*X+r*H+a*V+l<0){s[P]=0;continue}const j=o>=0?B:z,K=u>=0?U:D,lt=f>=0?k:R;if(o*j+u*K+f*lt+d<0){s[P]=0;continue}const ct=c>=0?B:z,ut=x>=0?U:D,ft=y>=0?k:R;if(c*ct+x*ut+y*ft+S<0){s[P]=0;continue}const dt=g>=0?B:z,mt=m>=0?U:D,pt=E>=0?k:R;if(g*dt+m*mt+E*pt+C<0){s[P]=0;continue}const gt=b>=0?B:z,xt=v>=0?U:D,yt=L>=0?k:R;if(b*gt+v*xt+L*yt+T<0){s[P]=0;continue}const St=p>=0?B:z,Mt=M>=0?U:D,Et=A>=0?k:R;if(p*St+M*Mt+A*Et+I<0){s[P]=0;continue}s[P]=1,O++}return O}}h(q,"_status",null),h(q,"_wasmInstance",null),h(q,"_wasmMemory",null);class G{constructor(){h(this,"elements");this.elements=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}set(t,e,i,s,n,r,a,l,o,u,f,d,c,x,y,S){const g=this.elements;return g[0]=t,g[4]=e,g[8]=i,g[12]=s,g[1]=n,g[5]=r,g[9]=a,g[13]=l,g[2]=o,g[6]=u,g[10]=f,g[14]=d,g[3]=c,g[7]=x,g[11]=y,g[15]=S,this}makeTranslation(t,e,i){return this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1)}setPosition(t,e,i){const s=this.elements;return t instanceof w?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e??0,s[14]=i??0),this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)}copy(t){const e=t.elements,i=this.elements;for(let s=0;s<16;s++)i[s]=e[s];return this}clone(){return new G().copy(this)}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,s=e.elements,n=this.elements,r=i[0],a=i[4],l=i[8],o=i[12],u=i[1],f=i[5],d=i[9],c=i[13],x=i[2],y=i[6],S=i[10],g=i[14],m=i[3],E=i[7],C=i[11],b=i[15],v=s[0],L=s[4],T=s[8],p=s[12],M=s[1],A=s[5],I=s[9],O=s[13],P=s[2],N=s[6],z=s[10],D=s[14],R=s[3],B=s[7],U=s[11],k=s[15];return n[0]=r*v+a*M+l*P+o*R,n[4]=r*L+a*A+l*N+o*B,n[8]=r*T+a*I+l*z+o*U,n[12]=r*p+a*O+l*D+o*k,n[1]=u*v+f*M+d*P+c*R,n[5]=u*L+f*A+d*N+c*B,n[9]=u*T+f*I+d*z+c*U,n[13]=u*p+f*O+d*D+c*k,n[2]=x*v+y*M+S*P+g*R,n[6]=x*L+y*A+S*N+g*B,n[10]=x*T+y*I+S*z+g*U,n[14]=x*p+y*O+S*D+g*k,n[3]=m*v+E*M+C*P+b*R,n[7]=m*L+E*A+C*N+b*B,n[11]=m*T+E*I+C*z+b*U,n[15]=m*p+E*O+C*D+b*k,this}compose(t,e,i){const s=this.elements,n=e.x,r=e.y,a=e.z,l=e.w,o=n+n,u=r+r,f=a+a,d=n*o,c=n*u,x=n*f,y=r*u,S=r*f,g=a*f,m=l*o,E=l*u,C=l*f,b=i.x,v=i.y,L=i.z;return s[0]=(1-(y+g))*b,s[1]=(c+C)*b,s[2]=(x-E)*b,s[3]=0,s[4]=(c-C)*v,s[5]=(1-(d+g))*v,s[6]=(S+m)*v,s[7]=0,s[8]=(x+E)*L,s[9]=(S-m)*L,s[10]=(1-(d+y))*L,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}makePerspective(t,e,i,s){const n=i*Math.tan(t*Math.PI/360),r=-n,a=r*e,l=n*e,o=2*i/(l-a),u=2*i/(n-r),f=(l+a)/(l-a),d=(n+r)/(n-r),c=-(s+i)/(s-i),x=-(2*s*i)/(s-i),y=this.elements;return y[0]=o,y[4]=0,y[8]=f,y[12]=0,y[1]=0,y[5]=u,y[9]=d,y[13]=0,y[2]=0,y[6]=0,y[10]=c,y[14]=x,y[3]=0,y[7]=0,y[11]=-1,y[15]=0,this}makeOrthographic(t,e,i,s,n,r){const a=1/(e-t),l=1/(i-s),o=1/(r-n),u=(e+t)*a,f=(i+s)*l,d=(r+n)*o,c=this.elements;return c[0]=2*a,c[4]=0,c[8]=0,c[12]=-u,c[1]=0,c[5]=2*l,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=-2*o,c[14]=-d,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}lookAt(t,e,i){const s=new w().subVectors(t,e).normalize();s.lengthSq()===0&&(s.z=1);const n=new w().crossVectors(i,s).normalize();n.lengthSq()===0&&(s.x+=1e-4,n.crossVectors(i,s).normalize());const r=new w().crossVectors(s,n),a=this.elements;return a[0]=n.x,a[4]=r.x,a[8]=s.x,a[12]=t.x,a[1]=n.y,a[5]=r.y,a[9]=s.y,a[13]=t.y,a[2]=n.z,a[6]=r.z,a[10]=s.z,a[14]=t.z,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}invert(){const t=this.elements,e=t[0],i=t[4],s=t[8],n=t[12],r=t[1],a=t[5],l=t[9],o=t[13],u=t[2],f=t[6],d=t[10],c=t[14],x=t[3],y=t[7],S=t[11],g=t[15],m=l*c*y-o*d*y+o*f*S-a*c*S-l*f*g+a*d*g,E=n*d*y-s*c*y-n*f*S+i*c*S+s*f*g-i*d*g,C=s*o*y-n*l*y+n*a*S-i*o*S-s*a*g+i*l*g,b=n*l*f-s*o*f-n*a*d+i*o*d+s*a*c-i*l*c,v=e*m+r*E+u*C+x*b;if(v===0)return this.identity();const L=1/v;return t[0]=m*L,t[1]=(o*d*x-l*c*x-o*u*S+r*c*S+l*u*g-r*d*g)*L,t[2]=(a*c*x-o*f*x+o*u*y-r*c*y-a*u*g+r*f*g)*L,t[3]=(l*f*x-a*d*x-l*u*y+r*d*y+a*u*S-r*f*S)*L,t[4]=E*L,t[5]=(s*c*x-n*d*x+n*u*S-e*c*S-s*u*g+e*d*g)*L,t[6]=(n*f*x-i*c*x-n*u*y+e*c*y+i*u*g-e*f*g)*L,t[7]=(i*d*x-s*f*x+s*u*y-e*d*y-i*u*S+e*f*S)*L,t[8]=C*L,t[9]=(n*l*x-s*o*x-n*r*S+e*o*S+s*r*g-e*l*g)*L,t[10]=(i*o*x-n*a*x+n*r*y-e*o*y-i*r*g+e*a*g)*L,t[11]=(s*a*x-i*l*x-s*r*y+e*l*y+i*r*S-e*a*S)*L,t[12]=b*L,t[13]=(s*o*u-n*l*u+n*r*d-e*o*d-s*r*c+e*l*c)*L,t[14]=(n*a*u-i*o*u-n*r*f+e*o*f+i*r*c-e*a*c)*L,t[15]=(i*l*u-s*a*u+s*r*f-e*l*f-i*r*d+e*a*d)*L,this}determinant(){const t=this.elements,e=t[0],i=t[4],s=t[8],n=t[12],r=t[1],a=t[5],l=t[9],o=t[13],u=t[2],f=t[6],d=t[10],c=t[14],x=t[3],y=t[7],S=t[11],g=t[15];return x*(+n*l*f-s*o*f-n*a*d+i*o*d+s*a*c-i*l*c)+y*(+e*l*c-e*o*d+n*r*d-s*r*c+s*o*u-n*l*u)+S*(+e*o*f-e*a*c-n*r*f+i*r*c+n*a*u-i*o*u)+g*(-s*a*u-e*l*f+e*a*d+s*r*f-i*r*d+i*l*u)}decompose(t,e,i){const s=this.elements;let n=Math.hypot(s[0],s[1],s[2]);const r=Math.hypot(s[4],s[5],s[6]),a=Math.hypot(s[8],s[9],s[10]);this.determinant()<0&&(n=-n),t.x=s[12],t.y=s[13],t.z=s[14];const o=1/(n||1),u=1/(r||1),f=1/(a||1),d=new G,c=d.elements;return c[0]=s[0]*o,c[1]=s[1]*o,c[2]=s[2]*o,c[4]=s[4]*u,c[5]=s[5]*u,c[6]=s[6]*u,c[8]=s[8]*f,c[9]=s[9]*f,c[10]=s[10]*f,e.setFromRotationMatrix(d),i.x=n,i.y=r,i.z=a,this}toArray(t=[],e=0){const i=this.elements;for(let s=0;s<16;s++)t[e+s]=i[s];return t}fromArray(t,e=0){const i=this.elements;for(let s=0;s<16;s++)i[s]=t[e+s];return this}static multiplyBatch(t,e,i,s){q.batchMultiplyMatrix4(t,e,i,s)}}class st{constructor(t=0,e=0,i=0,s="XYZ"){h(this,"_x");h(this,"_y");h(this,"_z");h(this,"_order");h(this,"onChangeCallback",null);this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this.onChangeCallback&&this.onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this.onChangeCallback&&this.onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this.onChangeCallback&&this.onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this.onChangeCallback&&this.onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,s!==void 0&&(this._order=s),this.onChangeCallback&&this.onChangeCallback(),this}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._order=t.order,this.onChangeCallback&&this.onChangeCallback(),this}clone(){return new st(this._x,this._y,this._z,this._order)}setFromQuaternion(t,e=this._order){const i=t.x,s=t.y,n=t.z,r=t.w,a=i*i,l=s*s,o=n*n,u=r*r;return e==="XYZ"?(this._x=Math.atan2(2*(i*r-s*n),u-a-l+o),this._y=Math.asin(Math.max(-1,Math.min(1,2*(i*n+s*r)))),this._z=Math.atan2(2*(n*r-i*s),u+a-l-o)):(this._x=Math.atan2(2*(i*r-s*n),1-2*(i*i+s*s)),this._y=Math.asin(Math.max(-1,Math.min(1,2*(s*r+n*i)))),this._z=Math.atan2(2*(n*r-i*s),1-2*(s*s+n*n))),this._order=e,this.onChangeCallback&&this.onChangeCallback(),this}}class F{constructor(t,e,i){h(this,"r");h(this,"g");h(this,"b");this.r=1,this.g=1,this.b=1,t instanceof F?this.copy(t):typeof t=="string"?this.setStyle(t):typeof t=="number"&&e===void 0?this.setHex(t):typeof t=="number"&&this.setRGB(t,e??1,i??1)}setRGB(t,e,i){return this.r=t,this.g=e,this.b=i,this}set(t){return t instanceof F?this.copy(t):typeof t=="string"?this.setStyle(t):typeof t=="number"?this.setHex(t):this}setHex(t){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,this}setStyle(t){if(t.startsWith("#")){if(t.length===4){const i=parseInt(t[1]+t[1],16)/255,s=parseInt(t[2]+t[2],16)/255,n=parseInt(t[3]+t[3],16)/255;return this.setRGB(i,s,n)}const e=parseInt(t.slice(1),16);return this.setHex(e)}return this}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}clone(){return new F(this.r,this.g,this.b)}getHex(){return Math.round(Math.min(1,Math.max(0,this.r))*255)<<16^Math.round(Math.min(1,Math.max(0,this.g))*255)<<8^Math.round(Math.min(1,Math.max(0,this.b))*255)<<0}getHexString(){return("000000"+this.getHex().toString(16)).slice(-6)}getStyle(){return`#${this.getHexString()}`}toArray(){return[this.r,this.g,this.b]}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}}class _t{constructor(){h(this,"_listeners",{})}addEventListener(t,e){this._listeners[t]||(this._listeners[t]=[]),this._listeners[t].includes(e)||this._listeners[t].push(e)}removeEventListener(t,e){const i=this._listeners[t];if(i){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){const e=this._listeners[t.type];if(e){const i=e.slice();for(let s=0;s<i.length;s++)i[s].call(this,t)}}}let Ct=0;class W extends _t{constructor(){super();h(this,"id");h(this,"name");h(this,"position");h(this,"rotation");h(this,"quaternion");h(this,"scale");h(this,"matrix");h(this,"matrixWorld");h(this,"matrixAutoUpdate");h(this,"matrixWorldNeedsUpdate");h(this,"parent");h(this,"children");h(this,"visible");h(this,"frustumCulled");h(this,"castShadow");h(this,"receiveShadow");h(this,"renderOrder");h(this,"userData");h(this,"onClick");h(this,"onPointerOver");h(this,"onPointerOut");this.id=Ct++,this.name="",this.position=new w,this.rotation=new st,this.quaternion=new J,this.scale=new w(1,1,1),this.matrix=new G,this.matrixWorld=new G,this.matrixAutoUpdate=!0,this.matrixWorldNeedsUpdate=!1,this.parent=null,this.children=[],this.visible=!0,this.frustumCulled=!0,this.castShadow=!1,this.receiveShadow=!1,this.renderOrder=0,this.userData={};let e=!1;this.rotation.onChangeCallback=()=>{e||(e=!0,this.quaternion.setFromEuler(this.rotation),e=!1)},this.quaternion.onChangeCallback=()=>{e||(e=!0,this.rotation.setFromQuaternion(this.quaternion,this.rotation.order),e=!1)}}add(...e){for(let i=0;i<e.length;i++){const s=e[i];s!==this&&(s.parent!==null&&s.parent.remove(s),s.parent=this,this.children.push(s))}return this}remove(e){const i=this.children.indexOf(e);i!==-1&&(this.children.splice(i,1),e.parent=null)}traverse(e){e(this);for(const i of this.children)i.traverse(e)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e=!1){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);for(let i=0;i<this.children.length;i++)this.children[i].updateMatrixWorld(e)}lookAt(e,i,s){const n=new w;typeof e=="number"?n.set(e,i||0,s||0):n.copy(e);const r=new G;r.lookAt(this.position,n,new w(0,1,0)),this.quaternion.setFromRotationMatrix(r)}getObjectByName(e){if(this.name===e)return this;for(let i=0;i<this.children.length;i++){const n=this.children[i].getObjectByName(e);if(n)return n}}getWorldPosition(e){return this.updateMatrixWorld(!0),e.setFromMatrixPosition(this.matrixWorld)}}w.prototype.setFromMatrixPosition=function(_){const t=_.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this};class nt{constructor(){h(this,"attributes",{});h(this,"index",null);h(this,"morphAttributes",{});h(this,"morphTargetsRelative",!0);h(this,"userData",{})}setAttribute(t,e){return this.attributes[t]=e,this}getAttribute(t){return this.attributes[t]}setIndex(t){return Array.isArray(t)?this.index={array:t.length>65535?new Uint32Array(t):new Uint16Array(t),itemSize:1}:"array"in t?this.index=t:this.index={array:t,itemSize:1},this}translate(t,e,i){const s=this.getAttribute("position");if(s){const n=s.array;for(let r=0;r<n.length;r+=3)n[r]+=t,n[r+1]+=e,n[r+2]+=i;s.needsUpdate=!0}return this}computeVertexNormals(){const t=this.getAttribute("position");if(!t)return;const e=t.array,i=new Float32Array(e.length);if(this.index){const s=this.index.array;for(let n=0;n<s.length;n+=3){const r=s[n]*3,a=s[n+1]*3,l=s[n+2]*3,o=e[r],u=e[r+1],f=e[r+2],d=e[a],c=e[a+1],x=e[a+2],y=e[l],S=e[l+1],g=e[l+2],m=d-o,E=c-u,C=x-f,b=y-o,v=S-u,L=g-f,T=E*L-C*v,p=C*b-m*L,M=m*v-E*b;i[r]+=T,i[r+1]+=p,i[r+2]+=M,i[a]+=T,i[a+1]+=p,i[a+2]+=M,i[l]+=T,i[l+1]+=p,i[l+2]+=M}}else for(let s=0;s<e.length;s+=9){const n=e[s],r=e[s+1],a=e[s+2],l=e[s+3],o=e[s+4],u=e[s+5],f=e[s+6],d=e[s+7],c=e[s+8],x=l-n,y=o-r,S=u-a,g=f-n,m=d-r,E=c-a,C=y*E-S*m,b=S*g-x*E,v=x*m-y*g;i[s]=C,i[s+1]=b,i[s+2]=v,i[s+3]=C,i[s+4]=b,i[s+5]=v,i[s+6]=C,i[s+7]=b,i[s+8]=v}for(let s=0;s<i.length;s+=3){const n=i[s],r=i[s+1],a=i[s+2],l=Math.sqrt(n*n+r*r+a*a);l>0&&(i[s]/=l,i[s+1]/=l,i[s+2]/=l)}this.setAttribute("normal",{array:i,itemSize:3})}}let bt=0;class tt{constructor(){h(this,"id");h(this,"name");h(this,"wireframe");h(this,"opacity");h(this,"transparent");h(this,"depthWrite");h(this,"depthTest");h(this,"visible");h(this,"side");h(this,"map");h(this,"_glTexture");this.id=bt++,this.name="",this.wireframe=!1,this.opacity=1,this.transparent=!1,this.depthWrite=!0,this.depthTest=!0,this.visible=!0,this.side="front",this.map=null,this._glTexture=null}}class ot extends tt{constructor(e={}){super();h(this,"color");this.color=new F(e.color!==void 0?e.color:16777215),this.wireframe=e.wireframe||!1,this.opacity=e.opacity!==void 0?e.opacity:1,this.transparent=e.transparent||!1,e.depthWrite!==void 0?this.depthWrite=e.depthWrite:this.transparent&&(this.depthWrite=!1),e.depthTest!==void 0&&(this.depthTest=e.depthTest),this.map=e.map||null}}class wt extends W{constructor(e,i){super();h(this,"geometry");h(this,"material");h(this,"morphTargetInfluences");h(this,"morphTargetDictionary");this.name="Mesh",this.geometry=e||new nt,this.material=i||new ot}updateMorphTargets(){var r;if(!this.morphTargetInfluences||this.morphTargetInfluences.length===0)return;const e=(r=this.geometry.morphAttributes)==null?void 0:r.position;if(!e||e.length===0)return;const i=this.geometry.getAttribute("position");if(!i)return;this.geometry.userData||(this.geometry.userData={}),this.geometry.userData._originalPositions||(this.geometry.userData._originalPositions=new Float32Array(i.array));const s=this.geometry.userData._originalPositions,n=i.array;n.set(s);for(let a=0;a<e.length;a++){const l=this.morphTargetInfluences[a]??0;if(l===0)continue;const o=e[a].array;for(let u=0;u<n.length;u++)n[u]+=o[u]*l}i.needsUpdate=!0}}class et extends W{constructor(e=16777215,i=1){super();h(this,"color");h(this,"intensity");this.color=new F(e),this.intensity=i}}class Yt extends W{constructor(){super();h(this,"background");this.name="Scene",this.background=new F("#0a0c10")}getLights(){const e=[];return this.traverse(i=>{(i instanceof et||i.isSpotLight||i.name==="SpotLight"||i.angle!==void 0)&&e.push(i)}),e}traverse(e){e(this);for(let i=0;i<this.children.length;i++)this.traverseNode(this.children[i],e)}traverseNode(e,i){i(e);for(let s=0;s<e.children.length;s++)this.traverseNode(e.children[s],i)}}class At extends W{constructor(){super();h(this,"projectionMatrix");h(this,"projectionMatrixInverse");this.projectionMatrix=new G,this.projectionMatrixInverse=new G}}class $t extends At{constructor(e=50,i=1,s=.1,n=2e3){super();h(this,"fov");h(this,"aspect");h(this,"near");h(this,"far");this.fov=e,this.aspect=i,this.near=s,this.far=n,this.updateProjectionMatrix()}updateProjectionMatrix(){this.projectionMatrix.makePerspective(this.fov,this.aspect,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}}class it extends W{constructor(e,i){super();h(this,"geometry");h(this,"material");this.name="Line",this.geometry=e||new nt,this.material=i||new ot}}class Q extends W{constructor(e,i){super();h(this,"isPoints",!0);h(this,"geometry");h(this,"material");this.name="Points",this.geometry=e||new nt,this.material=i||new ot}}class Y{constructor(){h(this,"normal",new w(0,1,0));h(this,"constant",0)}set(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}distanceToPoint(t){return this.normal.x*t.x+this.normal.y*t.y+this.normal.z*t.z+this.constant}}class Pt{constructor(){h(this,"planes",[new Y,new Y,new Y,new Y,new Y,new Y]);h(this,"projectionElements",new Float32Array(16))}setFromProjectionMatrix(t){const e=t.elements;this.projectionElements.set(e),this.planes[0].set(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),this.planes[1].set(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),this.planes[2].set(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),this.planes[3].set(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),this.planes[4].set(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),this.planes[5].set(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14]);for(const i of this.planes){const s=Math.hypot(i.normal.x,i.normal.y,i.normal.z);s>0&&(i.normal.x/=s,i.normal.y/=s,i.normal.z/=s,i.constant/=s)}return this}intersectsAABB(t,e){for(let i=0;i<6;i++){const s=this.planes[i],n=s.normal.x,r=s.normal.y,a=s.normal.z,l=n>=0?e.x:t.x,o=r>=0?e.y:t.y,u=a>=0?e.z:t.z;if(n*l+r*o+a*u+s.constant<0)return!1}return!0}cullAABBBatch(t,e,i){const s=new Float32Array(24);for(let a=0;a<6;a++){const l=this.planes[a],o=a*4;s[o]=l.normal.x,s[o+1]=l.normal.y,s[o+2]=l.normal.z,s[o+3]=l.constant}const n=i??new Uint8Array(e);return{visibleCount:q.batchFrustumCullAABB(t,s,e,n),visibility:n}}}class at extends tt{constructor(e={}){super();h(this,"color");h(this,"specular");h(this,"shininess");this.color=new F(e.color!==void 0?e.color:16777215),this.specular=new F(e.specular!==void 0?e.specular:1118481),this.shininess=e.shininess!==void 0?e.shininess:30,this.wireframe=e.wireframe||!1,this.opacity=e.opacity!==void 0?e.opacity:1,this.transparent=e.transparent||!1,this.map=e.map||null}}class ht extends tt{constructor(e={}){super();h(this,"color");h(this,"roughness");h(this,"metalness");h(this,"clearcoat");h(this,"clearcoatRoughness");h(this,"emissive");h(this,"emissiveIntensity");h(this,"map");h(this,"transmission");h(this,"transmissionMap");h(this,"ior");h(this,"thickness");h(this,"thicknessMap");h(this,"attenuationDistance");h(this,"attenuationColor");this.color=new F(e.color!==void 0?e.color:16777215),this.roughness=e.roughness!==void 0?e.roughness:.5,this.metalness=e.metalness!==void 0?e.metalness:.5,this.clearcoat=e.clearcoat!==void 0?e.clearcoat:0,this.clearcoatRoughness=e.clearcoatRoughness!==void 0?e.clearcoatRoughness:.1,this.emissive=new F(e.emissive!==void 0?e.emissive:0),this.emissiveIntensity=e.emissiveIntensity!==void 0?e.emissiveIntensity:1,this.wireframe=e.wireframe||!1,this.opacity=e.opacity!==void 0?e.opacity:1,this.transparent=e.transparent||!1,this.map=e.map||null,this.transmission=e.transmission!==void 0?e.transmission:0,this.transmissionMap=e.transmissionMap||null,this.ior=e.ior!==void 0?e.ior:1.5,this.thickness=e.thickness!==void 0?e.thickness:0,this.thicknessMap=e.thicknessMap||null,this.attenuationDistance=e.attenuationDistance!==void 0?e.attenuationDistance:1/0,this.attenuationColor=new F(e.attenuationColor!==void 0?e.attenuationColor:16777215),this.transmission>0&&(this.transparent=!0)}}class Z extends tt{constructor(e){super();h(this,"vertexShader");h(this,"fragmentShader");h(this,"uniforms");this.vertexShader=e.vertexShader,this.fragmentShader=e.fragmentShader,this.uniforms=e.uniforms||{},this.wireframe=e.wireframe||!1,this.transparent=e.transparent??!1,this.opacity=e.opacity??1,e.depthWrite!==void 0?this.depthWrite=e.depthWrite:this.transparent&&(this.depthWrite=!1)}}class Tt extends et{constructor(t,e=1){super(t,e),this.name="AmbientLight"}}class It extends et{constructor(e,i=1){super(e,i);h(this,"target");h(this,"castShadow",!1);h(this,"shadowMapSize",1024);h(this,"shadowBias",5e-4);h(this,"shadowCameraNear",.5);h(this,"shadowCameraFar",500);h(this,"shadowCameraSize",30);this.name="DirectionalLight",this.position.set(0,1,0),this.target=new w(0,0,0)}}class Dt extends et{constructor(e,i=1,s=0,n=2){super(e,i);h(this,"distance");h(this,"decay");this.name="PointLight",this.distance=s,this.decay=n}}class Nt extends W{constructor(e,i=1,s=0,n=Math.PI/6,r=0,a=2){super();h(this,"color",[1,1,1]);h(this,"intensity",1);h(this,"angle",Math.PI/6);h(this,"penumbra",0);h(this,"decay",2);h(this,"distance",0);h(this,"castShadow",!1);h(this,"shadowMapSize",512);h(this,"shadowBias",-1e-4);h(this,"target");h(this,"isSpotLight",!0);this.name="SpotLight",e&&(this.color=e),this.intensity=i,this.distance=s,this.angle=n,this.penumbra=r,this.decay=a,this.target=new W}}class Rt{constructor(){h(this,"pointEntries",[]);h(this,"spotEntries",[]);h(this,"pointScores",new Float32Array(1024));h(this,"pointIndices",new Uint16Array(1024));h(this,"spotScores",new Float32Array(256));h(this,"spotIndices",new Uint16Array(256));h(this,"packedLightBuffer",new Float32Array(1024*16));h(this,"packedLightCount",0)}clear(){this.pointEntries.length=0,this.spotEntries.length=0,this.packedLightCount=0}registerPointLight(t){const e=t.position,i=t.intensity,s=t.distance||0,n=s>0?s:Math.sqrt(Math.max(1,i)/.01),r={color:[t.color.r*i,t.color.g*i,t.color.b*i],position:[e.x,e.y,e.z],distance:s,decay:t.decay||2};this.pointEntries.push({light:t,uniform:r,position:e,radius:n,intensity:i})}registerSpotLight(t){const e=t.position,i=t.intensity,s=t.distance||0,n=s>0?s:Math.sqrt(Math.max(1,i)/.01),a=(t.target&&typeof t.target.position=="object"?t.target.position:t.target instanceof w?t.target:new w(0,0,0)).clone().sub(e);a.lengthSq()===0?a.set(0,-1,0):a.normalize();const l=t.angle??Math.PI/6,o=t.penumbra??0,u=Math.cos(l),f=Math.cos(l*(1-o)),d={color:Array.isArray(t.color)?[t.color[0]*i,t.color[1]*i,t.color[2]*i]:[t.color.r*i,t.color.g*i,t.color.b*i],position:[e.x,e.y,e.z],dir:[a.x,a.y,a.z],distance:s,decay:t.decay||2,coneCos:u,penumbraCos:f};this.spotEntries.push({light:t,uniform:d,position:e,radius:n,intensity:i})}getPointLightCount(){return this.pointEntries.length}getSpotLightCount(){return this.spotEntries.length}getAllPointLightUniforms(){return this.pointEntries.map(t=>t.uniform)}getAllSpotLightUniforms(){return this.spotEntries.map(t=>t.uniform)}getCulledLightsForObject(t,e=16,i=8,s=0){const n=this.pointEntries.length;let r=0;for(let c=0;c<n;c++){const x=this.pointEntries[c],y=x.position,S=t.x-y.x,g=t.y-y.y,m=t.z-y.z,E=S*S+g*g+m*m,C=x.radius+s;if(E>C*C)continue;const b=x.intensity/Math.max(.1,E);this.pointScores[r]=b,this.pointIndices[r]=c,r++}for(let c=1;c<r;c++){const x=this.pointScores[c],y=this.pointIndices[c];let S=c-1;for(;S>=0&&this.pointScores[S]<x;)this.pointScores[S+1]=this.pointScores[S],this.pointIndices[S+1]=this.pointIndices[S],S--;this.pointScores[S+1]=x,this.pointIndices[S+1]=y}const a=[],l=Math.min(r,e);for(let c=0;c<l;c++)a.push(this.pointEntries[this.pointIndices[c]].uniform);const o=this.spotEntries.length;let u=0;for(let c=0;c<o;c++){const x=this.spotEntries[c],y=x.position,S=t.x-y.x,g=t.y-y.y,m=t.z-y.z,E=S*S+g*g+m*m,C=x.radius+s;if(E>C*C)continue;const b=x.intensity/Math.max(.1,E);this.spotScores[u]=b,this.spotIndices[u]=c,u++}for(let c=1;c<u;c++){const x=this.spotScores[c],y=this.spotIndices[c];let S=c-1;for(;S>=0&&this.spotScores[S]<x;)this.spotScores[S+1]=this.spotScores[S],this.spotIndices[S+1]=this.spotIndices[S],S--;this.spotScores[S+1]=x,this.spotIndices[S+1]=y}const f=[],d=Math.min(u,i);for(let c=0;c<d;c++)f.push(this.spotEntries[this.spotIndices[c]].uniform);return{pointLights:a,spotLights:f}}packLightBuffer(){const t=Math.min(1024,this.pointEntries.length+this.spotEntries.length);let e=0;for(let i=0;i<this.pointEntries.length&&e<1024*16;i++){const s=this.pointEntries[i],n=s.uniform;this.packedLightBuffer[e++]=n.position[0],this.packedLightBuffer[e++]=n.position[1],this.packedLightBuffer[e++]=n.position[2],this.packedLightBuffer[e++]=s.radius,this.packedLightBuffer[e++]=n.color[0],this.packedLightBuffer[e++]=n.color[1],this.packedLightBuffer[e++]=n.color[2],this.packedLightBuffer[e++]=n.decay,this.packedLightBuffer[e++]=0,this.packedLightBuffer[e++]=0,this.packedLightBuffer[e++]=0,this.packedLightBuffer[e++]=1,this.packedLightBuffer[e++]=0,this.packedLightBuffer[e++]=0,this.packedLightBuffer[e++]=n.distance,this.packedLightBuffer[e++]=s.intensity}for(let i=0;i<this.spotEntries.length&&e<1024*16;i++){const s=this.spotEntries[i],n=s.uniform;this.packedLightBuffer[e++]=n.position[0],this.packedLightBuffer[e++]=n.position[1],this.packedLightBuffer[e++]=n.position[2],this.packedLightBuffer[e++]=s.radius,this.packedLightBuffer[e++]=n.color[0],this.packedLightBuffer[e++]=n.color[1],this.packedLightBuffer[e++]=n.color[2],this.packedLightBuffer[e++]=n.decay,this.packedLightBuffer[e++]=n.dir[0],this.packedLightBuffer[e++]=n.dir[1],this.packedLightBuffer[e++]=n.dir[2],this.packedLightBuffer[e++]=2,this.packedLightBuffer[e++]=n.coneCos,this.packedLightBuffer[e++]=n.penumbraCos,this.packedLightBuffer[e++]=n.distance,this.packedLightBuffer[e++]=s.intensity}return this.packedLightCount=t,{buffer:this.packedLightBuffer,count:t}}}let zt=0;class Bt{constructor(t=null){h(this,"id");h(this,"name");h(this,"image");h(this,"wrapS");h(this,"wrapT");h(this,"magFilter");h(this,"minFilter");h(this,"generateMipmaps");h(this,"anisotropy");h(this,"flipY");h(this,"version");h(this,"_glTexture");h(this,"_glVersion");h(this,"_glParamsKey");this.id=zt++,this.name="",this.image=t,this.wrapS="repeat",this.wrapT="repeat",this.magFilter="linear",this.minFilter="linear-mipmap-linear",this.generateMipmaps=!0,this.anisotropy=1,this.flipY=!0,this.version=0,this._glTexture=null,this._glVersion=-1,this._glParamsKey=null}setImage(t){return this.image=t,this.version++,this}setNeedsUpdate(){return this.version++,this}dispose(t){if(t&&this._glTexture&&typeof t.deleteTexture=="function")try{t.deleteTexture(this._glTexture)}catch{}this._glTexture=null,this._glVersion=-1,this._glParamsKey=null}}class Ft{constructor(t,e,i,s=4){h(this,"available",[]);h(this,"inFlight",[]);h(this,"maxInFlight");h(this,"lastResult",null);h(this,"disposed",!1);this.gl=t,this.ext=e,this.disjointBit=i,this.maxInFlight=Math.max(2,s)}begin(){var i,s,n;if(this.disposed||this.inFlight.length>=this.maxInFlight)return null;const t=this.gl;let e=null;try{if(e=this.available.pop()??((i=t.createQuery)==null?void 0:i.call(t))??((n=(s=this.ext).createQueryEXT)==null?void 0:n.call(s))??null,!e)return null;if(typeof t.beginQuery=="function")t.beginQuery(this.ext.TIME_ELAPSED_EXT,e);else if(typeof this.ext.beginQueryEXT=="function")this.ext.beginQueryEXT(this.ext.TIME_ELAPSED_EXT,e);else return this.available.push(e),null;return e}catch{return e&&this.available.push(e),null}}end(t){if(!t||this.disposed)return;const e=this.gl;try{typeof e.endQuery=="function"?e.endQuery(this.ext.TIME_ELAPSED_EXT):typeof this.ext.endQueryEXT=="function"&&this.ext.endQueryEXT(this.ext.TIME_ELAPSED_EXT),this.inFlight.push(t)}catch{this.available.push(t)}}poll(){if(this.disposed)return this.lastResult;const t=this.gl;for(;this.inFlight.length>0;){const e=this.inFlight[0];let i=!1;try{if(typeof t.getQueryParameter=="function")i=!!t.getQueryParameter(e,t.QUERY_RESULT_AVAILABLE);else if(typeof this.ext.getQueryObjectEXT=="function")i=!!this.ext.getQueryObjectEXT(e,this.ext.QUERY_RESULT_AVAILABLE_EXT);else break}catch{this.release(e),this.inFlight.shift();continue}if(!i)break;this.inFlight.shift();try{if(!!!t.getParameter(this.disjointBit)){let n=0;typeof t.getQueryParameter=="function"?n=Number(t.getQueryParameter(e,t.QUERY_RESULT))||0:typeof this.ext.getQueryObjectEXT=="function"&&(n=Number(this.ext.getQueryObjectEXT(e,this.ext.QUERY_RESULT_EXT))||0),this.lastResult=n/1e6}}catch{this.lastResult=null}this.available.push(e)}return this.lastResult}release(t){try{typeof this.gl.deleteQuery=="function"?this.gl.deleteQuery(t):typeof this.ext.deleteQueryEXT=="function"&&this.ext.deleteQueryEXT(t)}catch{}}dispose(){if(!this.disposed){this.disposed=!0;for(const t of this.available)this.release(t);for(const t of this.inFlight)this.release(t);this.available.length=0,this.inFlight.length=0}}}class Ut{constructor(){h(this,"floatCache",new Map);h(this,"intCache",new Map);h(this,"vec3Cache",new Map);h(this,"mat4Cache",new Map)}reset(){}uniform1f(t,e,i){return e?this.floatCache.get(e)===i?!0:(t.uniform1f(e,i),this.floatCache.set(e,i),!1):!1}uniform1i(t,e,i){return e?this.intCache.get(e)===i?!0:(t.uniform1i(e,i),this.intCache.set(e,i),!1):!1}uniform3f(t,e,i,s,n){if(!e)return!1;const r=`${i}|${s}|${n}`;return this.vec3Cache.get(e)===r?!0:(t.uniform3f(e,i,s,n),this.vec3Cache.set(e,r),!1)}uniform3fv(t,e,i){if(!e)return!1;const s=`${i[0]}|${i[1]}|${i[2]}`;return this.vec3Cache.get(e)===s?!0:(t.uniform3fv(e,i),this.vec3Cache.set(e,s),!1)}uniformMatrix4fv(t,e,i){if(!e)return!1;let s=0;for(let r=0;r<i.length;r++)s=(s<<5)-s+Math.round(i[r]*1e3)|0;const n=String(s);return this.mat4Cache.get(e)===n?!0:(t.uniformMatrix4fv(e,!1,i),this.mat4Cache.set(e,n),!1)}clear(){this.floatCache.clear(),this.intCache.clear(),this.vec3Cache.clear(),this.mat4Cache.clear()}}const kt=`
  attribute vec3 aPosition;

  #ifdef USE_INSTANCING
  attribute mat4 aInstanceMatrix;
  #endif

  #ifdef USE_SKINNING
  attribute vec4 aSkinIndex;
  attribute vec4 aSkinWeight;
  uniform mat4 uBindMatrix;
  uniform mat4 uBindMatrixInverse;
  #define MAX_BONES 64
  uniform mat4 uBoneMatrices[MAX_BONES];
  #endif

  uniform mat4 uLightSpaceMatrix;
  uniform mat4 uModelMatrix;

  void main() {
    #ifdef USE_INSTANCING
    mat4 modelMat = uModelMatrix * aInstanceMatrix;
    #else
    mat4 modelMat = uModelMatrix;
    #endif

    #ifdef USE_SKINNING
    mat4 skinMatrix =
      aSkinWeight.x * uBoneMatrices[int(aSkinIndex.x)] +
      aSkinWeight.y * uBoneMatrices[int(aSkinIndex.y)] +
      aSkinWeight.z * uBoneMatrices[int(aSkinIndex.z)] +
      aSkinWeight.w * uBoneMatrices[int(aSkinIndex.w)];
    vec4 skinVertex = uBindMatrix * vec4(aPosition, 1.0);
    vec4 skinned = skinMatrix * skinVertex;
    vec4 worldPosition = modelMat * (uBindMatrixInverse * skinned);
    #else
    vec4 worldPosition = modelMat * vec4(aPosition, 1.0);
    #endif

    gl_Position = uLightSpaceMatrix * worldPosition;
  }
`,Ot=`
  precision mediump float;

  void main() {
    // Depth is written automatically by WebGL
  }
`,Gt=`
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aUv;

  #ifdef USE_INSTANCING
  attribute mat4 aInstanceMatrix;
  #endif
  #ifdef USE_INSTANCE_COLOR
  attribute vec3 aInstanceColor;
  #endif

  #ifdef USE_SKINNING
  attribute vec4 aSkinIndex;
  attribute vec4 aSkinWeight;
  uniform mat4 uBindMatrix;
  uniform mat4 uBindMatrixInverse;
  #define MAX_BONES 64
  uniform mat4 uBoneMatrices[MAX_BONES];
  #endif

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  #ifdef USE_SHADOW_MAP
  uniform mat4 uLightSpaceMatrix;
  varying vec4 vFragPosLightSpace;
  #endif

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vUv;
  #ifdef USE_INSTANCE_COLOR
  varying vec3 vInstanceColor;
  #endif

  void main() {
    #ifdef USE_INSTANCING
    mat4 modelMat = uModelMatrix * aInstanceMatrix;
    #else
    mat4 modelMat = uModelMatrix;
    #endif

    #ifdef USE_SKINNING
    mat4 skinMatrix =
      aSkinWeight.x * uBoneMatrices[int(aSkinIndex.x)] +
      aSkinWeight.y * uBoneMatrices[int(aSkinIndex.y)] +
      aSkinWeight.z * uBoneMatrices[int(aSkinIndex.z)] +
      aSkinWeight.w * uBoneMatrices[int(aSkinIndex.w)];
    vec4 skinVertex = uBindMatrix * vec4(aPosition, 1.0);
    vec4 skinned = skinMatrix * skinVertex;
    vec4 worldPosition = modelMat * (uBindMatrixInverse * skinned);
    mat4 skinNormalMatrix = uBindMatrixInverse * skinMatrix * uBindMatrix;
    vNormal = normalize(mat3(modelMat * skinNormalMatrix) * aNormal);
    #else
    vec4 worldPosition = modelMat * vec4(aPosition, 1.0);
    vNormal = normalize(mat3(modelMat) * aNormal);
    #endif

    vFragPos = worldPosition.xyz;
    vUv = aUv;
    #ifdef USE_INSTANCE_COLOR
    vInstanceColor = aInstanceColor;
    #endif

    #ifdef USE_SHADOW_MAP
    vFragPosLightSpace = uLightSpaceMatrix * worldPosition;
    #endif

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  }
`,Wt=`
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vUv;
  #ifdef USE_INSTANCE_COLOR
  varying vec3 vInstanceColor;
  #endif

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uMap;
  uniform int uHasMap;
  uniform vec3 uCameraPosition;

  uniform float uRoughness;
  uniform float uMetalness;
  uniform float uClearcoat;
  uniform float uClearcoatRoughness;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;

  uniform vec3 uAmbientLightColor;
  uniform vec3 uKeyLightColor;
  uniform vec3 uKeyLightDir;
  uniform vec3 uFillLightColor;
  uniform vec3 uFillLightDir;
  uniform vec3 uRimLightColor;
  uniform vec3 uRimLightDir;

  #define MAX_POINT_LIGHTS 16
  uniform int uNumPointLights;
  uniform vec3 uPointLightColor[MAX_POINT_LIGHTS];
  uniform vec3 uPointLightPos[MAX_POINT_LIGHTS];
  uniform float uPointLightDistance[MAX_POINT_LIGHTS];
  uniform float uPointLightDecay[MAX_POINT_LIGHTS];

  #define MAX_SPOT_LIGHTS 8
  uniform int uNumSpotLights;
  uniform vec3 uSpotLightColor[MAX_SPOT_LIGHTS];
  uniform vec3 uSpotLightPos[MAX_SPOT_LIGHTS];
  uniform vec3 uSpotLightDir[MAX_SPOT_LIGHTS];
  uniform float uSpotLightDistance[MAX_SPOT_LIGHTS];
  uniform float uSpotLightDecay[MAX_SPOT_LIGHTS];
  uniform float uSpotLightConeCos[MAX_SPOT_LIGHTS];
  uniform float uSpotLightPenumbraCos[MAX_SPOT_LIGHTS];

  #ifdef USE_SHADOW_MAP
  uniform sampler2D uShadowMap;
  uniform vec2 uShadowMapSize;
  uniform float uShadowBias;
  uniform int uReceiveShadow;
  uniform int uShadowMapEnabled;
  varying vec4 vFragPosLightSpace;

  float calculateShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) {
      return 0.0;
    }

    float bias = max(uShadowBias * (1.0 - dot(normal, lightDir)), uShadowBias * 0.1);
    float currentDepth = projCoords.z;

    float shadow = 0.0;
    vec2 texelSize = 1.0 / uShadowMapSize;
    for (int x = -1; x <= 1; ++x) {
      for (int y = -1; y <= 1; ++y) {
        float pcfDepth = texture2D(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
        shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
      }
    }
    return shadow / 9.0;
  }
  #endif

  float getPointAttenuation(float dist, float maxDist, float decay) {
    if (maxDist <= 0.0) {
      return 1.0 / max(1.0, pow(dist, decay));
    }
    float atten = clamp(1.0 - dist / maxDist, 0.0, 1.0);
    return pow(atten, decay);
  }

  const float PI = 3.14159265359;

  float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / max(PI * denom * denom, 0.0000001);
  }

  float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / max(NdotV * (1.0 - k) + k, 0.0000001);
  }

  float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
  }

  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  vec3 evaluateStudioEnvironment(vec3 N, vec3 V, vec3 albedo, float roughness, float metalness, vec3 F0) {
    vec3 R = reflect(-V, N);
    float skyFactor = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 skyColor = vec3(0.18, 0.19, 0.21);
    vec3 groundColor = vec3(0.04, 0.04, 0.05);
    vec3 envColor = mix(groundColor, skyColor, skyFactor);

    float blur = roughness * 0.38 + 0.015;

    float topMask = smoothstep(0.48 + blur, 0.48, abs(R.x))
                  * smoothstep(0.42 + blur, 0.42, abs(R.z - 0.1))
                  * smoothstep(0.35 - blur, 0.35, R.y);
    float leftMask = smoothstep(0.24 + blur, 0.24, abs(R.z + 0.1))
                   * smoothstep(0.55 + blur, 0.55, abs(R.y - 0.25))
                   * smoothstep(-0.45 - blur, -0.45, -R.x);
    float rightMask = smoothstep(0.24 + blur, 0.24, abs(R.z + 0.1))
                    * smoothstep(0.55 + blur, 0.55, abs(R.y - 0.25))
                    * smoothstep(0.45 - blur, 0.45, R.x);
    float fillMask = smoothstep(0.32 + blur, 0.32, abs(R.x - 0.2))
                   * smoothstep(0.35 + blur, 0.35, abs(R.y - 0.35))
                   * smoothstep(0.60 - blur, 0.60, R.z);

    envColor += vec3(2.5, 2.5, 2.5) * topMask
              + vec3(2.1, 2.1, 2.2) * leftMask
              + vec3(2.0, 2.0, 1.9) * rightMask
              + vec3(1.2, 1.15, 1.1) * fillMask;

    float NdotV = max(dot(N, V), 0.001);

    vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
    vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
    vec4 r = roughness * c0 + c1;
    float a004 = min(r.x * r.x, exp(-6.4324058 * NdotV)) * r.x + r.y;
    vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;

    vec3 specularColor = F0 * AB.x + vec3(AB.y);
    vec3 specular = envColor * specularColor;

    vec3 kD = (vec3(1.0) - F0) * (1.0 - metalness);
    vec3 diffuse = kD * albedo * (uAmbientLightColor + vec3(0.08, 0.10, 0.12));

    return diffuse + specular;
  }

  vec3 calculateDirectLight(vec3 L, vec3 lightColor, vec3 N, vec3 V, vec3 albedo, float roughness, float metalness, vec3 F0) {
    vec3 H = normalize(V + L);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);

    if (NdotL <= 0.0) return vec3(0.0);

    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;

    vec3 kS = F;
    vec3 kD = (vec3(1.0) - kS) * (1.0 - metalness);

    return (kD * albedo / PI + specular) * lightColor * NdotL;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPosition - vFragPos);

    vec3 albedo = pow(uColor, vec3(2.2));
    if (uHasMap == 1) {
      vec4 texColor = texture2D(uMap, vUv);
      albedo = pow(texColor.rgb, vec3(2.2));
    }
    #ifdef USE_INSTANCE_COLOR
    albedo *= pow(vInstanceColor, vec3(2.2));
    #endif
    float roughness = clamp(uRoughness, 0.04, 1.0);
    float metalness = clamp(uMetalness, 0.0, 1.0);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metalness);

    float shadow = 0.0;
    #ifdef USE_SHADOW_MAP
    if (uShadowMapEnabled == 1 && uReceiveShadow == 1) {
      shadow = calculateShadow(vFragPosLightSpace, N, normalize(uKeyLightDir));
    }
    #endif

    vec3 Lo = vec3(0.0);
    if (length(uKeyLightColor) > 0.0)  Lo += calculateDirectLight(normalize(uKeyLightDir),  uKeyLightColor,  N, V, albedo, roughness, metalness, F0) * (1.0 - shadow);
    if (length(uFillLightColor) > 0.0) Lo += calculateDirectLight(normalize(uFillLightDir), uFillLightColor, N, V, albedo, roughness, metalness, F0);
    if (length(uRimLightColor) > 0.0)  Lo += calculateDirectLight(normalize(uRimLightDir),  uRimLightColor,  N, V, albedo, roughness, metalness, F0);

    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
      if (i >= uNumPointLights) break;
      vec3 pLDir = uPointLightPos[i] - vFragPos;
      float dist = length(pLDir);
      pLDir = normalize(pLDir);
      float atten = getPointAttenuation(dist, uPointLightDistance[i], uPointLightDecay[i]);
      vec3 radiance = uPointLightColor[i] * atten;
      Lo += calculateDirectLight(pLDir, radiance, N, V, albedo, roughness, metalness, F0);
    }

    for (int i = 0; i < MAX_SPOT_LIGHTS; i++) {
      if (i >= uNumSpotLights) break;
      vec3 sLDir = uSpotLightPos[i] - vFragPos;
      float dist = length(sLDir);
      sLDir = normalize(sLDir);
      float cosAngle = dot(-sLDir, normalize(uSpotLightDir[i]));
      if (cosAngle > uSpotLightConeCos[i]) {
        float spotEffect = clamp((cosAngle - uSpotLightConeCos[i]) / max(0.0001, uSpotLightPenumbraCos[i] - uSpotLightConeCos[i]), 0.0, 1.0);
        float atten = getPointAttenuation(dist, uSpotLightDistance[i], uSpotLightDecay[i]) * spotEffect;
        vec3 radiance = uSpotLightColor[i] * atten;
        Lo += calculateDirectLight(sLDir, radiance, N, V, albedo, roughness, metalness, F0);
      }
    }

    vec3 ambient = evaluateStudioEnvironment(N, V, albedo, roughness, metalness, F0);
    vec3 color = ambient + Lo;

    if (uClearcoat > 0.0) {
      vec3 H = normalize(V + normalize(uKeyLightDir));
      float ccNDF = DistributionGGX(N, H, max(0.02, uClearcoatRoughness));
      float ccG = GeometrySmith(N, V, normalize(uKeyLightDir), 0.1);
      vec3 ccF = fresnelSchlick(max(dot(H, V), 0.0), vec3(0.04));
      vec3 ccSpec = (ccNDF * ccG * ccF) / (4.0 * max(dot(N, V), 0.0) * max(dot(N, normalize(uKeyLightDir)), 0.0) + 0.0001);
      color += ccSpec * uClearcoat * uKeyLightColor * (1.0 - shadow);
    }

    color += uEmissive * uEmissiveIntensity;

    vec3 x = color;
    vec3 tonemapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
    tonemapped = clamp(tonemapped, 0.0, 1.0);
    vec3 finalColor = pow(tonemapped, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`,Xt=`
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aUv;

  #ifdef USE_INSTANCING
  attribute mat4 aInstanceMatrix;
  #endif
  #ifdef USE_INSTANCE_COLOR
  attribute vec3 aInstanceColor;
  #endif

  #ifdef USE_SKINNING
  attribute vec4 aSkinIndex;
  attribute vec4 aSkinWeight;
  uniform mat4 uBindMatrix;
  uniform mat4 uBindMatrixInverse;
  #define MAX_BONES 64
  uniform mat4 uBoneMatrices[MAX_BONES];
  #endif

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;

  #ifdef USE_SHADOW_MAP
  uniform mat4 uLightSpaceMatrix;
  varying vec4 vFragPosLightSpace;
  #endif

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vUv;
  #ifdef USE_INSTANCE_COLOR
  varying vec3 vInstanceColor;
  #endif

  void main() {
    #ifdef USE_INSTANCING
    mat4 modelMat = uModelMatrix * aInstanceMatrix;
    #else
    mat4 modelMat = uModelMatrix;
    #endif

    #ifdef USE_SKINNING
    mat4 skinMatrix =
      aSkinWeight.x * uBoneMatrices[int(aSkinIndex.x)] +
      aSkinWeight.y * uBoneMatrices[int(aSkinIndex.y)] +
      aSkinWeight.z * uBoneMatrices[int(aSkinIndex.z)] +
      aSkinWeight.w * uBoneMatrices[int(aSkinIndex.w)];
    vec4 skinVertex = uBindMatrix * vec4(aPosition, 1.0);
    vec4 skinned = skinMatrix * skinVertex;
    vec4 worldPosition = modelMat * (uBindMatrixInverse * skinned);
    mat4 skinNormalMatrix = uBindMatrixInverse * skinMatrix * uBindMatrix;
    vNormal = normalize(mat3(modelMat * skinNormalMatrix) * aNormal);
    #else
    vec4 worldPosition = modelMat * vec4(aPosition, 1.0);
    vNormal = normalize(mat3(modelMat) * aNormal);
    #endif

    vFragPos = worldPosition.xyz;
    vUv = aUv;
    #ifdef USE_INSTANCE_COLOR
    vInstanceColor = aInstanceColor;
    #endif

    #ifdef USE_SHADOW_MAP
    vFragPosLightSpace = uLightSpaceMatrix * worldPosition;
    #endif

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  }
`,Ht=`
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vFragPos;
  varying vec2 vUv;
  #ifdef USE_INSTANCE_COLOR
  varying vec3 vInstanceColor;
  #endif

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uMap;
  uniform int uHasMap;
  uniform vec3 uSpecular;
  uniform float uShininess;
  uniform vec3 uCameraPosition;

  uniform vec3 uAmbientLightColor;
  uniform vec3 uKeyLightColor;
  uniform vec3 uKeyLightDir;
  uniform vec3 uFillLightColor;
  uniform vec3 uFillLightDir;
  uniform vec3 uRimLightColor;
  uniform vec3 uRimLightDir;

  #define MAX_POINT_LIGHTS 16
  uniform int uNumPointLights;
  uniform vec3 uPointLightColor[MAX_POINT_LIGHTS];
  uniform vec3 uPointLightPos[MAX_POINT_LIGHTS];
  uniform float uPointLightDistance[MAX_POINT_LIGHTS];
  uniform float uPointLightDecay[MAX_POINT_LIGHTS];

  #define MAX_SPOT_LIGHTS 8
  uniform int uNumSpotLights;
  uniform vec3 uSpotLightColor[MAX_SPOT_LIGHTS];
  uniform vec3 uSpotLightPos[MAX_SPOT_LIGHTS];
  uniform vec3 uSpotLightDir[MAX_SPOT_LIGHTS];
  uniform float uSpotLightDistance[MAX_SPOT_LIGHTS];
  uniform float uSpotLightDecay[MAX_SPOT_LIGHTS];
  uniform float uSpotLightConeCos[MAX_SPOT_LIGHTS];
  uniform float uSpotLightPenumbraCos[MAX_SPOT_LIGHTS];

  #ifdef USE_SHADOW_MAP
  uniform sampler2D uShadowMap;
  uniform vec2 uShadowMapSize;
  uniform float uShadowBias;
  uniform int uReceiveShadow;
  uniform int uShadowMapEnabled;
  varying vec4 vFragPosLightSpace;

  float calculateShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) {
      return 0.0;
    }

    float bias = max(uShadowBias * (1.0 - dot(normal, lightDir)), uShadowBias * 0.1);
    float currentDepth = projCoords.z;

    float shadow = 0.0;
    vec2 texelSize = 1.0 / uShadowMapSize;
    for (int x = -1; x <= 1; ++x) {
      for (int y = -1; y <= 1; ++y) {
        float pcfDepth = texture2D(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
        shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
      }
    }
    return shadow / 9.0;
  }
  #endif

  float getPointAttenuation(float dist, float maxDist, float decay) {
    if (maxDist <= 0.0) {
      return 1.0 / max(1.0, pow(dist, decay));
    }
    float atten = clamp(1.0 - dist / maxDist, 0.0, 1.0);
    return pow(atten, decay);
  }

  void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPosition - vFragPos);

    vec3 diffuseColor = uColor;
    if (uHasMap == 1) {
      vec4 texColor = texture2D(uMap, vUv);
      diffuseColor = texColor.rgb;
    }
    #ifdef USE_INSTANCE_COLOR
    diffuseColor *= vInstanceColor;
    #endif

    vec3 ambient = (uAmbientLightColor + vec3(0.15)) * diffuseColor;

    vec3 keyDir = normalize(uKeyLightDir);
    float diffKey = max(dot(norm, keyDir), 0.0);
    vec3 halfKey = normalize(keyDir + viewDir);
    float specKey = pow(max(dot(norm, halfKey), 0.0), max(1.0, uShininess));

    float shadow = 0.0;
    #ifdef USE_SHADOW_MAP
    if (uShadowMapEnabled == 1 && uReceiveShadow == 1) {
      shadow = calculateShadow(vFragPosLightSpace, norm, keyDir);
    }
    #endif

    vec3 keyContrib = (diffuseColor * diffKey + uSpecular * specKey) * uKeyLightColor * (1.0 - shadow);

    vec3 fillDir = normalize(uFillLightDir);
    float diffFill = max(dot(norm, fillDir), 0.0);
    vec3 fillContrib = diffuseColor * diffFill * uFillLightColor;

    vec3 rimDir = normalize(uRimLightDir);
    float rimFactor = 1.0 - max(dot(viewDir, norm), 0.0);
    float diffRim = max(dot(norm, rimDir), 0.0);
    vec3 rimContrib = uSpecular * pow(rimFactor, 3.0) * diffRim * uRimLightColor * 1.5;

    vec3 pointContrib = vec3(0.0);
    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
      if (i >= uNumPointLights) break;
      vec3 pLDir = uPointLightPos[i] - vFragPos;
      float dist = length(pLDir);
      pLDir = normalize(pLDir);
      float diff = max(dot(norm, pLDir), 0.0);
      vec3 halfVec = normalize(pLDir + viewDir);
      float spec = pow(max(dot(norm, halfVec), 0.0), max(1.0, uShininess));
      float atten = getPointAttenuation(dist, uPointLightDistance[i], uPointLightDecay[i]);
      pointContrib += (diffuseColor * diff + uSpecular * spec) * uPointLightColor[i] * atten;
    }

    vec3 spotContrib = vec3(0.0);
    for (int i = 0; i < MAX_SPOT_LIGHTS; i++) {
      if (i >= uNumSpotLights) break;
      vec3 sLDir = uSpotLightPos[i] - vFragPos;
      float dist = length(sLDir);
      sLDir = normalize(sLDir);
      float cosAngle = dot(-sLDir, normalize(uSpotLightDir[i]));
      if (cosAngle > uSpotLightConeCos[i]) {
        float spotEffect = clamp((cosAngle - uSpotLightConeCos[i]) / max(0.0001, uSpotLightPenumbraCos[i] - uSpotLightConeCos[i]), 0.0, 1.0);
        float atten = getPointAttenuation(dist, uSpotLightDistance[i], uSpotLightDecay[i]) * spotEffect;
        float diff = max(dot(norm, sLDir), 0.0);
        vec3 halfVec = normalize(sLDir + viewDir);
        float spec = pow(max(dot(norm, halfVec), 0.0), max(1.0, uShininess));
        spotContrib += (diffuseColor * diff + uSpecular * spec) * uSpotLightColor[i] * atten;
      }
    }

    vec3 result = ambient + keyContrib + fillContrib + rimContrib + pointContrib + spotContrib;
    gl_FragColor = vec4(result, uOpacity);
  }
`,Vt=`
  attribute vec3 aPosition;
  attribute vec3 aColor;
  attribute vec2 aUv;

  #ifdef USE_INSTANCING
  attribute mat4 aInstanceMatrix;
  #endif
  #ifdef USE_INSTANCE_COLOR
  attribute vec3 aInstanceColor;
  #endif

  #ifdef USE_SKINNING
  attribute vec4 aSkinIndex;
  attribute vec4 aSkinWeight;
  uniform mat4 uBindMatrix;
  uniform mat4 uBindMatrixInverse;
  #define MAX_BONES 64
  uniform mat4 uBoneMatrices[MAX_BONES];
  #endif

  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform bool uHasVertexColors;
  uniform float uPointSize;

  #ifdef USE_SHADOW_MAP
  uniform mat4 uLightSpaceMatrix;
  varying vec4 vFragPosLightSpace;
  #endif

  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    #ifdef USE_INSTANCING
    mat4 modelMat = uModelMatrix * aInstanceMatrix;
    #else
    mat4 modelMat = uModelMatrix;
    #endif

    #ifdef USE_SKINNING
    mat4 skinMatrix =
      aSkinWeight.x * uBoneMatrices[int(aSkinIndex.x)] +
      aSkinWeight.y * uBoneMatrices[int(aSkinIndex.y)] +
      aSkinWeight.z * uBoneMatrices[int(aSkinIndex.z)] +
      aSkinWeight.w * uBoneMatrices[int(aSkinIndex.w)];
    vec4 skinVertex = uBindMatrix * vec4(aPosition, 1.0);
    vec4 skinned = skinMatrix * skinVertex;
    vec4 worldPosition = modelMat * (uBindMatrixInverse * skinned);
    #else
    vec4 worldPosition = modelMat * vec4(aPosition, 1.0);
    #endif
    vUv = aUv;

    vec4 mvPosition = uViewMatrix * worldPosition;
    gl_Position = uProjectionMatrix * mvPosition;
    float baseSize = uPointSize > 0.0 ? uPointSize : 2.0;
    gl_PointSize = clamp(baseSize * (60.0 / max(1.0, -mvPosition.z)), 1.5, 3.5);

    #ifdef USE_SHADOW_MAP
    vFragPosLightSpace = uLightSpaceMatrix * worldPosition;
    #endif

    #ifdef USE_INSTANCE_COLOR
    vColor = aInstanceColor;
    #else
    vColor = aColor;
    #endif
  }
`,jt=`
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uMap;
  uniform int uHasMap;
  uniform bool uIsPoints;
  uniform bool uHasVertexColors;

  #ifdef USE_SHADOW_MAP
  uniform sampler2D uShadowMap;
  uniform vec2 uShadowMapSize;
  uniform float uShadowBias;
  uniform int uReceiveShadow;
  uniform int uShadowMapEnabled;
  varying vec4 vFragPosLightSpace;

  float calculateShadow(vec4 fragPosLightSpace) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) {
      return 0.0;
    }

    float currentDepth = projCoords.z;
    float bias = uShadowBias;
    float shadow = 0.0;
    vec2 texelSize = 1.0 / uShadowMapSize;
    for (int x = -1; x <= 1; ++x) {
      for (int y = -1; y <= 1; ++y) {
        float pcfDepth = texture2D(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
        shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
      }
    }
    return shadow / 9.0;
  }
  #endif

  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    if (uIsPoints) {
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
    }
    #ifdef USE_INSTANCE_COLOR
    vec3 baseColor = vColor * uColor;
    #else
    vec3 baseColor = uHasVertexColors ? vColor : uColor;
    if (uHasMap == 1) {
      vec4 texColor = texture2D(uMap, vUv);
      baseColor = texColor.rgb;
    }
    #endif

    #ifdef USE_SHADOW_MAP
    if (uShadowMapEnabled == 1 && uReceiveShadow == 1) {
      float shadow = calculateShadow(vFragPosLightSpace);
      baseColor *= (1.0 - shadow * 0.5);
    }
    #endif

    gl_FragColor = vec4(baseColor, uOpacity);
  }
`;class rt{constructor(t,e){h(this,"programCache",new Map);h(this,"uniformCacheMap",new Map);this.getGl=t,this.getStats=e}getUniformCache(t){let e=this.uniformCacheMap.get(t);return e||(e=new Ut,this.uniformCacheMap.set(t,e)),e}getProgramInfo(t,e=!1,i=!1,s=!1,n=!1){var m;const a=`${((m=t.constructor)==null?void 0:m.name)??"Unknown"}_${t.wireframe?"wf":"fill"}_${t.side??"front"}_${e?"inst":"noinst"}_${i?"col":"nocol"}_${s?"shadow":"noshadow"}_${n?"skin":"noskin"}`,l=t instanceof Z?`${a}_${this.getShaderMaterialHash(t)}`:a,o=this.programCache.get(l);if(o)return this.getStats().programsReused++,o;const{vs:u,fs:f}=this.getShaderSource(t,e,i,s,n),d=this.createProgram(u,f),c=this.getGl(),x=["uModelMatrix","uViewMatrix","uProjectionMatrix","uModelViewMatrix","uCameraPosition","uColor","uOpacity","uIsPoints","uPointSize","uHasVertexColors","uMap","uHasMap","uRoughness","uMetalness","uClearcoat","uClearcoatRoughness","uEmissive","uEmissiveIntensity","uSpecular","uShininess","uAmbientLightColor","uKeyLightColor","uKeyLightDir","uFillLightColor","uFillLightDir","uRimLightColor","uRimLightDir","uLightSpaceMatrix","uShadowMap","uShadowMapSize","uShadowBias","uReceiveShadow","uShadowMapEnabled","uNumPointLights","uNumSpotLights","uBindMatrix","uBindMatrixInverse"],y={};for(const E of x)y[E]=c.getUniformLocation(d,E);const S=["uPointLightColor","uPointLightPos","uPointLightDistance","uPointLightDecay","uSpotLightColor","uSpotLightPos","uSpotLightDir","uSpotLightDistance","uSpotLightDecay","uSpotLightConeCos","uSpotLightPenumbraCos"];for(const E of S)y[E]=c.getUniformLocation(d,E)??c.getUniformLocation(d,`${E}[0]`);n&&(y.uBoneMatrices=c.getUniformLocation(d,"uBoneMatrices")??c.getUniformLocation(d,"uBoneMatrices[0]"));const g={program:d,attributes:{aPosition:c.getAttribLocation(d,"aPosition"),aNormal:c.getAttribLocation(d,"aNormal"),aColor:c.getAttribLocation(d,"aColor"),aUv:c.getAttribLocation(d,"aUv"),aInstanceMatrix:c.getAttribLocation(d,"aInstanceMatrix"),aInstanceColor:c.getAttribLocation(d,"aInstanceColor"),aSkinIndex:c.getAttribLocation(d,"aSkinIndex"),aSkinWeight:c.getAttribLocation(d,"aSkinWeight")},uniforms:y,sourceHash:t instanceof Z?this.getShaderMaterialHash(t):this.hashSource(u+"\0"+f)};return this.programCache.set(l,g),this.getStats().programsCompiled++,g}hashSource(t){let e=5381;for(let i=0;i<t.length;i++)e=(e<<5)+e+t.charCodeAt(i)|0;return String(e>>>0)}getShaderMaterialHash(t){const e=t.vertexShader??"",i=t.fragmentShader??"",s=t.__nexusProgramHash;if(s&&s.vs===e&&s.fs===i)return s.hash;const n=this.hashSource(`${e}\0${i}`);return t.__nexusProgramHash={vs:e,fs:i,hash:n},n}injectDefines(t,e){if(!e.length)return t;const i=e.map(n=>`#define ${n}
`).join(""),s=t.match(/^\s*#version\s+[^\n]+\n/);return s?s[0]+i+t.slice(s[0].length):i+t}getShaderSource(t,e=!1,i=!1,s=!1,n=!1){let r="",a="";t instanceof Z?(r=t.vertexShader,a=t.fragmentShader):t instanceof ht?(r=Gt,a=Wt):t instanceof at?(r=Xt,a=Ht):(r=Vt,a=jt);const l=[];return e&&l.push("USE_INSTANCING"),i&&l.push("USE_INSTANCE_COLOR"),s&&l.push("USE_SHADOW_MAP"),n&&l.push("USE_SKINNING"),l.length>0&&(r=this.injectDefines(r,l),a=this.injectDefines(a,l)),{vs:r,fs:a}}createProgram(t,e){const i=this.getGl(),s=this.compileShader(i.VERTEX_SHADER,t,"vertex"),n=this.compileShader(i.FRAGMENT_SHADER,e,"fragment"),r=i.createProgram();if(!r)throw new Error("Failed to allocate WebGL program.");if(i.attachShader(r,s),i.attachShader(r,n),i.linkProgram(r),i.deleteShader(s),i.deleteShader(n),!i.getProgramParameter(r,i.LINK_STATUS)){const a=i.getProgramInfoLog(r)??"(no log)";throw i.deleteProgram(r),new Error(`WebGL program link failed: ${a}`)}return r}compileShader(t,e,i){const s=this.getGl(),n=s.createShader(t);if(!n)throw new Error(`Failed to allocate ${i} shader.`);if(s.shaderSource(n,e),s.compileShader(n),!s.getShaderParameter(n,s.COMPILE_STATUS)){const r=s.getShaderInfoLog(n)??"(no log)";throw s.deleteShader(n),new Error(`${i} shader compile failed: ${r}`)}return n}getDepthProgram(t,e=!1){const i=`__depth_${t?"inst":"noinst"}_${e?"skin":"noskin"}`;let s=this.programCache.get(i);if(s)return s;const n=[];t&&n.push("USE_INSTANCING"),e&&n.push("USE_SKINNING");const r=this.injectDefines(kt,n),a=Ot,l=this.createProgram(r,a),o=this.getGl();return s={program:l,attributes:{aPosition:o.getAttribLocation(l,"aPosition"),aInstanceMatrix:o.getAttribLocation(l,"aInstanceMatrix"),aSkinIndex:o.getAttribLocation(l,"aSkinIndex"),aSkinWeight:o.getAttribLocation(l,"aSkinWeight")},uniforms:{uLightSpaceMatrix:o.getUniformLocation(l,"uLightSpaceMatrix"),uModelMatrix:o.getUniformLocation(l,"uModelMatrix"),uBindMatrix:o.getUniformLocation(l,"uBindMatrix"),uBindMatrixInverse:o.getUniformLocation(l,"uBindMatrixInverse"),uBoneMatrices:o.getUniformLocation(l,"uBoneMatrices")??o.getUniformLocation(l,"uBoneMatrices[0]")},sourceHash:this.hashSource(r+"\0"+a)},this.programCache.set(i,s),s}handleContextLost(){this.programCache.clear(),this.uniformCacheMap.clear()}dispose(t){for(const e of this.programCache.values())try{t.deleteProgram(e.program)}catch{}this.programCache.clear(),this.uniformCacheMap.clear()}}class qt{constructor(t={}){h(this,"domElement");h(this,"gl");h(this,"clearColor",new F("#050811"));h(this,"clearAlpha",1);h(this,"pixelRatio");h(this,"lastGpuTimeMs",null);h(this,"gpuTimingSupported",!1);h(this,"info");h(this,"contextLost",!1);h(this,"contextVersion",0);h(this,"frameCount",0);h(this,"lastScene",null);h(this,"contextAttributes");h(this,"timerPool",null);h(this,"programs");h(this,"gpuTimingEnabled");h(this,"contextLostListeners",[]);h(this,"contextRestoredListeners",[]);h(this,"_onContextLostEvent",()=>{});h(this,"_onContextRestoredEvent",()=>{});h(this,"loseContextExt",null);h(this,"frustumCullingEnabled");h(this,"debug");h(this,"frustum",new Pt);h(this,"isWebGL2");h(this,"instancingExt",null);h(this,"shadowMap",{enabled:!1,size:1024,type:"pcf"});h(this,"shadowFBO",null);h(this,"shadowDepthTexture",null);h(this,"dummyTexture",null);h(this,"shadowMapSize",0);h(this,"_lightSpaceMatrix",new G);h(this,"_lightViewMatrix",new G);h(this,"_lightProjMatrix",new G);h(this,"_pointLightColors",new Float32Array(48));h(this,"_pointLightPositions",new Float32Array(48));h(this,"_pointLightDistances",new Float32Array(16));h(this,"_pointLightDecays",new Float32Array(16));h(this,"_spotLightColors",new Float32Array(24));h(this,"_spotLightPositions",new Float32Array(24));h(this,"_spotLightDirs",new Float32Array(24));h(this,"_spotLightDistances",new Float32Array(8));h(this,"_spotLightDecays",new Float32Array(8));h(this,"_spotLightConeCos",new Float32Array(8));h(this,"_spotLightPenumbraCos",new Float32Array(8));h(this,"_objWorldPos",new w);h(this,"clusteredLightManager",new Rt);h(this,"_viewMatrix",new G);h(this,"_projectionMatrix",new G);h(this,"_projViewMatrix",new G);h(this,"_camPos",new w);h(this,"_tmpColor",new F);h(this,"renderList",[]);h(this,"shadowCasters",[]);h(this,"opaqueList",[]);h(this,"transparentList",[]);var l,o;this.domElement=t.canvas||document.createElement("canvas"),this.frustumCullingEnabled=t.frustumCulling!==!1,this.debug=t.debug===!0;const e={antialias:t.antialias!==void 0?t.antialias:!0,alpha:t.alpha!==void 0?t.alpha:!0,preserveDrawingBuffer:t.preserveDrawingBuffer||!1,powerPreference:"high-performance",premultipliedAlpha:!0,depth:!0,stencil:!1,failIfMajorPerformanceCaveat:!1};this.contextAttributes=e,this.gpuTimingEnabled=t.disableGpuTiming!==!0;let i="";const s=u=>{i=(u==null?void 0:u.statusMessage)||""};this.domElement.addEventListener("webglcontextcreationerror",s);let n=this.domElement.getContext("webgl2",e),r=n||this.domElement.getContext("webgl",e);if(!r){const u={...e,powerPreference:"default",antialias:!1};n=this.domElement.getContext("webgl2",u),r=n||this.domElement.getContext("webgl",u),r&&(this.contextAttributes=u)}if(r||(n=this.domElement.getContext("webgl2"),r=n||this.domElement.getContext("webgl")||((o=(l=this.domElement).getContext)==null?void 0:o.call(l,"experimental-webgl"))),this.domElement.removeEventListener("webglcontextcreationerror",s),!r){const u=i?` (${i})`:"";throw new Error(`WebGL 3D context is not supported in this environment${u}.`)}this.gl=r;const a=typeof WebGL2RenderingContext<"u"&&r instanceof WebGL2RenderingContext;if(this.isWebGL2=a,a)this.instancingExt=null;else try{this.instancingExt=r.getExtension("ANGLE_instanced_arrays")}catch{this.instancingExt=null}try{this.loseContextExt=r.getExtension("WEBGL_lose_context")}catch{this.loseContextExt=null}this._setupGpuTiming(),this._onContextLostEvent=u=>{u.preventDefault(),this._handleContextLost()},this._onContextRestoredEvent=()=>{this._handleContextRestored()},this.domElement.addEventListener("webglcontextlost",this._onContextLostEvent),this.domElement.addEventListener("webglcontextrestored",this._onContextRestoredEvent),this.pixelRatio=Math.min(typeof window<"u"&&window.devicePixelRatio||1,2),this.info={render:{calls:0,triangles:0,points:0,lines:0,instances:0,culled:0,programsCompiled:0,programsReused:0,uniformsSkipped:0}},typeof t.shadowMap=="boolean"?this.shadowMap.enabled=t.shadowMap:t.shadowMap&&(this.shadowMap.enabled=t.shadowMap.enabled!==!1,t.shadowMap.size&&(this.shadowMap.size=t.shadowMap.size),t.shadowMap.type&&(this.shadowMap.type=t.shadowMap.type)),this.initGL()}onContextLost(t){return this.contextLostListeners.push(t),()=>{const e=this.contextLostListeners.indexOf(t);e!==-1&&this.contextLostListeners.splice(e,1)}}onContextRestored(t){return this.contextRestoredListeners.push(t),()=>{const e=this.contextRestoredListeners.indexOf(t);e!==-1&&this.contextRestoredListeners.splice(e,1)}}isContextLost(){var t;return this.contextLost||typeof((t=this.gl)==null?void 0:t.isContextLost)=="function"&&this.gl.isContextLost()}_setupGpuTiming(){if(this.timerPool=null,this.programs=new rt(()=>this.gl,()=>this.info.render),this.gpuTimingSupported=!1,!this.gpuTimingEnabled)return;const t=this.gl,e=t.getExtension("EXT_disjoint_timer_query_webgl2")||t.getExtension("EXT_disjoint_timer_query");if(e){const i=t.getExtension("EXT_disjoint_timer_query_webgl2")?36795:e.GPU_DISJOINT_EXT;this.timerPool=new Ft(t,e,i,4),this.gpuTimingSupported=!0}}_handleContextLost(){var t;if(!this.contextLost){this.contextLost=!0;try{(t=this.timerPool)==null||t.dispose()}catch{}for(const e of this.contextLostListeners)try{e()}catch{}}}_handleContextRestored(){var e;const t=this.domElement.getContext("webgl2",this.contextAttributes)||this.domElement.getContext("webgl",this.contextAttributes);if(t){this.gl=t;const i=typeof WebGL2RenderingContext<"u"&&t instanceof WebGL2RenderingContext;if(this.isWebGL2=i,i)this.instancingExt=null;else try{this.instancingExt=t.getExtension("ANGLE_instanced_arrays")}catch{this.instancingExt=null}try{this.loseContextExt=t.getExtension("WEBGL_lose_context")}catch{this.loseContextExt=null}}this.programs.handleContextLost(),this.releaseShadowFBO();try{(e=this.timerPool)==null||e.dispose()}catch{}this._setupGpuTiming(),this.initGL(),this.lastScene&&this._invalidateSceneGeometryBuffers(this.lastScene),this.contextLost=!1,this.contextVersion++;for(const i of this.contextRestoredListeners)try{i()}catch{}}_invalidateSceneGeometryBuffers(t){if(t)try{t.traverse(e=>{var n;const i=e==null?void 0:e.geometry;if(!i)return;const s=i.attributes;if(s)for(const r in s){const a=s[r];a&&a.buffer&&(a.buffer=null)}(n=i.index)!=null&&n.buffer&&(i.index.buffer=null),e._instanceMatrixBuffer&&(e._instanceMatrixBuffer=null,e.instanceMatrixNeedsUpdate=!0),e._instanceColorBuffer&&(e._instanceColorBuffer=null,e.instanceColorNeedsUpdate=!0)})}catch{}}forceContextLoss(){const t=this.loseContextExt;if(t!=null&&t.loseContext)try{t.loseContext();return}catch{}this.domElement.dispatchEvent(new Event("webglcontextlost",{cancelable:!0}))}restoreContext(){const t=this.loseContextExt;if(t!=null&&t.restoreContext&&typeof this.gl.isContextLost=="function"&&this.gl.isContextLost())try{t.restoreContext();return}catch{}this.contextLost&&this.domElement.dispatchEvent(new Event("webglcontextrestored"))}initGL(){const t=this.gl;this.tryGetExtension("OES_element_index_uint"),this.tryGetExtension("OES_standard_derivatives"),this.tryGetExtension("EXT_shader_texture_lod"),this.tryGetExtension("WEBGL_debug_renderer_info"),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.enable(t.CULL_FACE),t.cullFace(t.BACK),this.clearColor.setRGB(.02,.03,.07),this.clearAlpha=1}tryGetExtension(t){try{return this.gl.getExtension(t)}catch{return null}}setSize(t,e,i=!0){const s=this.pixelRatio,n=Math.max(1,Math.floor(t*s)),r=Math.max(1,Math.floor(e*s));if(this.domElement.width===n&&this.domElement.height===r){i&&(this.domElement.style.width=`${t}px`,this.domElement.style.height=`${e}px`);return}this.domElement.width=n,this.domElement.height=r,i&&(this.domElement.style.width=`${t}px`,this.domElement.style.height=`${e}px`),this.gl.viewport(0,0,n,r)}setPixelRatio(t){const e=Math.max(.5,Math.min(2,Number.isFinite(t)?t:1));e!==this.pixelRatio&&(this.pixelRatio=e)}setClearColor(t,e=1){var s,n;const i=t;i!==null&&typeof i=="object"&&Number.isFinite(i.r)&&Number.isFinite(i.g)&&Number.isFinite(i.b)?this.clearColor.setRGB(i.r,i.g,i.b):((n=(s=this.clearColor).set)==null?void 0:n.call(s,t))??(this.clearColor=new F(t)),this.clearAlpha=e}clear(){const t=this.gl;t.depthMask(!0),t.clearColor(this.clearColor.r,this.clearColor.g,this.clearColor.b,this.clearAlpha),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT)}dispose(){var t;this.domElement.removeEventListener("webglcontextlost",this._onContextLostEvent),this.domElement.removeEventListener("webglcontextrestored",this._onContextRestoredEvent),this.contextLostListeners.length=0,this.contextRestoredListeners.length=0,this.lastScene=null,this.programs.dispose(this.gl),this.releaseShadowFBO(),(t=this.timerPool)==null||t.dispose(),this.timerPool=null,this.programs=new rt(()=>this.gl,()=>this.info.render)}render(t,e){var b,v,L,T;if(this.contextLost||typeof((b=this.gl)==null?void 0:b.isContextLost)=="function"&&this.gl.isContextLost())return;this.lastScene=t,this.frameCount++;const i=this.gl,s=this.info.render;s.calls=0,s.triangles=0,s.points=0,s.lines=0,s.instances=0,s.culled=0,s.programsReused=0,s.uniformsSkipped=0;const n=((v=this.timerPool)==null?void 0:v.begin())??null;t.updateMatrixWorld(!0),e.parent===null&&e.updateMatrixWorld(!0),this._viewMatrix.copy(e.matrixWorld).invert(),this._projectionMatrix.copy(e.projectionMatrix),this._projViewMatrix.copy(e.projectionMatrix).multiply(this._viewMatrix),this._camPos.setFromMatrixPosition(e.matrixWorld),this.frustumCullingEnabled&&this.frustum.setFromProjectionMatrix(this._projViewMatrix),this.clusteredLightManager.clear();const r=t.getLights(),a=[.08,.1,.14],l=[];let o=null;for(const p of r)if(p instanceof Tt)a[0]+=p.color.r*p.intensity,a[1]+=p.color.g*p.intensity,a[2]+=p.color.b*p.intensity;else if(p instanceof It){if(p.castShadow&&!o&&(o=p),l.length<3){const M=p.target&&typeof p.target.position=="object"?p.target.position:p.target instanceof w?p.target:new w(0,0,0),A=p.position.clone().sub(M).normalize();l.push({color:[p.color.r*p.intensity,p.color.g*p.intensity,p.color.b*p.intensity],dir:[A.x,A.y,A.z]})}}else p instanceof Dt?this.clusteredLightManager.registerPointLight(p):(p instanceof Nt||p.isSpotLight||p.name==="SpotLight"||p.angle!==void 0)&&this.clusteredLightManager.registerSpotLight(p);const u=l[0]??{color:[1.8,1.8,1.8],dir:[.5,1,.6]},f=l[1]??{color:[.6,.7,.9],dir:[-.6,.3,-.5]},d=l[2]??{color:[.4,.5,.8],dir:[-.3,.8,-.8]},c=this.clusteredLightManager.getPointLightCount(),x=this.clusteredLightManager.getSpotLightCount(),y=c>16||x>8;let S=[],g=[];y||(S=this.clusteredLightManager.getAllPointLightUniforms(),g=this.clusteredLightManager.getAllSpotLightUniforms()),this.renderList.length=0,this.shadowCasters.length=0,this.collectRenderables(t),this.opaqueList.length=0,this.transparentList.length=0;for(const p of this.renderList){const M=p.material;M&&(M.transparent===!0||M.opacity<1)?this.transparentList.push(p):this.opaqueList.push(p)}const m=(p,M)=>(p.renderOrder||0)-(M.renderOrder||0);this.opaqueList.sort(m),this.transparentList.sort(m);const E=!!(this.shadowMap.enabled&&o);if(E&&o&&this.renderShadowPass(o),t.background&&this.setClearColor(t.background),this.clear(),typeof i.activeTexture=="function"&&typeof i.bindTexture=="function"){const p=E&&this.shadowDepthTexture?this.shadowDepthTexture:this.getDummyTexture();p&&(i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,p),i.activeTexture(i.TEXTURE0))}for(const p of this.opaqueList){let M=S,A=g;if(y){this._objWorldPos.set(p.matrixWorld.elements[12],p.matrixWorld.elements[13],p.matrixWorld.elements[14]);const I=this.clusteredLightManager.getCulledLightsForObject(this._objWorldPos,16,8,p.geometry&&p.geometry.boundingSphere?p.geometry.boundingSphere.radius:0);M=I.pointLights,A=I.spotLights}this.renderObject(p,u,f,d,a,M,A,E?o:null)}for(const p of this.transparentList){let M=S,A=g;if(y){this._objWorldPos.set(p.matrixWorld.elements[12],p.matrixWorld.elements[13],p.matrixWorld.elements[14]);const I=this.clusteredLightManager.getCulledLightsForObject(this._objWorldPos,16,8,p.geometry&&p.geometry.boundingSphere?p.geometry.boundingSphere.radius:0);M=I.pointLights,A=I.spotLights}this.renderObject(p,u,f,d,a,M,A,E?o:null)}(L=this.timerPool)==null||L.end(n);const C=((T=this.timerPool)==null?void 0:T.poll())??null;C!==null&&(this.lastGpuTimeMs=C)}releaseShadowFBO(){const t=this.gl;if(t){if(this.shadowFBO){try{t.deleteFramebuffer(this.shadowFBO)}catch{}this.shadowFBO=null}if(this.shadowDepthTexture){try{t.deleteTexture(this.shadowDepthTexture)}catch{}this.shadowDepthTexture=null}if(this.dummyTexture){try{t.deleteTexture(this.dummyTexture)}catch{}this.dummyTexture=null}this.shadowMapSize=0}}setupShadowFBO(t){this.releaseShadowFBO();const e=this.gl;if(!e)return;const i=e.createTexture();if(!i)return;if(e.bindTexture(e.TEXTURE_2D,i),this.isWebGL2){const n=e;n.texImage2D(e.TEXTURE_2D,0,n.DEPTH_COMPONENT24||e.DEPTH_COMPONENT,t,t,0,e.DEPTH_COMPONENT,n.UNSIGNED_INT||e.UNSIGNED_SHORT,null)}else{const n=this.tryGetExtension("WEBGL_depth_texture"),r=(n==null?void 0:n.UNSIGNED_INT_24_8_WEBGL)||e.UNSIGNED_SHORT,a=n&&n.DEPTH_COMPONENT||e.DEPTH_COMPONENT;try{e.texImage2D(e.TEXTURE_2D,0,a,t,t,0,e.DEPTH_COMPONENT,r,null)}catch{try{e.texImage2D(e.TEXTURE_2D,0,e.RGBA,t,t,0,e.RGBA,e.UNSIGNED_BYTE,null)}catch{}}}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const s=e.createFramebuffer();if(s){e.bindFramebuffer(e.FRAMEBUFFER,s);try{e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,i,0)}catch{}if(this.isWebGL2&&typeof e.drawBuffers=="function")try{e.drawBuffers([e.NONE]),e.readBuffer(e.NONE)}catch{}e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,null),this.shadowFBO=s,this.shadowDepthTexture=i,this.shadowMapSize=t}}getDummyTexture(){if(this.dummyTexture)return this.dummyTexture;const t=this.gl;if(typeof t.createTexture!="function")return null;const e=t.createTexture();return e&&(t.bindTexture(t.TEXTURE_2D,e),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array([255,255,255,255])),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),this.dummyTexture=e),this.dummyTexture}textureParamsKey(t){return`${t.wrapS}|${t.wrapT}|${t.magFilter}|${t.minFilter}|${t.generateMipmaps}|${t.anisotropy}`}applyTextureParams(t,e){const i={clamp:t.CLAMP_TO_EDGE,repeat:t.REPEAT,mirror:t.MIRRORED_REPEAT},s={nearest:t.NEAREST,linear:t.LINEAR,"nearest-mipmap-nearest":t.NEAREST_MIPMAP_NEAREST,"linear-mipmap-nearest":t.LINEAR_MIPMAP_NEAREST,"nearest-mipmap-linear":t.NEAREST_MIPMAP_LINEAR,"linear-mipmap-linear":t.LINEAR_MIPMAP_LINEAR},n={nearest:t.NEAREST,linear:t.LINEAR,"nearest-mipmap-nearest":t.LINEAR,"linear-mipmap-nearest":t.LINEAR,"nearest-mipmap-linear":t.LINEAR,"linear-mipmap-linear":t.LINEAR};if(t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,i[e.wrapS]),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,i[e.wrapT]),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,n[e.magFilter]),e.generateMipmaps?t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,s[e.minFilter]):t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,n[e.magFilter]),e.anisotropy>1){const r=this.tryGetExtension("EXT_texture_filter_anisotropic")||this.tryGetExtension("WEBKIT_EXT_texture_filter_anisotropic");if(r){const a=t.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT)??1;t.texParameterf(t.TEXTURE_2D,r.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(e.anisotropy,a))}}}renderShadowPass(t){var l;const e=t.shadowMapSize||this.shadowMap.size||1024;if((!this.shadowFBO||this.shadowMapSize!==e)&&this.setupShadowFBO(e),!this.shadowFBO)return;const i=this.gl,s=t.target&&typeof t.target.position=="object"?t.target.position:t.target instanceof w?t.target:new w(0,0,0);this._lightViewMatrix.lookAt(t.position,s,new w(0,1,0)).invert();const n=t.shadowCameraSize||30,r=t.shadowCameraNear||.5,a=t.shadowCameraFar||500;this._lightProjMatrix.makeOrthographic(-n,n,n,-n,r,a),this._lightSpaceMatrix.multiplyMatrices(this._lightProjMatrix,this._lightViewMatrix),i.bindFramebuffer(i.FRAMEBUFFER,this.shadowFBO),i.viewport(0,0,e,e),i.clear(i.DEPTH_BUFFER_BIT),i.enable(i.DEPTH_TEST),i.depthFunc(i.LEQUAL),i.depthMask(!0),i.enable(i.CULL_FACE),i.cullFace(i.FRONT);for(let o=0;o<this.shadowCasters.length;o++){const u=this.shadowCasters[o];if(!u.visible)continue;const f=u.geometry;if(!f)continue;const d=!!(u.isInstancedMesh||u.count>0&&u.instanceMatrix);if(d&&u.count===0)continue;const c=!!(u.isSkinnedMesh&&u.skeleton),x=this.programs.getDepthProgram(d,c);if(i.useProgram(x.program),x.uniforms.uLightSpaceMatrix&&typeof i.uniformMatrix4fv=="function"&&i.uniformMatrix4fv(x.uniforms.uLightSpaceMatrix,!1,this._lightSpaceMatrix.elements),x.uniforms.uModelMatrix&&typeof i.uniformMatrix4fv=="function"&&i.uniformMatrix4fv(x.uniforms.uModelMatrix,!1,u.matrixWorld.elements),c){const g=u.skeleton;g.update(),x.uniforms.uBoneMatrices&&typeof i.uniformMatrix4fv=="function"&&i.uniformMatrix4fv(x.uniforms.uBoneMatrices,!1,g.boneMatrices),x.uniforms.uBindMatrix&&typeof i.uniformMatrix4fv=="function"&&i.uniformMatrix4fv(x.uniforms.uBindMatrix,!1,u.bindMatrix.elements),x.uniforms.uBindMatrixInverse&&typeof i.uniformMatrix4fv=="function"&&i.uniformMatrix4fv(x.uniforms.uBindMatrixInverse,!1,u.bindMatrixInverse.elements)}this.bindAttributes(f,x.attributes);let y=null;d&&(y=this.bindInstanceAttributes(u,x.attributes,!1)),((l=u.material)==null?void 0:l.side)==="double"?i.disable(i.CULL_FACE):(i.enable(i.CULL_FACE),i.cullFace(i.FRONT)),this.drawGeometry(f,u.material,u),y&&y()}i.bindFramebuffer(i.FRAMEBUFFER,null),i.cullFace(i.BACK),i.viewport(0,0,this.domElement.width,this.domElement.height)}collectRenderables(t){const e=this.frustumCullingEnabled,i=this.frustum,s=n=>{var a;if(!n.visible)return;if(n instanceof wt||n instanceof it||n instanceof Q||n.isInstancedMesh){if(n.castShadow===!0&&this.shadowCasters.push(n),e&&n.frustumCulled!==!1){const l=(a=n.getOrComputeWorldAABB)==null?void 0:a.call(n);if(l&&!i.intersectsAABB(l.worldMin,l.worldMax)){this.info.render.culled++;return}}this.renderList.push(n)}const r=n.children;for(let l=0;l<r.length;l++)s(r[l])};s(t)}renderObject(t,e,i,s,n,r=[],a=[],l=null){var T;const o=this.gl,u=t.geometry,f=t.material;if(!f||f.visible===!1)return;const d=!!(t.isInstancedMesh||t.count>0&&t.instanceMatrix);if(d&&t.count===0)return;const c=!!(d&&t.instanceColor),x=!!(this.shadowMap.enabled&&l),y=!!(t.isSkinnedMesh&&t.skeleton),S=this.programs.getProgramInfo(f,d,c,x,y);o.useProgram(S.program);const g=this.programs.getUniformCache(S.program),m=S.uniforms,E=p=>{p&&this.info.render.uniformsSkipped++},C=t.matrixWorld,b=this._viewMatrix.clone().multiply(C);if(E(g.uniformMatrix4fv(o,m.uModelMatrix??null,C.elements)),E(g.uniformMatrix4fv(o,m.uViewMatrix??null,this._viewMatrix.elements)),E(g.uniformMatrix4fv(o,m.uProjectionMatrix??null,((T=t.userData)==null?void 0:T._projectionElements)??this._projectionMatrix.elements)),E(g.uniformMatrix4fv(o,m.uModelViewMatrix??null,b.elements)),E(g.uniform3f(o,m.uCameraPosition??null,this._camPos.x,this._camPos.y,this._camPos.z)),y){const p=t.skeleton;p.update(),m.uBoneMatrices&&typeof o.uniformMatrix4fv=="function"&&o.uniformMatrix4fv(m.uBoneMatrices,!1,p.boneMatrices),m.uBindMatrix&&typeof o.uniformMatrix4fv=="function"&&o.uniformMatrix4fv(m.uBindMatrix,!1,t.bindMatrix.elements),m.uBindMatrixInverse&&typeof o.uniformMatrix4fv=="function"&&o.uniformMatrix4fv(m.uBindMatrixInverse,!1,t.bindMatrixInverse.elements)}if("color"in f&&f.color&&m.uColor){const p=f.color;E(g.uniform3f(o,m.uColor,p.r,p.g,p.b))}E(g.uniform1f(o,m.uOpacity??null,f.opacity??1));const v=f==null?void 0:f.map;if(v&&m.uHasMap){const p=v instanceof Bt,M=v&&v.image?v.image:v;if(M&&M.width>0&&M.height>0){const A=p?v.version:0,I=p?v._glTexture:f._glTexture,O=p?v._glVersion:0,P=p?v._glParamsKey:null,N=p?this.textureParamsKey(v):null;if(!I||O!==A||P!==N){const D=I||o.createTexture();if(o.bindTexture(o.TEXTURE_2D,D),p){this.applyTextureParams(o,v);const R=o.getParameter(o.UNPACK_FLIP_Y_WEBGL);if(o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,v.flipY?1:0),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,M),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,R),v.generateMipmaps)try{o.generateMipmap(o.TEXTURE_2D)}catch{}}else{o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,M),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR_MIPMAP_LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.REPEAT),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.REPEAT);try{o.generateMipmap(o.TEXTURE_2D)}catch{}}p?(v._glTexture=D,v._glVersion=v.version,v._glParamsKey=N):f._glTexture=D}const z=p?v._glTexture:f._glTexture;o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,z),E(g.uniform1i(o,m.uHasMap,1)),m.uMap&&o.uniform1i(m.uMap,0)}else E(g.uniform1i(o,m.uHasMap,0))}else m.uHasMap&&E(g.uniform1i(o,m.uHasMap,0));if(m.uIsPoints&&E(g.uniform1i(o,m.uIsPoints,t instanceof Q?1:0)),m.uPointSize){const p=f.size??2;E(g.uniform1f(o,m.uPointSize,p))}if(m.uHasVertexColors&&E(g.uniform1i(o,m.uHasVertexColors,u.getAttribute("color")?1:0)),E(g.uniform3fv(o,m.uAmbientLightColor??null,n)),E(g.uniform3fv(o,m.uKeyLightColor??null,e.color)),E(g.uniform3fv(o,m.uKeyLightDir??null,e.dir)),E(g.uniform3fv(o,m.uFillLightColor??null,i.color)),E(g.uniform3fv(o,m.uFillLightDir??null,i.dir)),E(g.uniform3fv(o,m.uRimLightColor??null,s.color)),E(g.uniform3fv(o,m.uRimLightDir??null,s.dir)),m.uShadowMap&&typeof o.uniform1i=="function"&&o.uniform1i(m.uShadowMap,1),m.uLightSpaceMatrix&&typeof o.uniformMatrix4fv=="function"&&o.uniformMatrix4fv(m.uLightSpaceMatrix,!1,this._lightSpaceMatrix.elements),m.uShadowMapSize&&typeof o.uniform2f=="function"){const p=(l==null?void 0:l.shadowMapSize)||this.shadowMap.size||1024;o.uniform2f(m.uShadowMapSize,p,p)}if(m.uShadowBias&&typeof o.uniform1f=="function"&&o.uniform1f(m.uShadowBias,(l==null?void 0:l.shadowBias)??5e-4),m.uReceiveShadow&&typeof o.uniform1i=="function"&&o.uniform1i(m.uReceiveShadow,t.receiveShadow?1:0),m.uShadowMapEnabled&&typeof o.uniform1i=="function"&&o.uniform1i(m.uShadowMapEnabled,x?1:0),m.uNumPointLights){const p=Math.min(r.length,16);if(o.uniform1i(m.uNumPointLights,p),p>0){for(let M=0;M<p;M++)this._pointLightColors[M*3]=r[M].color[0],this._pointLightColors[M*3+1]=r[M].color[1],this._pointLightColors[M*3+2]=r[M].color[2],this._pointLightPositions[M*3]=r[M].position[0],this._pointLightPositions[M*3+1]=r[M].position[1],this._pointLightPositions[M*3+2]=r[M].position[2],this._pointLightDistances[M]=r[M].distance,this._pointLightDecays[M]=r[M].decay;m.uPointLightColor&&o.uniform3fv(m.uPointLightColor,this._pointLightColors),m.uPointLightPos&&o.uniform3fv(m.uPointLightPos,this._pointLightPositions),m.uPointLightDistance&&o.uniform1fv(m.uPointLightDistance,this._pointLightDistances),m.uPointLightDecay&&o.uniform1fv(m.uPointLightDecay,this._pointLightDecays)}}if(m.uNumSpotLights){const p=Math.min(a.length,8);if(o.uniform1i(m.uNumSpotLights,p),p>0){for(let M=0;M<p;M++)this._spotLightColors[M*3]=a[M].color[0],this._spotLightColors[M*3+1]=a[M].color[1],this._spotLightColors[M*3+2]=a[M].color[2],this._spotLightPositions[M*3]=a[M].position[0],this._spotLightPositions[M*3+1]=a[M].position[1],this._spotLightPositions[M*3+2]=a[M].position[2],this._spotLightDirs[M*3]=a[M].dir[0],this._spotLightDirs[M*3+1]=a[M].dir[1],this._spotLightDirs[M*3+2]=a[M].dir[2],this._spotLightDistances[M]=a[M].distance,this._spotLightDecays[M]=a[M].decay,this._spotLightConeCos[M]=a[M].coneCos,this._spotLightPenumbraCos[M]=a[M].penumbraCos;m.uSpotLightColor&&o.uniform3fv(m.uSpotLightColor,this._spotLightColors),m.uSpotLightPos&&o.uniform3fv(m.uSpotLightPos,this._spotLightPositions),m.uSpotLightDir&&o.uniform3fv(m.uSpotLightDir,this._spotLightDirs),m.uSpotLightDistance&&o.uniform1fv(m.uSpotLightDistance,this._spotLightDistances),m.uSpotLightDecay&&o.uniform1fv(m.uSpotLightDecay,this._spotLightDecays),m.uSpotLightConeCos&&o.uniform1fv(m.uSpotLightConeCos,this._spotLightConeCos),m.uSpotLightPenumbraCos&&o.uniform1fv(m.uSpotLightPenumbraCos,this._spotLightPenumbraCos)}}if(f instanceof ht){if(E(g.uniform1f(o,m.uRoughness??null,f.roughness??.5)),E(g.uniform1f(o,m.uMetalness??null,f.metalness??0)),E(g.uniform1f(o,m.uClearcoat??null,f.clearcoat??0)),E(g.uniform1f(o,m.uClearcoatRoughness??null,f.clearcoatRoughness??.1)),m.uEmissive){const p=f.emissive;p instanceof F?E(g.uniform3f(o,m.uEmissive,p.r,p.g,p.b)):typeof p=="string"?(this._tmpColor.setStyle(p),E(g.uniform3f(o,m.uEmissive,this._tmpColor.r,this._tmpColor.g,this._tmpColor.b))):E(g.uniform3f(o,m.uEmissive,0,0,0))}E(g.uniform1f(o,m.uEmissiveIntensity??null,f.emissiveIntensity??1))}if(f instanceof at&&(E(g.uniform1f(o,m.uShininess??null,f.shininess??30)),m.uSpecular)){const p=f.specular;p instanceof F?E(g.uniform3f(o,m.uSpecular,p.r,p.g,p.b)):typeof p=="string"||typeof p=="number"?(this._tmpColor.setStyle(p),E(g.uniform3f(o,m.uSpecular,this._tmpColor.r,this._tmpColor.g,this._tmpColor.b))):E(g.uniform3f(o,m.uSpecular,1,1,1))}f instanceof Z&&this.bindShaderUniforms(f,S.program,g),this.bindAttributes(u,S.attributes);let L=null;d&&(L=this.bindInstanceAttributes(t,S.attributes,c)),this.applyDrawState(f,t),this.drawGeometry(u,f,t),L&&L()}bindShaderUniforms(t,e,i){const s=this.gl,n=t.uniforms;if(!n)return;const r=new Map,a=typeof s.getProgramParameter=="function"&&s.ACTIVE_UNIFORMS!==void 0&&s.getProgramParameter(e,s.ACTIVE_UNIFORMS)||0;for(let o=0;o<a;o++){const u=typeof s.getActiveUniform=="function"?s.getActiveUniform(e,o):null;u&&r.set(u.name.replace(/\[0\]$/,""),u)}const l=new Set([s.INT,s.BOOL,s.SAMPLER_2D,s.SAMPLER_CUBE,s.INT_VEC2,s.INT_VEC3,s.INT_VEC4,s.BOOL_VEC2,s.BOOL_VEC3,s.BOOL_VEC4]);for(const o in n){const u=n[o],f=s.getUniformLocation(e,o);if(f===null)continue;const d=u.value,c=r.get(o);if(typeof d=="number"){const x=c?l.has(c.type):u.type==="int"||u.type==="bool",y=(c==null?void 0:c.size)??1;if(x)if(y>1){const S=new Int32Array(y);S[0]=u.type==="bool"?d?1:0:d,s.uniform1iv(f,S)}else i.uniform1i(s,f,u.type==="bool"?d?1:0:d);else if(!c||c.type===s.FLOAT)if(y>1){const S=new Float32Array(y);S[0]=d,s.uniform1fv(f,S)}else i.uniform1f(s,f,d);else console.warn(`[WebGLRenderer] Numeric uniform "${o}" has an unsupported GLSL type; pass a matching vector value.`)}else if(typeof d=="boolean")if(c&&!l.has(c.type)&&c.type===s.FLOAT)if(c.size>1){const x=new Float32Array(c.size);x[0]=d?1:0,s.uniform1fv(f,x)}else i.uniform1f(s,f,d?1:0);else if(c&&c.size>1){const x=new Int32Array(c.size);x[0]=d?1:0,s.uniform1iv(f,x)}else i.uniform1i(s,f,d?1:0);else if(Array.isArray(d)||ArrayBuffer.isView(d)){const x=d.length;x===2?s.uniform2fv(f,d):x===3?i.uniform3fv(s,f,d):x===4?s.uniform4fv(f,d):x===9?s.uniformMatrix3fv(f,!1,d):x===16&&i.uniformMatrix4fv(s,f,d)}else if(d&&typeof d=="object"&&"elements"in d&&Array.isArray(d.elements)){const x=d.elements;x.length===16?i.uniformMatrix4fv(s,f,x):x.length===9&&s.uniformMatrix3fv(f,!1,x)}}}releaseGeometry(t){if(!t)return;const e=this.gl;if(!e)return;const i=n=>{if(n&&n.buffer){try{e.deleteBuffer(n.buffer)}catch{}n.buffer=null}},s=t.attributes;if(s)for(const n in s)i(s[n]);t.index&&i(t.index)}releaseInstancedMesh(t){if(!t)return;const e=this.gl;if(e){if(t._instanceMatrixBuffer){try{e.deleteBuffer(t._instanceMatrixBuffer)}catch{}t._instanceMatrixBuffer=null}if(t._instanceColorBuffer){try{e.deleteBuffer(t._instanceColorBuffer)}catch{}t._instanceColorBuffer=null}}}bindAttributes(t,e){const i=this.gl,s=t.attributes;for(const r in s){const a=s[r],l=e["a"+r.charAt(0).toUpperCase()+r.slice(1)];if(l===void 0||l===-1)continue;const o=this.glTypeForArray(a.array);a.buffer?(i.bindBuffer(i.ARRAY_BUFFER,a.buffer),a.needsUpdate&&(a.array.byteLength>(a.bufferSize??0)&&(i.deleteBuffer(a.buffer),a.buffer=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,a.buffer),a.bufferSize=a.array.byteLength),i.bufferData(i.ARRAY_BUFFER,a.array,i.DYNAMIC_DRAW),a.needsUpdate=!1)):(a.buffer=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,a.buffer),i.bufferData(i.ARRAY_BUFFER,a.array,i.DYNAMIC_DRAW),a.bufferSize=a.array.byteLength),i.enableVertexAttribArray(l),i.vertexAttribPointer(l,a.itemSize,o,!1,0,0)}const n=[["normal",e.aNormal,[0,0,1,0]],["color",e.aColor,[1,1,1,1]],["uv",e.aUv,[0,0,0,1]],["skinIndex",e.aSkinIndex,[0,0,0,0]],["skinWeight",e.aSkinWeight,[1,0,0,0]]];for(const[r,a,l]of n)a!==void 0&&a>=0&&!s[r]&&(typeof i.disableVertexAttribArray=="function"&&i.disableVertexAttribArray(a),typeof i.vertexAttrib4f=="function"&&i.vertexAttrib4f(a,l[0],l[1],l[2],l[3]))}bindInstanceAttributes(t,e,i){const s=this.gl,n=e.aInstanceMatrix,r=[];if(n!==void 0&&n!==-1&&t.instanceMatrix){t._instanceMatrixBuffer?(s.bindBuffer(s.ARRAY_BUFFER,t._instanceMatrixBuffer),(t.instanceMatrixNeedsUpdate||t.instanceMatrix.needsUpdate)&&(s.bufferData(s.ARRAY_BUFFER,t.instanceMatrix,s.DYNAMIC_DRAW),t.instanceMatrixNeedsUpdate=!1,t.instanceMatrix.needsUpdate!==void 0&&(t.instanceMatrix.needsUpdate=!1))):(t._instanceMatrixBuffer=s.createBuffer(),s.bindBuffer(s.ARRAY_BUFFER,t._instanceMatrixBuffer),s.bufferData(s.ARRAY_BUFFER,t.instanceMatrix,s.DYNAMIC_DRAW),t.instanceMatrixNeedsUpdate=!1,t.instanceMatrix.needsUpdate!==void 0&&(t.instanceMatrix.needsUpdate=!1));for(let l=0;l<4;l++){const o=n+l;s.enableVertexAttribArray(o),s.vertexAttribPointer(o,4,s.FLOAT,!1,64,l*16),this.vertexAttribDivisor(o,1),r.push(()=>{this.vertexAttribDivisor(o,0),s.disableVertexAttribArray(o)})}}const a=e.aInstanceColor;return i&&a!==void 0&&a!==-1&&t.instanceColor&&(t._instanceColorBuffer?(s.bindBuffer(s.ARRAY_BUFFER,t._instanceColorBuffer),(t.instanceColorNeedsUpdate||t.instanceColor.needsUpdate)&&(s.bufferData(s.ARRAY_BUFFER,t.instanceColor,s.DYNAMIC_DRAW),t.instanceColorNeedsUpdate=!1,t.instanceColor.needsUpdate!==void 0&&(t.instanceColor.needsUpdate=!1))):(t._instanceColorBuffer=s.createBuffer(),s.bindBuffer(s.ARRAY_BUFFER,t._instanceColorBuffer),s.bufferData(s.ARRAY_BUFFER,t.instanceColor,s.DYNAMIC_DRAW),t.instanceColorNeedsUpdate=!1,t.instanceColor.needsUpdate!==void 0&&(t.instanceColor.needsUpdate=!1)),s.enableVertexAttribArray(a),s.vertexAttribPointer(a,3,s.FLOAT,!1,12,0),this.vertexAttribDivisor(a,1),r.push(()=>{this.vertexAttribDivisor(a,0),s.disableVertexAttribArray(a)})),r.length===0?null:()=>{for(let l=0;l<r.length;l++)r[l]()}}glTypeForArray(t){const e=this.gl;switch(t.constructor){case Float32Array:return e.FLOAT;case Int8Array:return e.BYTE;case Uint8Array:return e.UNSIGNED_BYTE;case Int16Array:return e.SHORT;case Uint16Array:return e.UNSIGNED_SHORT;case Int32Array:return e.INT;case Uint32Array:return e.UNSIGNED_INT;default:return e.FLOAT}}applyDrawState(t,e){const i=this.gl,s=e instanceof Q,n=e instanceof it;t.wireframe||s||n||t.side==="double"?i.disable(i.CULL_FACE):t.side==="back"?(i.enable(i.CULL_FACE),i.cullFace(i.FRONT)):(i.enable(i.CULL_FACE),i.cullFace(i.BACK));const r=t.depthWrite!==void 0?t.depthWrite:!t.transparent;i.depthMask(r),t.depthTest===!1?i.disable(i.DEPTH_TEST):i.enable(i.DEPTH_TEST),t.polygonOffset?(i.enable(i.POLYGON_OFFSET_FILL),i.polygonOffset(t.polygonOffsetFactor??1,t.polygonOffsetUnits??1)):i.disable(i.POLYGON_OFFSET_FILL)}drawElementsInstanced(t,e,i,s,n){const r=this.gl;if(this.isWebGL2)r.drawElementsInstanced(t,e,i,s,n);else if(this.instancingExt)this.instancingExt.drawElementsInstancedANGLE(t,e,i,s,n);else for(let a=0;a<n;a++)r.drawElements(t,e,i,s)}drawArraysInstanced(t,e,i,s){const n=this.gl;if(this.isWebGL2)n.drawArraysInstanced(t,e,i,s);else if(this.instancingExt)this.instancingExt.drawArraysInstancedANGLE(t,e,i,s);else for(let r=0;r<s;r++)n.drawArrays(t,e,i)}vertexAttribDivisor(t,e){const i=this.gl;t===-1||t===void 0||(this.isWebGL2?i.vertexAttribDivisor(t,e):this.instancingExt&&this.instancingExt.vertexAttribDivisorANGLE(t,e))}drawGeometry(t,e,i){var u;const s=this.gl;this.info.render.calls++;const n=!!(i.isInstancedMesh||i.count>0&&i.instanceMatrix),r=n?i.count:1,a=i instanceof Q,l=i instanceof it,o=e.wireframe||l?s.LINES:a?s.POINTS:s.TRIANGLES;if(t.index){const f=t.index;f.buffer?s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,f.buffer):(f.buffer=s.createBuffer(),s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,f.buffer),s.bufferData(s.ELEMENT_ARRAY_BUFFER,f.array,s.STATIC_DRAW));const d=f.array instanceof Uint32Array?s.UNSIGNED_INT:s.UNSIGNED_SHORT,c=f.array.length;n&&r>0?(this.drawElementsInstanced(o,c,d,0,r),this.info.render.instances!==void 0&&(this.info.render.instances+=r),o===s.TRIANGLES?this.info.render.triangles+=Math.floor(c/3)*r:o===s.POINTS?this.info.render.points+=c*r:o===s.LINES&&(this.info.render.lines+=Math.floor(c/2)*r)):(s.drawElements(o,c,d,0),o===s.TRIANGLES?this.info.render.triangles+=Math.floor(c/3):o===s.POINTS?this.info.render.points+=c:o===s.LINES&&(this.info.render.lines+=Math.floor(c/2)))}else{const f=(u=t.getAttribute)==null?void 0:u.call(t,"position");if(!f)return;const d=f.array.length/f.itemSize;n&&r>0?(this.drawArraysInstanced(o,0,d,r),this.info.render.instances!==void 0&&(this.info.render.instances+=r),o===s.TRIANGLES?this.info.render.triangles+=Math.floor(d/3)*r:o===s.POINTS?this.info.render.points+=d*r:o===s.LINES&&(this.info.render.lines+=Math.floor(d/2)*r)):(s.drawArrays(o,0,d),o===s.TRIANGLES?this.info.render.triangles+=Math.floor(d/3):o===s.POINTS?this.info.render.points+=d:o===s.LINES&&(this.info.render.lines+=Math.floor(d/2)))}s.depthMask(!0),s.enable(s.DEPTH_TEST)}}class Qt{constructor(t,e){h(this,"camera");h(this,"domElement");h(this,"enabled",!0);h(this,"target",new w(0,0,0));h(this,"minDistance",.5);h(this,"maxDistance",500);h(this,"enableDamping",!0);h(this,"dampingFactor",.05);h(this,"rotateSpeed",1);h(this,"zoomSpeed",1.2);h(this,"panSpeed",1);h(this,"isPointerDown",!1);h(this,"pointerType",null);h(this,"pointerStart",new $);h(this,"pointerEnd",new $);h(this,"sphericalDelta",{radius:1,theta:0,phi:0});h(this,"panOffset",new w);h(this,"theta",0);h(this,"phi",Math.PI/4);h(this,"radius",10);h(this,"onPointerDown",t=>{var e,i;if(this.enabled&&!(t.button!==0&&t.button!==2)){t.preventDefault(),this.isPointerDown=!0,this.pointerStart.set(t.clientX,t.clientY);try{(i=(e=this.domElement).setPointerCapture)==null||i.call(e,t.pointerId)}catch{}this.pointerType=t.button===2?"pan":"rotate"}});h(this,"onPointerMove",t=>{if(!this.enabled||!this.isPointerDown)return;this.pointerEnd.set(t.clientX,t.clientY);const e=new $().subVectors(this.pointerEnd,this.pointerStart);if(this.pointerType==="rotate"){const i=this.domElement.clientHeight||window.innerHeight,s=this.domElement.clientWidth||window.innerWidth;this.sphericalDelta.theta-=2*Math.PI*e.x/s*this.rotateSpeed,this.sphericalDelta.phi-=2*Math.PI*e.y/i*this.rotateSpeed}else this.pointerType==="pan"&&this.pan(e.x,e.y);this.pointerStart.copy(this.pointerEnd)});h(this,"onPointerUp",t=>{var e,i;if(this.isPointerDown=!1,this.pointerType=null,t)try{(i=(e=this.domElement).releasePointerCapture)==null||i.call(e,t.pointerId)}catch{}});h(this,"onMouseWheel",t=>{if(!this.enabled)return;t.preventDefault();const e=Math.pow(.95,t.deltaY*.01*this.zoomSpeed);this.radius*=e,this.radius=Math.max(this.minDistance,Math.min(this.maxDistance,this.radius))});h(this,"onContextMenu",t=>{t.preventDefault()});this.camera=t,this.domElement=e,this.updateSphericalFromCamera(),this.domElement.style.touchAction="none",this.addEventListeners()}updateSphericalFromCamera(){const t=new w().subVectors(this.camera.position,this.target);this.radius=t.length()||10,this.theta=Math.atan2(t.x,t.z),this.phi=Math.acos(Math.max(-1,Math.min(1,t.y/(this.radius||1)))),this.sphericalDelta.theta=0,this.sphericalDelta.phi=0}setDistance(t){this.radius=Math.max(this.minDistance,Math.min(this.maxDistance,t)),this.update()}getDistance(){return this.radius}addEventListeners(){this.domElement.addEventListener("pointerdown",this.onPointerDown),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),window.addEventListener("pointercancel",this.onPointerUp),this.domElement.addEventListener("wheel",this.onMouseWheel,{passive:!1}),this.domElement.addEventListener("contextmenu",this.onContextMenu)}dispose(){this.domElement.removeEventListener("pointerdown",this.onPointerDown),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp),window.removeEventListener("pointercancel",this.onPointerUp),this.domElement.removeEventListener("wheel",this.onMouseWheel),this.domElement.removeEventListener("contextmenu",this.onContextMenu)}pan(t,e){const i=new w,s=this.camera.matrixWorld,n=new w(s.elements[0],s.elements[1],s.elements[2]).normalize(),r=new w(s.elements[4],s.elements[5],s.elements[6]).normalize(),a=this.radius*.002*this.panSpeed;i.add(n.multiplyScalar(-t*a)),i.add(r.multiplyScalar(e*a)),this.panOffset.add(i)}update(){this.enableDamping?(this.theta+=this.sphericalDelta.theta*this.dampingFactor,this.phi+=this.sphericalDelta.phi*this.dampingFactor,this.sphericalDelta.theta*=1-this.dampingFactor,this.sphericalDelta.phi*=1-this.dampingFactor):(this.theta+=this.sphericalDelta.theta,this.phi+=this.sphericalDelta.phi,this.sphericalDelta.theta=0,this.sphericalDelta.phi=0),this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this.target.add(this.panOffset),this.panOffset.set(0,0,0);const e=this.radius*Math.sin(this.phi),i=e*Math.sin(this.theta),s=this.radius*Math.cos(this.phi),n=e*Math.cos(this.theta);this.camera.position.set(i,s,n).add(this.target),this.camera.lookAt(this.target),this.camera.updateMatrixWorld(!0)}}export{Tt as A,nt as B,F as C,It as D,it as L,ot as M,W as O,Q as P,J as Q,Z as S,Bt as T,w as V,qt as W,wt as a,Yt as b,$t as c,Qt as d,Dt as e,ht as f,G as g};
