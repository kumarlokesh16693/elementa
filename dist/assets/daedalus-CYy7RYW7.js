var Bt=Object.defineProperty;var Wt=(i,e,t)=>e in i?Bt(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var g=(i,e,t)=>Wt(i,typeof e!="symbol"?e+"":e,t);import{h as jt,e as Yt,p as Xt,m as Kt}from"./index-DvYDLWkq.js";import{B as K,M as xt,P as Jt,T as Zt,O as Vt,S as yt,a as ht,C as Qt,W as te,b as ee,c as ae,d as se,A as ie,D as ne,e as oe,L as Pt,V as st,f as re,g as ce}from"./OrbitControls-dwX2Rayh.js";import{S as St}from"./SphereGeometry-BasP75t7.js";const X=287.053,ct=[0,11e3,2e4,32e3,47e3,51e3,71e3,86e3],vt=[288.15,216.65,216.65,228.65,270.65,270.65,214.65,186.87],le=[-.0065,0,.001,.0028,0,-.0028,-.002,0],kt=[101325,22632.1,5474.89,868.019,110.906,66.9389,3.95642,.3734],lt=[[86e3,5550],[1e5,6e3],[12e4,11e3],[15e4,18e3]],he=kt[7]/(X*vt[7]);function de(i){const e=Math.max(0,Math.min(i,159999));let t,s;if(e<=ct[7]){let n=0;for(let r=ct.length-1;r>=0;r--)if(e>=ct[r]){n=r;break}const o=le[n];t=vt[n]+o*(e-ct[n]),Math.abs(o)<1e-12?s=kt[n]*Math.exp(-9.80665*(e-ct[n])/(X*vt[n])):s=kt[n]*Math.pow(t/vt[n],-9.80665/(o*X))}else{let n=he;for(let o=0;o<lt.length;o++){const r=lt[o][0],l=lt[o][1],m=o+1<lt.length?lt[o+1][0]:16e4;if(e>r){const h=Math.min(e,m);n*=Math.exp(-(h-r)/l)}}return t=Math.min(600,186.87+1.2*(e-86e3)/1e3),s=n*X*t,{rho:n,T:t,p:s,a:Math.sqrt(1.4*X*t)}}return{rho:s/(X*t),T:t,p:s,a:Math.sqrt(1.4*X*t)}}const Mt=214,me=.02,pe=11100,Ot=191.9,ue=1.29;function ge(i){const e=Math.max(0,Math.min(i,2e5)),t=me*Math.exp(-e/pe),s=t*Ot*Mt;return{rho:t,T:Mt,p:s,a:Math.sqrt(ue*Ot*Mt)}}function Dt(i,e){return i==="mars"?ge(e):de(e)}const fe=9.80665,I={earth:{id:"earth",name:"EARTH",radius:6371e3,mu:3986004418e5,entryInterface:12e4,kSG:17415e-8,color:"#5ea8ff"},mars:{id:"mars",name:"MARS",radius:3389500,mu:4282837e7,entryInterface:14e4,kSG:19027e-8,color:"#ff7a59"}};function T(i,e,t){return Math.min(t,Math.max(e,i))}const gt=180/Math.PI,_=Math.PI/180,At=[{p:0,c:[10,34,90]},{p:.18,c:[33,113,181]},{p:.34,c:[65,182,196]},{p:.48,c:[128,205,165]},{p:.6,c:[247,227,95]},{p:.74,c:[248,140,40]},{p:.88,c:[227,45,25]},{p:1,c:[255,244,230]}];function Ht(i){const e=T(i,0,1);for(let t=0;t<At.length-1;t++){const s=At[t],a=At[t+1];if(e>=s.p&&e<=a.p){const n=(e-s.p)/(a.p-s.p||1);return[(s.c[0]+(a.c[0]-s.c[0])*n)/255,(s.c[1]+(a.c[1]-s.c[1])*n)/255,(s.c[2]+(a.c[2]-s.c[2])*n)/255]}}return[1,1,1]}const xe=`linear-gradient(90deg,
  rgb(10,34,90) 0%,
  rgb(33,113,181) 18%,
  rgb(65,182,196) 34%,
  rgb(128,205,165) 48%,
  rgb(247,227,95) 60%,
  rgb(248,140,40) 74%,
  rgb(227,45,25) 88%,
  rgb(255,244,230) 100%)`,Ct={waverider:{id:"waverider",name:"MACH 16 WAVERIDER",short:"MACH 16 WAVERIDER",planet:"earth",vehicle:"waverider",mode:"cruise",ic:{h:44e3,v:4400,gamma:.4,alpha:18,sigma:0},hRef:44e3,blurb:"Airbreathing-class hypersonic glider riding its own shock — hold the corridor."},leo:{id:"leo",name:"LEO DEORBIT / ENTRY",short:"LEO DEORBIT",planet:"earth",vehicle:"capsule",mode:"entry",ic:{h:12e4,v:7800,gamma:-1.8,alpha:20,sigma:0},gRef:4,gammaRef:-2.2,blurb:"Shuttle-class orbital entry from a 400 km deorbit burn."},apollo:{id:"apollo",name:"APOLLO LUNAR RETURN",short:"APOLLO LUNAR",planet:"earth",vehicle:"apollo",mode:"entry",ic:{h:122e3,v:11020,gamma:-6.4,alpha:22,sigma:0},gRef:4.5,gammaRef:-4,blurb:"Superorbital entry at 11 km/s — radiative heating regime."},mars:{id:"mars",name:"MARS AEROCAPTURE",short:"MARS AEROCAPTURE",planet:"mars",vehicle:"msl",mode:"aerocapture",ic:{h:14e4,v:5900,gamma:-9.5,alpha:20,sigma:0},gRef:4,gammaRef:-1.5,blurb:"Dissolve interplanetary energy in one CO2 pass — capture, not impact."}},qt=["leo","apollo","mars","waverider"],Rt={capsule:{id:"capsule",name:"CREW CAPSULE",kind:"capsule",m:8500,A:12.8,Rn:2,cl:i=>.7*Math.sin(2*i),cd:i=>1.28+.25*Math.sin(i),limits:{heat:120,g:6,q:45},blurb:"Blunt-body ballistic capsule, L/D ≈ 0.3"},apollo:{id:"apollo",name:"APOLLO CM",kind:"capsule",m:5560,A:12,Rn:2.5,cl:i=>.7*Math.sin(2*i),cd:i=>1.3+.22*Math.sin(i),limits:{heat:500,g:8,q:40},blurb:"Lunar-return blunt body, superorbital entry"},waverider:{id:"waverider",name:"SR-72/X-51 CLASS WAVERIDER",kind:"waverider",m:13500,A:42,Rn:.45,cl:i=>.05+.75*i,cd:i=>.04+1.18*i*i,clLin:{cl0:.05,cla:.75},limits:{heat:150,g:3.5,q:60},blurb:"High L/D compression-lift glider, Mach 16 class"},msl:{id:"msl",name:"MSL-CLASS AEROSHELL",kind:"capsule",m:3300,A:15.4,Rn:1.1,cl:i=>.62*Math.sin(2*i),cd:i=>1.36+.2*Math.sin(i),limits:{heat:90,g:6,q:20},blurb:"70° cone aeroshell for CO2 aerocapture"}},ve=.02,_t=.1,be=.5,we=6e3,ye=4e3;class Se{constructor(){g(this,"cfg");g(this,"veh");g(this,"t",0);g(this,"v",4400);g(this,"gamma",0);g(this,"r",I.earth.radius+44e3);g(this,"theta",0);g(this,"alpha",18);g(this,"sigma",0);g(this,"apAlpha",18);g(this,"apSigma",0);g(this,"autopilot",!1);g(this,"paused",!1);g(this,"landed",!1);g(this,"captured",!1);g(this,"warp",5);g(this,"recording",!1);g(this,"history",[]);g(this,"snapshots",[]);g(this,"recordingData",[]);g(this,"heatLoad",0);g(this,"theta0",0);g(this,"histAcc",0);g(this,"snapAcc",0);g(this,"histStride",1);g(this,"snapStride",1);g(this,"lastHeat",0);g(this,"version",0);g(this,"cfgVersion",0);g(this,"ui");g(this,"listeners",new Set);g(this,"emitAcc",0);g(this,"subscribe",e=>(this.listeners.add(e),()=>{this.listeners.delete(e)}));g(this,"getVersion",()=>this.version);this.cfg=Ct.waverider,this.veh=Rt[this.cfg.vehicle],this.resetState(),this.ui=this.buildUi()}emit(e=!1){this.emitAcc+=1,!(!e&&this.emitAcc<2)&&(this.emitAcc=0,this.ui=this.buildUi(),this.version++,this.listeners.forEach(t=>t()))}loadMission(e){this.cfg=Ct[e],this.veh=Rt[this.cfg.vehicle],this.resetState(),this.cfgVersion++,this.emit(!0)}reset(){this.resetState(),this.emit(!0)}resetState(){const e=this.cfg.ic,t=I[this.cfg.planet];this.t=0,this.v=e.v,this.gamma=e.gamma*_,this.r=t.radius+e.h,this.theta=0,this.theta0=0,this.alpha=e.alpha,this.sigma=e.sigma,this.apAlpha=e.alpha,this.apSigma=e.sigma,this.autopilot=!1,this.paused=!1,this.landed=!1,this.captured=!1,this.heatLoad=0,this.lastHeat=0,this.history=[],this.snapshots=[],this.recordingData=[],this.histAcc=0,this.snapAcc=0,this.histStride=1,this.snapStride=1,this.pushHist()}deriv(e,t,s){const a=I[this.cfg.planet],n=e.r-a.radius,o=Dt(this.cfg.planet,Math.max(n,0)),r=n>0?o.rho:0,l=Math.max(e.v,5),m=.5*r*l*l,h=this.veh.cd(t),c=this.veh.cl(t),u=m*this.veh.A*h/this.veh.m,p=m*this.veh.A*c/this.veh.m,w=a.mu/(e.r*e.r),y=Math.cos(e.gamma),f=Math.sin(e.gamma);return{v:-u-w*f,gamma:p*Math.cos(s)/l+(l/e.r-w/l)*y,r:l*f,theta:l*y/e.r}}rk4(e){const t={v:this.v,gamma:this.gamma,r:this.r,theta:this.theta},s=this.alpha*_,a=this.sigma*_,n=this.deriv(t,s,a),o=this.deriv({v:t.v+e/2*n.v,gamma:t.gamma+e/2*n.gamma,r:t.r+e/2*n.r,theta:t.theta+e/2*n.theta},s,a),r=this.deriv({v:t.v+e/2*o.v,gamma:t.gamma+e/2*o.gamma,r:t.r+e/2*o.r,theta:t.theta+e/2*o.theta},s,a),l=this.deriv({v:t.v+e*r.v,gamma:t.gamma+e*r.gamma,r:t.r+e*r.r,theta:t.theta+e*r.theta},s,a);t.v+=e/6*(n.v+2*o.v+2*r.v+l.v),t.gamma+=e/6*(n.gamma+2*o.gamma+2*r.gamma+l.gamma),t.r+=e/6*(n.r+2*o.r+2*r.r+l.r),t.theta+=e/6*(n.theta+2*o.theta+2*r.theta+l.theta),this.v=Math.max(t.v,5),this.gamma=T(t.gamma,-89*_,89*_),this.r=Math.max(t.r,I[this.cfg.planet].radius),this.theta=t.theta}aeroState(){const e=I[this.cfg.planet],t=this.r-e.radius,s=Dt(this.cfg.planet,Math.max(t,0)),a=t>0?s.rho:0,n=.5*a*this.v*this.v,o=this.veh.cd(this.alpha*_),r=this.veh.cl(this.alpha*_),l=n*this.veh.A*o,m=n*this.veh.A*r,h=e.kSG*Math.sqrt(a/this.veh.Rn)*this.v**3/1e4,c=3e-27*Math.pow(a,1.1)*Math.pow(this.v,8)*Math.sqrt(this.veh.Rn)/1e4,u=Math.sqrt(l*l+m*m)/(this.veh.m*fe),p=o>1e-6?r/o:0,w=220+.71*this.v;return{mach:this.v/s.a,rho:a,q:n,heat:h,heatR:c,g:u,ld:p,ts:w}}pose(){const e=I[this.cfg.planet];return{h:this.r-e.radius,theta:this.theta,gamma:this.gamma,v:this.v}}predictPath(e=240,t=280){const s=I[this.cfg.planet],a={v:this.v,gamma:this.gamma,r:this.r,theta:this.theta},n=e/t,o=this.alpha*_,r=this.sigma*_,l=[];for(let m=0;m<t;m++){const h=this.deriv(a,o,r),c={v:Math.max(a.v+.5*n*h.v,5),gamma:T(a.gamma+.5*n*h.gamma,-89*_,89*_),r:Math.max(a.r+.5*n*h.r,s.radius),theta:a.theta+.5*n*h.theta},u=this.deriv(c,o,r);a.v=Math.max(a.v+n*u.v,5),a.gamma=T(a.gamma+n*u.gamma,-89*_,89*_),a.r=Math.max(a.r+n*u.r,s.radius),a.theta+=n*u.theta;const p=a.r-s.radius;if(l.push({h:p,theta:a.theta}),p<=0)break}return l}pushHist(){const e=I[this.cfg.planet],t=this.aeroState();this.history.push({t:this.t,h:this.r-e.radius,v:this.v,gamma:this.gamma*gt,alpha:this.alpha,sigma:this.sigma,mach:t.mach,rho:t.rho,q:t.q,heat:t.heat,heatR:t.heatR,g:t.g,ld:t.ld,down:e.radius*Math.abs(this.theta-this.theta0),ts:t.ts,theta:this.theta}),this.history.length>we&&(this.history=this.history.filter((s,a)=>a%2===0),this.histStride*=2),this.recording&&(this.recordingData.push(this.history[this.history.length-1]),this.recordingData.length>2e5&&(this.recording=!1))}pushSnap(){this.snapshots.push({t:this.t,v:this.v,gamma:this.gamma,r:this.r,theta:this.theta,alpha:this.alpha,sigma:this.sigma}),this.snapshots.length>ye&&(this.snapshots=this.snapshots.filter((e,t)=>t%2===0),this.snapStride*=2)}scrubTo(e){if(this.snapshots.length===0)return;let t=this.snapshots[0];for(const s of this.snapshots)if(s.t<=e+1e-6)t=s;else break;this.t=t.t,this.v=t.v,this.gamma=t.gamma,this.r=t.r,this.theta=t.theta,this.alpha=t.alpha,this.sigma=t.sigma,this.landed=!1,this.captured=!1,this.history=this.history.filter(s=>s.t<=t.t+1e-6),this.snapshots=this.snapshots.filter(s=>s.t<=t.t+1e-6),this.heatLoad=0;for(let s=1;s<this.history.length;s++){const a=(this.history[s].t-this.history[s-1].t)*this.histStride;this.heatLoad+=this.history[s].heat*1e4*a/1e6}this.paused=!0,this.emit(!0)}setAlpha(e){this.alpha=T(e,0,40),this.apAlpha=this.alpha,this.emit(!0)}setSigma(e){this.sigma=T(e,0,180),this.apSigma=this.sigma,this.emit(!0)}overrideAltitude(e){this.r=I[this.cfg.planet].radius+T(e,0,2e5),this.landed=!1,this.emit(!0)}overrideVelocity(e){this.v=T(e,50,12e3),this.emit(!0)}overrideGamma(e){this.gamma=T(e,-15,15)*_,this.emit(!0)}setWarp(e){this.warp=e,this.emit(!0)}toggleAutopilot(){this.autopilot=!this.autopilot,this.emit(!0)}togglePause(){this.landed||(this.paused=!this.paused,this.emit(!0))}toggleRecording(){this.recording=!this.recording,this.recording&&(this.recordingData=[]),this.emit(!0)}apStep(e){if(!this.autopilot)return;const t=I[this.cfg.planet],s=this.r-t.radius,a=this.aeroState(),n=t.mu/(this.r*this.r),o=this.gamma*gt;let r=this.alpha,l=this.sigma;if(this.cfg.mode==="cruise"&&this.veh.clLin){const c=Math.max(a.q,1),p=(this.veh.m*n/(c*this.veh.A)-this.veh.clLin.cl0)/this.veh.clLin.cla,w=this.v*Math.sin(this.gamma),y=s-(this.cfg.hRef??s);r=T(p*gt-.004*y-.06*w,1,34),l=0}else if(this.cfg.mode==="aerocapture"){Math.sqrt(2*t.mu/this.r);const c=this.cfg.gRef??4;if(this.captured)l=14;else{const u=a.g-c,p=T(o-(this.cfg.gammaRef??-1.5),-4,4);let w=90-20*u+3*p;a.g>this.veh.limits.g*.95&&(w=55),l=T(w,10,170)}r=this.cfg.ic.alpha}else{const c=this.cfg.gRef??4,u=a.g-c,p=o-(this.cfg.gammaRef??-2);let w=22-14*u+6*p;a.heat>this.veh.limits.heat*.92&&(w=78),l=T(w,5,80),r=T(this.cfg.ic.alpha,12,26)}const m=(this.cfg.mode==="cruise"?10:4)*e,h=14*e;this.alpha+=T(r-this.alpha,-m,m),this.sigma+=T(l-this.sigma,-h,h),this.alpha=T(this.alpha,0,40),this.sigma=T(this.sigma,0,180),this.apAlpha=this.alpha,this.apSigma=this.sigma}tick(e){const t=Math.min(e,.05);if(!this.paused&&!this.landed){const s=t*this.warp,a=Math.min(120,Math.max(1,Math.ceil(s/ve))),n=s/a;for(let o=0;o<a;o++){this.apStep(n),this.rk4(n),this.t+=n;const r=this.aeroState();this.lastHeat=r.heat,this.heatLoad+=r.heat*1e4*n/1e6,this.histAcc+=n,this.histAcc>=_t*this.histStride&&(this.histAcc=0,this.pushHist()),this.snapAcc+=n,this.snapAcc>=be*this.snapStride&&(this.snapAcc=0,this.pushSnap());const l=I[this.cfg.planet];if(this.r-l.radius<=0){this.r=l.radius,this.landed=!0,this.paused=!0,this.pushHist(),this.emit(!0);break}if(this.cfg.mode==="aerocapture"){const m=Math.sqrt(2*l.mu/this.r),h=this.r-l.radius;if(!this.captured&&h<l.entryInterface&&this.v<m*.985&&(this.captured=!0),this.captured&&h>l.entryInterface&&this.gamma>0){this.paused=!0,this.emit(!0);break}}}}this.emitAcc+=1,this.emitAcc>=5&&(this.emitAcc=0,this.ui=this.buildUi(),this.version++,this.listeners.forEach(s=>s()))}status(){const e=I[this.cfg.planet],t=this.r-e.radius;if(this.landed)return"TOUCHDOWN";if(this.captured)return"CAPTURED";if(t>e.entryInterface)return"EXOATMOSPHERIC";const s=this.aeroState(),a=this.gamma<0;return s.heat>45&&this.v>2800?"IONIZATION BLACKOUT":s.heat>15&&this.v>2e3?a?"PLASMA BUILDUP":"PLASMA EXIT":s.mach>=5?"HYPERSONIC":s.mach>=1.2?"SUPERSONIC":s.mach>=.8?"TRANSONIC":"SUBSONIC"}buildUi(){const e=I[this.cfg.planet],t=this.aeroState(),s=this.status(),a=T((t.heat-10)/60,0,.995),n=(1-a)*12,o=[];return t.heat>this.veh.limits.heat&&o.push("HEAT FLUX LIMIT EXCEEDED"),t.g>this.veh.limits.g&&o.push("G-LOAD LIMIT EXCEEDED"),t.q/1e3>this.veh.limits.q&&o.push("DYNAMIC PRESSURE LIMIT"),s==="IONIZATION BLACKOUT"&&o.push("TT&C SIGNAL OUTAGE"),{version:this.version,missionId:this.cfg.id,missionName:this.cfg.name,planetId:this.cfg.planet,planetName:e.name,vehicleName:this.veh.name,vehicleBlurb:this.veh.blurb,mode:this.cfg.mode,t:this.t,h:this.r-e.radius,v:this.v,gamma:this.gamma*gt,alpha:this.alpha,sigma:this.sigma,apAlpha:this.apAlpha,apSigma:this.apSigma,mach:t.mach,rho:t.rho,q:t.q/1e3,heat:t.heat,heatR:t.heatR,heatLoad:this.heatLoad,g:t.g,ld:t.ld,downrange:e.radius*Math.abs(this.theta-this.theta0)/1e3,tShock:t.ts,status:s,attenuation:a,dataRate:n,warnings:o,colorScaleMax:Math.max(this.veh.limits.heat*1.5,60),autopilot:this.autopilot,paused:this.paused,landed:this.landed,captured:this.captured,warp:this.warp,recording:this.recording,recCount:this.recordingData.length,cfgVersion:this.cfgVersion}}buildCsv(){const e=this.recordingData.length>1?this.recordingData:this.history,t="t_s,h_km,v_kms,gamma_deg,alpha_deg,sigma_deg,mach,rho_kgm3,q_kPa,heat_conv_Wcm2,heat_rad_Wcm2,heat_load_MJm2,g_load,LD,downrange_km,shock_T_K",s=e.map(a=>[a.t.toFixed(2),(a.h/1e3).toFixed(3),(a.v/1e3).toFixed(4),a.gamma.toFixed(3),a.alpha.toFixed(2),a.sigma.toFixed(2),a.mach.toFixed(2),a.rho.toExponential(4),(a.q/1e3).toFixed(3),a.heat.toFixed(3),a.heatR.toFixed(3),(a.heat*1e4*_t*this.histStride/1e6).toFixed(3),a.g.toFixed(3),a.ld.toFixed(3),(a.down/1e3).toFixed(2),a.ts.toFixed(1)].join(","));return[t,...s].join(`
`)}peaks(){let e=0,t=0,s=0;for(const a of this.history)a.heat>e&&(e=a.heat),a.g>t&&(t=a.g),a.q>s&&(s=a.q);return{heat:e,g:t,q:s/1e3}}}class Me extends K{constructor(e=1,t=1,s=1,a=1){super();const n=e/2,o=t/2,r=s,l=a,m=e/r,h=t/l,c=[],u=[],p=[],w=[];for(let y=0;y<=l;y++){const f=y*h-o;for(let R=0;R<=r;R++){const E=R*m-n;c.push(E,-f,0),u.push(0,0,1),p.push(R/r,1-y/l)}}for(let y=0;y<l;y++)for(let f=0;f<r;f++){const R=f+(r+1)*y,E=f+(r+1)*(y+1),C=f+1+(r+1)*(y+1),k=f+1+(r+1)*y;w.push(R,E,k),w.push(E,C,k)}this.setAttribute("position",{array:new Float32Array(c),itemSize:3}),this.setAttribute("normal",{array:new Float32Array(u),itemSize:3}),this.setAttribute("uv",{array:new Float32Array(p),itemSize:2}),this.setIndex(w)}}const Ut=`
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy;
  vec4 y = y_*ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float f = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){ f += a*snoise(p); p *= 2.03; a *= 0.5; }
  return f;
}
`,Ae={earth:{deep:"#062a5e",shallow:"#1268b8",low:"#2e5c28",high:"#8a7a4d",ice:"#eaf2fb",atmo:"#5fa4ff",ocean:1},mars:{deep:"#4a1d10",shallow:"#7a301f",low:"#8f3d1f",high:"#c97a48",ice:"#f4e8dd",atmo:"#ff9a6a",ocean:0}};function it(i){const e=new Qt(i);return[e.r,e.g,e.b]}function Ee(i){const e=Ae[i];return{uSunDir:{value:[.767,.245,.384]},uTime:{value:0},uOceanDeep:{value:it(e.deep)},uOceanShallow:{value:it(e.shallow)},uLandLow:{value:it(e.low)},uLandHigh:{value:it(e.high)},uIce:{value:it(e.ice)},uAtmo:{value:it(e.atmo)},uHasOcean:{value:e.ocean}}}const $t=`
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
void main(){
  vObj = normalize(aPosition);
  vWorldNormal = normalize(mat3(uModelMatrix) * aNormal);
  vec4 wp = uModelMatrix * vec4(aPosition, 1.0);
  vViewDir = normalize(uCameraPosition - wp.xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * wp;
}
`,Te=`
precision highp float;
uniform vec3 uSunDir;
uniform float uTime;
uniform vec3 uOceanDeep;
uniform vec3 uOceanShallow;
uniform vec3 uLandLow;
uniform vec3 uLandHigh;
uniform vec3 uIce;
uniform vec3 uAtmo;
uniform float uHasOcean;
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
${Ut}
void main(){
  vec3 sp = normalize(vObj);
  float n  = fbm(sp * 2.35 + vec3(7.31, 1.73, 3.17));
  float n2 = fbm(sp * 5.1  + vec3(11.2, 5.9, 1.4));
  float land = smoothstep(0.055, 0.11, n);
  float coast = smoothstep(0.015, 0.055, n);
  vec3 ocean = mix(uOceanDeep, uOceanShallow, coast * 0.85);
  vec3 landCol = mix(uLandLow, uLandHigh, clamp(n2 * 0.6 + 0.5, 0.0, 1.0));
  landCol = mix(landCol, landCol * 0.55 + vec3(0.16, 0.1, 0.02), smoothstep(0.15, 0.6, n2));
  vec3 col = uHasOcean > 0.5 ? mix(ocean, landCol, land) : mix(landCol * 0.75, landCol, smoothstep(0.0, 0.08, n + 0.35));
  float ice = smoothstep(0.74, 0.84, abs(sp.y) + n * 0.05);
  col = mix(col, uIce, ice);
  float dl = dot(sp, normalize(uSunDir));
  float day = smoothstep(-0.14, 0.28, dl);
  col *= 0.055 + 0.945 * day;
  float rim = pow(1.0 - max(dot(vViewDir, vWorldNormal), 0.0), 2.6);
  col += uAtmo * rim * (0.22 + 0.78 * day) * 0.85;
  gl_FragColor = vec4(col, 1.0);
}
`,ke=`
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 vNormalV;
void main(){
  // view-space normal: V = uViewMatrix * M * position, R³ part of V = Riy * M
  mat4 mv = uViewMatrix * uModelMatrix;
  vNormalV = normalize(mat3(mv) * aNormal);
  gl_Position = uProjectionMatrix * mv * vec4(aPosition, 1.0);
}
`,Ce=`
precision mediump float;
uniform vec3 uAtmo;
varying vec3 vNormalV;
void main(){
  float intensity = pow(0.72 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(uAtmo, 1.0) * clamp(intensity, 0.0, 1.4);
}
`;function Re(i,e){const t=new Vt,s=Ee(i),a=new yt({uniforms:s,vertexShader:$t,fragmentShader:Te}),n=new ht(new St(1,96,64),a);n.scale.setScalar(e),t.add(n);const o=new ht(new St(1.008,72,48),new yt({uniforms:{uSunDir:s.uSunDir,uTime:s.uTime},vertexShader:$t,fragmentShader:`
        precision highp float;
        uniform vec3 uSunDir;
        uniform float uTime;
        varying vec3 vObj;
        varying vec3 vWorldNormal;
        varying vec3 vViewDir;
        ${Ut}
        void main(){
          vec3 sp = normalize(vObj);
          float c = fbm(sp * 3.4 + vec3(uTime * 0.004, 0.0, uTime * 0.002));
          float alpha = smoothstep(0.18, 0.55, c) * 0.55;
          float dl = dot(sp, normalize(uSunDir));
          float day = smoothstep(-0.1, 0.3, dl);
          gl_FragColor = vec4(vec3(1.0) * (0.25 + 0.75 * day), alpha);
        }
      `,transparent:!0,depthWrite:!1}));o.scale.setScalar(e),o.visible=i==="earth",t.add(o);const r=new ht(new St(1.05,64,48),new yt({uniforms:{uAtmo:s.uAtmo},vertexShader:ke,fragmentShader:Ce,transparent:!0,depthWrite:!1}));return r.scale.setScalar(e),t.add(r),{group:t,uniforms:s,surface:n,clouds:o,atmoShell:r}}function ze(i){const e=[];for(let a=0;a<i.length;a++)for(let n=a+1;n<i.length;n++)for(let o=n+1;o<i.length;o++){const r=i[a],l=i[n],m=i[o],h=[(l[1]-r[1])*(m[2]-r[2])-(l[2]-r[2])*(m[1]-r[1]),(l[2]-r[2])*(m[0]-r[0])-(l[0]-r[0])*(m[2]-r[2]),(l[0]-r[0])*(m[1]-r[1])-(l[1]-r[1])*(m[0]-r[0])];if(Math.hypot(h[0],h[1],h[2])<1e-6)continue;let u=!1,p=!1;for(let f=0;f<i.length&&!(u&&p);f++){if(f===a||f===n||f===o)continue;const R=i[f],E=h[0]*(R[0]-r[0])+h[1]*(R[1]-r[1])+h[2]*(R[2]-r[2]);E>1e-6?u=!0:E<-1e-6&&(p=!0)}if(u&&p)continue;const y=p?[a,o,n]:[a,n,o];for(const f of y)e.push(i[f][0],i[f][1],i[f][2])}const s=new K;return s.setAttribute("position",{array:new Float32Array(e),itemSize:3}),s.computeVertexNormals(),s}function Le(){return ze([[5.2,0,0],[-.4,.06,2.9],[-.4,.06,-2.9],[-5,.62,1.75],[-5,.62,-1.75],[-5,-.42,1.75],[-5,-.42,-1.75],[-2.2,-.52,0]])}function Ne(){const i=[];for(let m=0;m<=10;m++){const h=(-40+40*m/10)*(Math.PI/180);i.push([1.55*Math.cos(h),1.55*Math.sin(h)-1.55*Math.sin(-40*Math.PI/180)])}i.push([1.5,.1]),i.push([.85,1.45]),i.push([.55,1.7]),i.push([0,1.78]);const t=40,s=new Float32Array(i.length*(t+1)*3);let a=0;for(let m=0;m<i.length;m++){const[h,c]=i[m];for(let u=0;u<=t;u++){const p=u/t*Math.PI*2;s[a++]=h*Math.sin(p),s[a++]=c,s[a++]=h*Math.cos(p)}}const n=[];for(let m=0;m<i.length-1;m++)for(let h=0;h<t;h++){const c=m*(t+1)+h,u=(m+1)*(t+1)+h,p=(m+1)*(t+1)+h+1,w=m*(t+1)+h+1;n.push(c,w,p,c,p,u)}const o=new K;o.setAttribute("position",{array:s,itemSize:3}),o.setIndex(n),o.computeVertexNormals();const l=o.getAttribute("position").array;for(let m=0;m<l.length;m+=3){const h=l[m],c=l[m+1];l[m]=-c-.55,l[m+1]=h}return o.computeVertexNormals(),o}function Ie(){const e=document.createElement("canvas");e.width=128,e.height=128;const t=e.getContext("2d"),s=t.createRadialGradient(128/2,128/2,0,128/2,128/2,128/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.25,"rgba(255,235,200,0.85)"),s.addColorStop(.55,"rgba(255,150,60,0.35)"),s.addColorStop(1,"rgba(255,80,20,0)"),t.fillStyle=s,t.fillRect(0,0,128,128);const a=new Zt(e);return a.wrapS="clamp",a.wrapT="clamp",a.magFilter="linear",a.minFilter="linear",a.generateMipmaps=!1,a}function Pe(i,e){const t=new Float32Array(i*3),s=new Float32Array(i*3);for(let o=0;o<i;o++){const r=Math.random()*2-1,l=Math.random()*Math.PI*2,m=Math.sqrt(1-r*r);t[o*3]=e*m*Math.cos(l),t[o*3+1]=e*r,t[o*3+2]=e*m*Math.sin(l);const h=.35+Math.random()*.65;s[o*3]=h,s[o*3+1]=h,s[o*3+2]=h*(.9+Math.random()*.1)}const a=new K;a.setAttribute("position",{array:t,itemSize:3}),a.setAttribute("color",{array:s,itemSize:3});const n=new xt({color:"#ffffff",transparent:!0,opacity:.85});return n.size=1.6,new Jt(a,n)}const ft=14,Oe=8192,De=300;function He(i,e){const t=new K;return e&&t.setAttribute("color",{array:new Float32Array(e),itemSize:3}),t.setAttribute("position",{array:new Float32Array(i),itemSize:3}),t}function qe(i,e){let t="planet",s=5;const a=document.createElement("div");a.className="absolute inset-0",i.appendChild(a);const n=new te({antialias:!0,alpha:!1});n.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),n.setSize(i.clientWidth||800,i.clientHeight||600),a.appendChild(n.domElement);const o=new ee,r=new ae(46,(i.clientWidth||800)/(i.clientHeight||600),.05,3e4);r.position.set(96,62,235);const l=new se(r,n.domElement);l.enableDamping=!0,l.dampingFactor=.06,l.minDistance=12,l.maxDistance=900,l.target.set(0,0,0),o.add(new ie(8952251,.35));const m=new ne(16777215,2.6);m.position.set(1e3,320,500),o.add(m),o.add(Pe(2200,9e3));let h=null,c=null,u=-1;const p=Ie(),w=new ht(new Me(1,1),new xt({color:16777215,map:p,transparent:!0,opacity:0,depthWrite:!1})),y=new oe(16746564,0,30,0),f=new Vt;f.add(w),f.add(y),o.add(f);const R=new Pt(new K,new xt({transparent:!0,opacity:.95})),E=new Pt(new K,new xt({color:12572927,transparent:!0,opacity:.3}));o.add(R),o.add(E);const C=(v,x,b)=>{v.geometry.getAttribute("position")&&n.releaseGeometry(v.geometry),v.geometry=He(x,b)},k=()=>{u=e.cfgVersion,h&&(o.remove(h.group),h.group.traverse(L=>{const A=L;A.geometry&&n.releaseGeometry(A.geometry)})),c&&(f.remove(c),n.releaseGeometry(c.geometry),c=null);const v=I[e.cfg.planet];h=Re(e.cfg.planet,v.radius/1e5),o.add(h.group);const x=Rt[e.cfg.vehicle].kind,b=x==="waverider"?Le():Ne(),M=new re({color:x==="waverider"?10134706:9076594,metalness:.75,roughness:.35,emissive:1707526,emissiveIntensity:.6});c=new ht(b,M),c.scale.setScalar(x==="waverider"?.085:.16),f.add(c)},J=new st,z=new st,V=new st,F=new st,Z=new ce,D=new st,Y=new st;let U=!1,W="planet";const S=(v,x,b,M)=>{v.r=x,v.g=b,v.b=M},P=v=>{const x=I[e.cfg.planet],b=e.pose(),M=x.radius/1e5+b.h/1e3*ft/100,L=Math.cos(b.theta),A=Math.sin(b.theta);z.set(L,0,-A),J.set(-A,0,-L);const $=Math.cos(b.gamma),at=Math.sin(b.gamma);V.copy(J).multiplyScalar($).addScaledVector(z,at).normalize(),F.copy(V).cross(z).normalize(),f.position.set(L*M,0,-A*M),Z.set(V.x,V.y,V.z,0,z.x,z.y,z.z,0,F.x,F.y,F.z,0,0,0,0,1),f.quaternion.setFromRotationMatrix(Z),w.quaternion.copy(r.quaternion);const q=Ht(v),rt=w.material;S(rt.color,q[0],q[1],q[2]),rt.opacity=T(.12+v*1.6,0,.95);const ut=1.6+v*3.6;return w.scale.set(ut,ut*.8,1),y.color.setRGB(q[0],q[1],q[2]),y.intensity=v*3.5,c&&c.material.emissive.setRGB(q[0]*v*.5,q[1]*v*.28,q[2]*v*.12),{pos:f.position,fwd:V,up:z}},dt=v=>{const x=I[e.cfg.planet],b=e.history,M=Math.min(b.length,Oe),L=b.length-M,A=[],$=[];for(let at=0;at<M;at++){const q=b[L+at],rt=x.radius/1e5+q.h/1e3*ft/100,ut=Math.cos(q.theta),It=Math.sin(q.theta),wt=Ht(T(q.heat/v,0,1));at>0&&(A.push(A[A.length-3],A[A.length-2],A[A.length-1]),$.push($[$.length-3],$[$.length-2],$[$.length-1])),A.push(ut*rt,0,-It*rt),$.push(wt[0],wt[1],wt[2])}C(R,A,$)},nt=()=>{const v=I[e.cfg.planet],x=e.predictPath(240,De-1),b=[];for(let M=0;M<x.length;M++){const L=v.radius/1e5+x[M].h/1e3*ft/100,A=Math.cos(x[M].theta),$=Math.sin(x[M].theta);M>0&&b.push(b[b.length-3],b[b.length-2],b[b.length-1]),b.push(A*L,0,-$*L)}C(E,b,null)},G=document.createElement("div");G.className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 select-none";const Q=document.createElement("div");Q.className="flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] tracking-widest backdrop-blur-sm";const d=document.createElement("button");d.type="button",d.textContent="PLANET VIEW",d.className="px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer";const O=document.createElement("button");O.type="button",O.textContent="CHASE CAM",O.className="px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer",d.onclick=()=>{t="planet",d.className="px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer",O.className="px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer"},O.onclick=()=>{t="chase",O.className="px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer",d.className="px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer"},Q.appendChild(d),Q.appendChild(O),G.appendChild(Q);const N=document.createElement("div");N.className="flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] backdrop-blur-sm";const j=[];[1,2,5,10].forEach(v=>{const x=document.createElement("button");x.type="button",x.textContent=`${v}×`,x.className=`px-2.5 py-1.5 transition-colors cursor-pointer ${s===v?"bg-cyan-600/80 text-white":"text-zinc-300 hover:bg-white/10"}`,x.onclick=()=>{s=v,e.setWarp(v),j.forEach((b,M)=>{const L=[1,2,5,10][M];b.className=`px-2.5 py-1.5 transition-colors cursor-pointer ${s===L?"bg-cyan-600/80 text-white":"text-zinc-300 hover:bg-white/10"}`})},j.push(x),N.appendChild(x)}),G.appendChild(N),i.appendChild(G);const B=document.createElement("div");B.className="pointer-events-none absolute left-3 top-3 rounded border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 backdrop-blur-sm select-none",i.appendChild(B);const tt=document.createElement("div");tt.className="pointer-events-none absolute bottom-[76px] left-3 rounded bg-black/40 px-2 py-1 font-mono text-[9px] tracking-wider text-zinc-500 backdrop-blur-sm select-none",tt.textContent=`ALTITUDE ×${ft} EXAGGERATED · 1 UNIT = 100 KM`,i.appendChild(tt);const ot=document.createElement("div");ot.className="pointer-events-none absolute inset-2 border border-white/5",i.appendChild(ot);const et=document.createElement("div");et.className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]",i.appendChild(et);let mt=0,pt=performance.now(),bt=0;const Lt=()=>{mt=requestAnimationFrame(Lt);const v=performance.now(),x=Math.min((v-pt)/1e3,.1);pt=v,bt++,e.tick(x),e.cfgVersion!==u&&(k(),B.textContent=`${e.ui.missionName} · ${e.ui.planetName} · ${e.ui.vehicleName}`);const b=e.ui.colorScaleMax,M=T(e.ui.heat/250,0,1),L=P(M);if(bt%6===0&&dt(b),bt%24===0&&nt(),h&&(h.uniforms.uTime.value+=x,h.surface.rotation.y+=x*.004,h.clouds.rotation.y+=x*.0052),t==="chase")l.enabled=!1,D.copy(L.pos).addScaledVector(L.fwd,-3.4).addScaledVector(L.up,1.15),Y.copy(L.pos).addScaledVector(L.fwd,4),U?r.position.lerp(D,.07):(r.position.copy(D),U=!0),r.lookAt(Y);else{if(l.enabled=!0,U=!1,W==="chase"){const A=r.position.clone();A.lengthSq()<1e-6&&A.set(.4,.25,1),A.normalize().multiplyScalar(285),r.position.copy(A),l.target.set(0,0,0)}l.update()}W=t,n.render(o,r)};Lt();const Nt=new ResizeObserver(()=>{const v=i.clientWidth,x=i.clientHeight;v===0||x===0||(r.aspect=v/x,r.updateProjectionMatrix(),n.setSize(v,x))});return Nt.observe(i),B.textContent=`${e.ui.missionName} · ${e.ui.planetName} · ${e.ui.vehicleName}`,{dispose:()=>{cancelAnimationFrame(mt),Nt.disconnect(),l.dispose(),n.dispose(),n.domElement.parentElement&&n.domElement.parentElement.removeChild(n.domElement),o.traverse(v=>{var b,M;const x=v;x.geometry&&n.releaseGeometry(x.geometry),(M=(b=x.material)==null?void 0:b.dispose)==null||M.call(b)}),i.replaceChildren()}}}const _e=[{key:"alt",label:"ALTITUDE",unit:"km",color:"#67e8f9",get:i=>i.h/1e3,scale:1},{key:"heat",label:"HEAT FLUX",unit:"W/cm²",color:"#fb923c",get:i=>i.heat,scale:1},{key:"vel",label:"VELOCITY",unit:"km/s",color:"#a3e635",get:i=>i.v/1e3,scale:1}];function $e(i,e){const t=document.createElement("div");t.className="pointer-events-none absolute bottom-3 left-3 w-56 rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm select-none";const s=5;t.innerHTML=`
    <div class="mb-1 flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-400">
      <span>STAGNATION HEAT FLUX</span>
      <span class="text-amber-400">W/cm²</span>
    </div>
    <div class="h-2 w-full rounded-sm" style="background: ${xe}"></div>
    <div class="mt-0.5 flex justify-between font-mono text-[8px] text-zinc-500" id="ticks-row"></div>
  `;const a=t.querySelector("#ticks-row"),n=()=>{a.innerHTML=Array.from({length:s+1},(r,l)=>`<span>${(e.ui.colorScaleMax*l/s).toFixed(0)}</span>`).join("")};n();const o=e.subscribe(n);return i.appendChild(t),{dispose:()=>{o(),t.remove()}}}function Fe(i,e){const t=document.createElement("div");t.className="absolute bottom-3 right-3 hidden w-[300px] rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm sm:block sm:w-[360px] select-none",t.innerHTML=`
    <div class="mb-1 font-mono text-[9px] tracking-widest text-zinc-400">TELEMETRY HISTORY</div>
    <div class="flex flex-col gap-1.5" id="charts-wrap"></div>
  `;const s=t.querySelector("#charts-wrap"),a=[];_e.forEach(m=>{const h=document.createElement("div");h.className="h-[54px]";const c=document.createElement("canvas");c.className="h-full w-full",h.appendChild(c),s.appendChild(h),a.push({cv:c,def:m})});const n=(m,h)=>{const c=m.getContext("2d");if(!c)return;const u=Math.min(window.devicePixelRatio||1,2),p=m.clientWidth||340,w=m.clientHeight||54;(m.width!==Math.round(p*u)||m.height!==Math.round(w*u))&&(m.width=Math.round(p*u),m.height=Math.round(w*u)),c.setTransform(u,0,0,u,0,0),c.clearRect(0,0,p,w);const y=e.history;if(y.length<2){c.fillStyle="rgba(255,255,255,0.25)",c.font="9px ui-monospace, monospace",c.fillText("AWAITING DATA…",6,w/2);return}const R=Math.max(1,Math.floor(y.length/180)),E=[];let C=1/0,k=-1/0;for(let S=0;S<y.length;S+=R){const P=h.get(y[S])*h.scale;P<C&&(C=P),P>k&&(k=P),E.push({x:0,y:0,val:P})}const J=y[y.length-1],z=h.get(J)*h.scale;z<C&&(C=z),z>k&&(k=z),k-C<1e-9&&(k=C+1);const V=(k-C)*.12;C-=V,k+=V;const F=2,Z=34,D=4,Y=p-F-Z,U=w-D*2;E.forEach((S,P)=>{S.x=F+Y*P/(E.length-1),S.y=D+U*(1-(S.val-C)/(k-C))}),c.strokeStyle="rgba(255,255,255,0.06)",c.lineWidth=1;for(let S=1;S<3;S++){const P=D+U*S/3;c.beginPath(),c.moveTo(F,P),c.lineTo(F+Y,P),c.stroke()}const W=c.createLinearGradient(0,D,0,D+U);W.addColorStop(0,h.color+"40"),W.addColorStop(1,h.color+"00"),c.beginPath(),c.moveTo(E[0].x,D+U),E.forEach(S=>c.lineTo(S.x,S.y)),c.lineTo(E[E.length-1].x,D+U),c.closePath(),c.fillStyle=W,c.fill(),c.beginPath(),E.forEach((S,P)=>P===0?c.moveTo(S.x,S.y):c.lineTo(S.x,S.y)),c.strokeStyle=h.color,c.lineWidth=1.4,c.stroke(),c.font="9px ui-monospace, monospace",c.fillStyle="rgba(255,255,255,0.45)",c.fillText(h.label,F+3,D+9),c.fillStyle=h.color,c.textAlign="right",c.fillText(`${z>=100?z.toFixed(0):z.toFixed(z>=10?1:2)} ${h.unit}`,p-3,D+9),c.textAlign="left",c.fillStyle="rgba(255,255,255,0.25)",c.font="8px ui-monospace, monospace",c.fillText(`${k.toFixed(0)}`,p-30,w-3),c.fillText(`${C.toFixed(0)}`,p-30,10)};let o=0,r=0;const l=m=>{o=requestAnimationFrame(l),m-r>80&&(r=m,a.forEach(({cv:h,def:c})=>n(h,c)))};return o=requestAnimationFrame(l),i.appendChild(t),{dispose:()=>{cancelAnimationFrame(o),t.remove()}}}function Et(i){const e=Math.max(0,Math.floor(i)),t=Math.floor(e/3600),s=Math.floor(e%3600/60),a=e%60,n=o=>String(o).padStart(2,"0");return t>0?`${n(t)}:${n(s)}:${n(a)}`:`${n(s)}:${n(a)}`}function H(i,e){return i.toFixed(e)}function Ge(i,e){if(!isFinite(i))return"—";if(i===0)return"0";const t=Math.max(0,e-1-Math.floor(Math.log10(Math.abs(i))));return i.toFixed(t)}function Ft(i){return Math.round(i).toLocaleString("en-US")}const Gt={STANDBY:{fg:"text-zinc-300 border-zinc-500/40",dot:"bg-zinc-400",pulse:!1},EXOATMOSPHERIC:{fg:"text-sky-300 border-sky-500/40",dot:"bg-sky-400",pulse:!1},"PLASMA BUILDUP":{fg:"text-amber-300 border-amber-500/50",dot:"bg-amber-400",pulse:!0},"IONIZATION BLACKOUT":{fg:"text-red-300 border-red-500/60",dot:"bg-red-500",pulse:!0},"PLASMA EXIT":{fg:"text-amber-300 border-amber-500/50",dot:"bg-amber-400",pulse:!0},HYPERSONIC:{fg:"text-cyan-300 border-cyan-500/40",dot:"bg-cyan-400",pulse:!1},SUPERSONIC:{fg:"text-cyan-200 border-cyan-400/30",dot:"bg-cyan-300",pulse:!1},TRANSONIC:{fg:"text-emerald-200 border-emerald-400/30",dot:"bg-emerald-300",pulse:!1},SUBSONIC:{fg:"text-emerald-300 border-emerald-500/30",dot:"bg-emerald-400",pulse:!1},TOUCHDOWN:{fg:"text-emerald-300 border-emerald-500/60",dot:"bg-emerald-400",pulse:!0},CAPTURED:{fg:"text-emerald-300 border-emerald-500/60",dot:"bg-emerald-400",pulse:!0}};function Ve(i,e){const t=document.createElement("div");t.className="flex flex-col gap-4 p-4 select-none",t.innerHTML=`
    <header>
      <h1 class="font-mono text-xl font-black tracking-[0.28em] text-zinc-100">
        <span class="text-amber-500">◤</span> PROJECT DAEDALUS
      </h1>
      <p class="mt-1 font-mono text-[9px] leading-relaxed tracking-[0.18em] text-zinc-500">
        HYPERSONIC REENTRY AEROTHERMODYNAMICS<br />& GNC FLIGHT SUPERVISOR
      </p>
    </header>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">TELEMETRY LINK</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div id="status-badge-wrap"></div>
    </section>

    <div id="warnings-wrap" class="flex flex-col gap-1"></div>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">MISSION PRESET</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-2 gap-1.5" id="missions-grid"></div>
      <p class="mt-1.5 px-0.5 font-mono text-[9px] leading-snug text-zinc-500" id="vehicle-blurb"></p>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">FLIGHT CONTROLS</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-5 gap-1.5" id="controls-row">
        <button type="button" id="btn-ap" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M9 2v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/></svg>
          <span>A/P</span>
        </button>
        <button type="button" id="btn-run" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <span id="run-icon"></span>
          <span id="run-label">HOLD</span>
        </button>
        <button type="button" id="btn-rst" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200 cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>RST</span>
        </button>
        <button type="button" id="btn-csv" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200 cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
          <span>CSV</span>
        </button>
        <button type="button" id="btn-rec" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
          <span id="rec-label">REC</span>
        </button>
      </div>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">GUIDANCE & CONTROL</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="flex flex-col gap-3" id="sliders-wrap">
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>ANGLE OF ATTACK <span id="ap-alpha-tag" class="ml-2 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400">A/P</span></span>
            <span class="font-bold text-amber-400" id="alpha-val">20.0°</span>
          </div>
          <input type="range" id="slider-alpha" min="0" max="40" step="0.5" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>BANK ANGLE (LIFT AXIS) <span id="ap-sigma-tag" class="ml-2 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400">A/P</span></span>
            <span class="font-bold text-amber-400" id="sigma-val">0.0°</span>
          </div>
          <input type="range" id="slider-sigma" min="0" max="180" step="1" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div class="my-1 h-px bg-white/8"></div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>ALTITUDE</span>
            <span class="font-bold text-amber-400" id="alt-val">120.0 km</span>
          </div>
          <input type="range" id="slider-alt" min="0" max="140" step="0.1" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>VELOCITY</span>
            <span class="font-bold text-amber-400" id="vel-val">7.80 km/s</span>
          </div>
          <input type="range" id="slider-vel" min="0.05" max="11.5" step="0.01" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>FLIGHT PATH ANGLE</span>
            <span class="font-bold text-amber-400" id="gamma-val">-1.20°</span>
          </div>
          <input type="range" id="slider-gamma" min="-15" max="15" step="0.05" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div class="my-1 h-px bg-white/8"></div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>SIM TIME</span>
            <span class="font-bold text-amber-400" id="time-val">T+ 00:00</span>
          </div>
          <input type="range" id="slider-time" min="0" max="60" step="0.5" class="w-full accent-amber-400 cursor-pointer" />
        </div>
      </div>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">AEROTHERMODYNAMICS</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-2 gap-1.5" id="metrics-grid"></div>
      <div class="mt-1.5 flex justify-between rounded border border-white/8 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500" id="sub-metrics-row"></div>
    </section>

    <section class="pb-2">
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">FLIGHT CARD</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="space-y-1 rounded border border-white/8 bg-white/[0.02] px-3 py-2.5 font-mono text-[10px] text-zinc-400" id="flight-card-wrap"></div>
    </section>
  `;const s=t.querySelector("#status-badge-wrap"),a=t.querySelector("#warnings-wrap"),n=t.querySelector("#missions-grid"),o=t.querySelector("#vehicle-blurb"),r=t.querySelector("#btn-ap"),l=t.querySelector("#btn-run"),m=t.querySelector("#run-icon"),h=t.querySelector("#run-label"),c=t.querySelector("#btn-rst"),u=t.querySelector("#btn-csv"),p=t.querySelector("#btn-rec"),w=t.querySelector("#rec-label"),y=t.querySelector("#slider-alpha"),f=t.querySelector("#slider-sigma"),R=t.querySelector("#slider-alt"),E=t.querySelector("#slider-vel"),C=t.querySelector("#slider-gamma"),k=t.querySelector("#slider-time"),J=t.querySelector("#alpha-val"),z=t.querySelector("#sigma-val"),V=t.querySelector("#alt-val"),F=t.querySelector("#vel-val"),Z=t.querySelector("#gamma-val"),D=t.querySelector("#time-val"),Y=t.querySelector("#ap-alpha-tag"),U=t.querySelector("#ap-sigma-tag"),W=t.querySelector("#metrics-grid"),S=t.querySelector("#sub-metrics-row"),P=t.querySelector("#flight-card-wrap"),dt=[];qt.forEach(d=>{const O=Ct[d],N=document.createElement("button");N.type="button",N.textContent=O.short,N.className=`rounded border px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${e.ui.missionId===d?"border-amber-500/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]":"border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`,N.onclick=()=>{e.loadMission(d),G()},n.appendChild(N),dt.push(N)}),r.onclick=()=>{e.toggleAutopilot(),G()},l.onclick=()=>{e.togglePause(),G()},c.onclick=()=>{e.reset(),G()},u.onclick=()=>{const d=e.buildCsv(),O=new Blob([d],{type:"text/csv"}),N=URL.createObjectURL(O),j=document.createElement("a");j.href=N,j.download=`daedalus_${e.ui.missionId}_${Et(e.ui.t).replace(/:/g,"m")}_${Math.round(e.ui.t)}s.csv`,j.click(),URL.revokeObjectURL(N)},p.onclick=()=>{e.toggleRecording(),G()},y.oninput=d=>e.setAlpha(parseFloat(d.target.value)),f.oninput=d=>e.setSigma(parseFloat(d.target.value)),R.oninput=d=>e.overrideAltitude(parseFloat(d.target.value)*1e3),E.oninput=d=>e.overrideVelocity(parseFloat(d.target.value)*1e3),C.oninput=d=>e.overrideGamma(parseFloat(d.target.value)),k.oninput=d=>e.scrubTo(parseFloat(d.target.value));let nt=!1;k.addEventListener("mousedown",()=>{nt=!0}),k.addEventListener("mouseup",()=>{nt=!1});const G=()=>{const d=e.ui,O=Gt[d.status]??Gt.STANDBY,N=Math.round(d.attenuation*100);s.innerHTML=`
      <div class="flex items-center gap-2.5 rounded-md border bg-black/40 px-3 py-2.5 font-mono text-sm font-bold tracking-[0.2em] ${O.fg}">
        <span class="relative flex h-2.5 w-2.5">
          ${O.pulse?`<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${O.dot}"></span>`:""}
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full ${O.dot}"></span>
        </span>
        ${d.status}
      </div>
      <div class="mt-1.5 flex justify-between px-1 font-mono text-[10px] text-zinc-500">
        <span>SIG LINK <span class="${N>80?"text-red-400":N>40?"text-amber-400":"text-emerald-400"}">${N}%</span> ATTN</span>
        <span>DATA ${d.dataRate.toFixed(1)} kbps</span>
        <span>T+ ${Et(d.t)}</span>
      </div>
    `,a.innerHTML=d.warnings.map(et=>`
        <div class="animate-pulse rounded border border-red-500/50 bg-red-950/50 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-widest text-red-300">
          ⚠ ${et}
        </div>
      `).join(""),qt.forEach((et,mt)=>{const pt=d.missionId===et;dt[mt].className=`rounded border px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${pt?"border-amber-500/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]":"border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`}),o.textContent=d.vehicleBlurb,r.className=`flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${d.autopilot?"border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25":"border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`;const j=!d.paused&&!d.landed;l.className=`flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${j?"border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25":"border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`,h.textContent=d.paused?"RUN":"HOLD",m.innerHTML=d.paused?'<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>':'<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',p.className=`flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${d.recording?"border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25":"border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`,w.textContent=d.recording?`${(d.recCount/1e3).toFixed(1)}k`:"REC";const B=d.autopilot;y.disabled=B,f.disabled=B,Y.style.display=B?"inline":"none",U.style.display=B?"inline":"none",y.value=String(d.alpha),J.textContent=`${H(d.alpha,1)}°`,f.value=String(d.sigma),z.textContent=`${H(d.sigma,1)}°`,R.value=String(Math.min(d.h/1e3,140)),V.textContent=`${H(d.h/1e3,1)} km`,E.value=String(Math.min(d.v/1e3,11.5)),F.textContent=`${H(d.v/1e3,2)} km/s`,C.value=String(d.gamma),Z.textContent=`${d.gamma>=0?"+":""}${H(d.gamma,2)}°`;const tt=Math.max(60,Math.ceil(d.t/10)*10);k.max=String(tt),nt||(k.value=String(Math.min(d.t,tt))),D.textContent=`T+ ${Et(d.t)}`,W.innerHTML=`
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">MACH NUMBER</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-amber-400">${H(d.mach,1)}</span><span class="font-mono text-[9px] text-zinc-500">M</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">ATM DENSITY</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${Ge(d.rho,3)}</span><span class="font-mono text-[9px] text-zinc-500">kg/m³</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DYN PRESSURE</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${H(d.q,1)}</span><span class="font-mono text-[9px] text-zinc-500">kPa</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">CONV HEAT FLUX</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-amber-400">${H(d.heat,1)}</span><span class="font-mono text-[9px] text-zinc-500">W/cm²</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">SHOCK LAYER TEMP</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${Ft(d.tShock)}</span><span class="font-mono text-[9px] text-zinc-500">K</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DECELERATION</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${H(d.g,2)}</span><span class="font-mono text-[9px] text-zinc-500">G</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">L/D RATIO</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${H(d.ld,2)}</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DOWNRANGE</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${Ft(d.downrange)}</span><span class="font-mono text-[9px] text-zinc-500">km</span></div>
      </div>
    `,S.innerHTML=`
      <span>RAD HEAT <span class="text-zinc-300">${H(d.heatR,2)}</span> W/cm²</span>
      <span>INTEGRATED <span class="text-zinc-300">${H(d.heatLoad,1)}</span> MJ/m²</span>
      <span>BANK <span class="text-zinc-300">${H(d.sigma,0)}°</span></span>
    `;const ot=e.peaks();P.innerHTML=`
      <div class="flex justify-between gap-2"><span class="text-zinc-600">MISSION</span><span class="text-right text-zinc-300">${d.missionName}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">BODY</span><span class="text-right text-zinc-300">${d.planetName} · R=${(d.planetId==="mars"?3389.5:6371).toFixed(0)} km</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">VEHICLE</span><span class="text-right text-zinc-300">${d.vehicleName}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">MODE</span><span class="text-right text-zinc-300">${d.mode.toUpperCase()}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">PEAK Q̇ / n</span><span class="text-right text-zinc-300">${H(ot.heat,0)} W/cm² · ${H(ot.g,1)} G</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">SIG ATTENUATION</span><span class="text-right text-zinc-300">${Math.round(d.attenuation*100)} %</span></div>
    `};G();const Q=e.subscribe(G);return i.appendChild(t),{dispose:()=>{Q(),t.remove()}}}class Ue extends HTMLElement{constructor(){super(...arguments);g(this,"engine",null);g(this,"cleanups",[])}connectedCallback(){this.style.display="block",this.style.width="100%",this.style.height="100%",this.replaceChildren();const t=new Se;this.engine=t;const s=document.createElement("div");s.className="flex h-dvh w-full overflow-hidden bg-[#070a10] text-zinc-200";const a=document.createElement("div");a.className="relative min-w-0 flex-1";const n=document.createElement("div");n.className="absolute inset-0",a.appendChild(n);const o=document.createElement("a");o.href="./index.html",o.className="absolute left-3 top-3 z-10 rounded-md border border-white/15 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 backdrop-blur-sm transition hover:border-white/25 hover:text-zinc-200",o.textContent="← ELEMENTA",a.appendChild(o),s.appendChild(a);const r=document.createElement("aside");r.className="w-[380px] shrink-0 overflow-y-auto border-l border-white/10 bg-[#0a0f18]/95",s.appendChild(r),this.appendChild(s);const l=qe(n,t),m=$e(a,t),h=Fe(a,t),c=Ve(r,t);this.cleanups.push(()=>l.dispose(),()=>m.dispose(),()=>h.dispose(),()=>c.dispose())}disconnectedCallback(){this.cleanups.forEach(t=>t()),this.cleanups=[],this.engine=null,this.replaceChildren()}}typeof customElements<"u"&&!customElements.get("elementa-daedalus-sim")&&customElements.define("elementa-daedalus-sim",Ue);function Be(){return jt("elementa-daedalus-sim")}const zt=document.getElementById("root");if(!zt)throw new Error("[ELEMENTA /daedalus] missing #root container");let Tt=null;Yt(()=>{const i=Be();Tt?Xt(Tt,i,zt):Kt(i,zt),Tt=i});
