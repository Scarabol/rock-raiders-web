var I=Object.defineProperty;var g=(c,o,l)=>o in c?I(c,o,{enumerable:!0,configurable:!0,writable:!0,value:l}):c[o]=l;var n=(c,o,l)=>g(c,typeof o!="symbol"?o+"":o,l);(function(){"use strict";class c{constructor(t){n(this,"onMessageFromFrontend",()=>{throw new Error("Not implemented")});this.worker=t,t.addEventListener("message",e=>this.onMessageFromFrontend(e==null?void 0:e.data))}sendResponse(t,e){this.worker.postMessage(t,e)}}const o=1,l=Math.round(1e3/15),d=40;function y(a,t){if(!a)throw new Error("No canvas given");const e=a.getContext("2d",t);if(!e)throw new Error("Could not get context");return e}var f=(a=>(a[a.DEFAULT=1]="DEFAULT",a[a.MONSTER=2]="MONSTER",a[a.MATERIAL=3]="MATERIAL",a[a.SCANNER=4]="SCANNER",a))(f||{});/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const T="174";function u(a,t,e){return Math.max(t,Math.min(e,a))}class p{constructor(t=0,e=0){p.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=u(this.x,t.x,e.x),this.y=u(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=u(this.x,t,e),this.y=u(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(u(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(u(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),s=this.x-t.x,h=this.y-t.y;return this.x=s*i-h*r+t.x,this.y=s*r+h*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:T}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=T);class N{constructor(t){n(this,"surfaceContext",null);n(this,"entityContext",null);n(this,"monsterContext",null);n(this,"materialContext",null);n(this,"geoScanContext",null);n(this,"cameraContext",null);n(this,"blocked",new Set);n(this,"markedDirty",new Map);this.worker=t,this.worker.onMessageFromFrontend=e=>this.processMessage(e)}processMessage(t){if(t.type===2)this.surfaceContext=y(t.terrainSprite),this.monsterContext=y(t.monsterSprite),this.materialContext=y(t.materialSprite),this.geoScanContext=y(t.geoScanSprite),this.entityContext=y(t.entitySprite),this.cameraContext=y(t.cameraSprite);else{switch(t.type){case 3:this.redrawTerrain(t.offset,t.surfaceRectSize,t.terrain);break;case 4:this.redrawSurface(t.offset,t.surfaceRectSize,t.surface);break;case 5:switch(t.mapMarkerType){case f.DEFAULT:this.redrawEntitiesContext(t,this.entityContext,"#e8d400",4);break;case f.MONSTER:this.redrawEntitiesContext(t,this.monsterContext,"#f00",3);break;case f.MATERIAL:this.redrawEntitiesContext(t,this.materialContext,"#0f0",2);break;case f.SCANNER:this.redrawGeoScanContext(t);break}break;case 6:this.redrawCamera(t.offset,t.surfaceRectSize,t.rect);break}this.worker.sendResponse({type:1,requestId:t.requestId})}}redrawEntitiesContext(t,e,i,r){if(e){if(this.blocked.has(t.mapMarkerType)){this.markedDirty.set(t.mapMarkerType,t);return}this.blocked.add(t.mapMarkerType),setTimeout(()=>{this.blocked.delete(t.mapMarkerType);const s=this.markedDirty.get(t.mapMarkerType);this.markedDirty.delete(t.mapMarkerType),s&&this.redrawEntitiesContext(s,e,i,r)},l),e.clearRect(0,0,e.canvas.width,e.canvas.height),e.fillStyle=i,t.entities.forEach(s=>{const h=Math.round(s.x*t.surfaceRectSize/d-t.offset.x-r/2),x=Math.round(s.z*t.surfaceRectSize/d-t.offset.y-r/2);e.fillRect(h,x,r,r)})}}redrawGeoScanContext(t){const e=this.geoScanContext;if(e){if(this.blocked.has(t.mapMarkerType)){this.markedDirty.set(t.mapMarkerType,t);return}this.blocked.add(t.mapMarkerType),setTimeout(()=>{this.blocked.delete(t.mapMarkerType);const i=this.markedDirty.get(t.mapMarkerType);this.markedDirty.delete(t.mapMarkerType),i&&this.redrawGeoScanContext(i)},l),e.clearRect(0,0,e.canvas.width,e.canvas.height),e.strokeStyle="#fff",e.lineWidth=1,t.entities.forEach(i=>{const r=Math.round(i.r*t.surfaceRectSize),s=Math.round(i.x*t.surfaceRectSize/d-t.offset.x),h=Math.round(i.z*t.surfaceRectSize/d-t.offset.y);e.beginPath(),e.setLineDash([1,1]),e.ellipse(s,h,r,r,0,0,2*Math.PI),e.stroke()})}}redrawTerrain(t,e,i){this.surfaceContext&&(this.surfaceContext.fillStyle="#000",this.surfaceContext.fillRect(0,0,this.surfaceContext.canvas.width,this.surfaceContext.canvas.height),i.forEach(r=>r.forEach(s=>this.redrawSurface(t,e,s))))}redrawSurface(t,e,i){if(!this.surfaceContext)return;const r=Math.round(i.x*e-t.x),s=Math.round(i.y*e-t.y),h=e-o;this.surfaceContext.fillStyle=i.borderColor?i.borderColor:i.surfaceColor,this.surfaceContext.fillRect(r,s,h,h),i.borderColor&&(this.surfaceContext.fillStyle=i.surfaceColor,this.surfaceContext.fillRect(r,s,h,h))}redrawCamera(t,e,i){if(!this.cameraContext||(this.cameraContext.clearRect(0,0,this.cameraContext.canvas.width,this.cameraContext.canvas.height),!i))return;this.cameraContext.beginPath();const[r,s,h,x]=[i.topLeft,i.topRight,i.bottomRight,i.bottomLeft].map(_=>new p(_.x,_.z).multiplyScalar(e/d).sub(t));this.cameraContext.moveTo(r.x,r.y),this.cameraContext.lineTo(s.x,s.y),this.cameraContext.lineTo(h.x,h.y),this.cameraContext.lineTo(x.x,x.y),this.cameraContext.closePath(),this.cameraContext.strokeStyle="#ccc",this.cameraContext.lineWidth=.5,this.cameraContext.stroke(),this.cameraContext.beginPath();const E=s.clone().sub(r).multiplyScalar(.5).add(r),S=h.clone().sub(x).multiplyScalar(.5).add(x).clone().sub(E),b=S.clone().multiplyScalar(.15).add(E);this.cameraContext.moveTo(b.x,b.y);const m=x.clone().sub(r).multiplyScalar(.5).add(r),C=h.clone().sub(s).multiplyScalar(.5).add(s).clone().sub(m),k=C.clone().multiplyScalar(.65).add(m),M=C.clone().multiplyScalar(.55).add(m),R=S.clone().multiplyScalar(.425).add(M),A=C.clone().multiplyScalar(.35).add(m),w=C.clone().multiplyScalar(.45).add(m),L=S.clone().multiplyScalar(.425).add(w);this.cameraContext.lineTo(k.x,k.y),this.cameraContext.lineTo(M.x,M.y),this.cameraContext.lineTo(R.x,R.y),this.cameraContext.lineTo(L.x,L.y),this.cameraContext.lineTo(w.x,w.y),this.cameraContext.lineTo(A.x,A.y),this.cameraContext.closePath(),this.cameraContext.strokeStyle="#ccc",this.cameraContext.lineWidth=.5,this.cameraContext.stroke()}}const D=self;new N(new c(D))})();
//# sourceMappingURL=MapRendererWorker-DWzAnxeH.js.map
