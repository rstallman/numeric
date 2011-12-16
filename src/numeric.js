"use strict";

var numeric = {};

numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 1;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
}

numeric.precision = 4;

numeric.prettyPrint = function(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return basic+'e'+scale.toString();
        }
        return 'Infinity';
    }

    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(""); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") { 
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = x.toString();
            if(b.length < a.length) a = b;
            if(c.length < a.length) a = c;
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { ret.push(x.toString().replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;')); return true; }
        if('length' in x) {
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
}

numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=3;i-=4) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '    xi = x[i-2];\n'+
            '    '+body+';\n'+
            '    xi = x[i-3];\n'+
            '    '+body+';\n'+
            '}\n'+
            'while(i>=0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '    i--;\n'+
            '}\n'+
            'return accum;'
            );
}


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
}


numeric.rep = function rep(s,v) {
    function foo(k) {
        var n = s[k], ret = new Array(n), i;
        if(k === s.length-1) {
            for(i=n-1;i>=3;i-=4) { ret[i] = v; ret[i-1] = v; ret[i-2] = v; ret[i-3] = v; }
            while(i>=0) { ret[i] = v; i--; }
            return ret;
        }
        for(i=n-1;i>=0;i--) { ret[i] = foo(k+1); }
        return ret;
    }
    return foo(0);
}

numeric.dotMMbig = function dotMMbig(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    var dotVV = numeric.dotVV,min = Math.min;
    p = x.length; q = y.length; r = y[0].length;
    ret = new Array(p);
    woo = numeric.transpose(y);
    for(i0=0;i0<p;i0+=4) {
        p0 = min(i0+4,p);
        for(i=i0;i<p0;i++) { ret[i] = new Array(r); }
        for(k0=0;k0<r;k0+=4) {
            r0 = min(k0+4,r);
            for(i=i0;i<p0;i++) {
                bar = x[i];
                foo = ret[i];
                for(k=k0;k<r0;k++) {
                    foo[k] = dotVV(bar,woo[k]);
                }
            }
        }
    }
    return ret;
}

numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = new Array(p);
    for(i=p-1;i>=0;i--) {
        foo = new Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=3;j-=4) {
                i0 = j-1; p0 = j-2; k0 = j-3;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k] + bar[p0]*y[p0][k] + bar[k0]*y[k0][k];
            }
            while(j>=0) { woo += bar[j]*y[j][k]; j--; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}
numeric.dotMV = function dotMV(x,y) {
    var p = x.length, q = y.length,i;
    var ret = new Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
}

numeric.dotVM = function dotVM(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    p = x.length; q = y[0].length;
    ret = new Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=3;j-=4) {
            i0 = j-1; p0 = j-2; k0 = j-3;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k] + x[p0]*y[p0][k] + x[k0]*y[k0][k];
        }
        while(j>=0) { woo += x[j]*y[j][k]; j--; }
        ret[k] = woo;
    }
    return ret;
}

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,i2,i3,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=3;i-=4) {
        i1 = i-1; i2 = i-2; i3 = i-3;
        ret += x[i]*y[i] + x[i1]*y[i1] + x[i2]*y[i2] + x[i3]*y[i3];
    }
    i++;
    while(i--) { ret += x[i]*y[i]; }
    return ret;
}

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 40) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
}

numeric.diag = function diag(d) {
    var i,i1,j,j1,j2,j3,n = d.length, A = new Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = new Array(n);
        i1 = i+4;
        for(j=n-1;j>i1;j-=4) {
            j1 = j-1; j2 = j-2; j3 = j-3;
            Ai[j] = 0;
            Ai[j1] = 0;
            Ai[j2] = 0;
            Ai[j3] = 0;
        }
        while(j>i) { Ai[j] = 0; j--; }
        Ai[i] = d[i];
        for(j=i-1;j>=3;j-=4) {
            j1 = j-1; j2 = j-2; j3 = j-3;
            Ai[j] = 0;
            Ai[j1] = 0;
            Ai[j2] = 0;
            Ai[j3] = 0;
        }
        while(j>=0) { Ai[j] = 0; j--; }
        A[i] = Ai;
    }
    return A;
}

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); }
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    if(typeof body === "string") { var bin = body; body = function(i1) { return bin.replace(/\[i\]/g,'['+i1+']'); } }
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i, ret = new Array(_n), _i1,_i2,_i3;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i>=3;i-=4) { \n'+
            '    _i1 = i-1; _i2 = i-2; _i3 = i-3;\n'+
            '    '+body('i')+'\n'+
            '    '+body('_i1')+'\n'+            
            '    '+body('_i2')+'\n'+            
            '    '+body('_i3')+'\n'+
            '}\n'+
            'while(i>=0) {\n'+
            '    '+body('i')+'\n'+
            '    i--;\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}

numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(x[i],y[i],s,k+1,f); }
});

numeric.any = numeric.mapreduce('if(xi) return true;','false');
numeric.all = numeric.mapreduce('if(!xi) return false;','true');

;
(function () {
    numeric.ops2 = { 
            add: '+',
            sub: '-',
            mul: '*',
            div: '/',
            mod: '%',
            and: '&&',
            or:  '||',
            eq:  '===',
            neq: '!==',
            lt:  '<',
            gt:  '>',
            leq: '<=',
            geq: '>=',
            band: '&',
            bor: '|',
            bxor: '^',
            lshift: '<<',
            rshift: '>>',
            rrshift: '>>>'
    };
    numeric.opseq = {
            addeq: '+=',
            subeq: '-=',
            muleq: '*=',
            diveq: '/=',
            modeq: '%=',
            lshifteq: '<<=',
            rshifteq: '>>=',
            rrshifteq: '>>>=',
            andeq: '&=',
            oreq: '|=',
            xoreq: '^='
    }
    numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                        'exp','floor','log','round','sin','sqrt','tan'];
    numeric.ops1 = {
            neg: '-',
            not: '!',
            bnot: '~'
    }

    var i,o;
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            numeric[i+'VV'] = numeric.pointwise(['x[i]','y[i]'],'ret[i] = x[i] '+o+' y[i];');
            numeric[i+'SV'] = numeric.pointwise(['x','y[i]'],'ret[i] = x '+o+' y[i];');
            numeric[i+'VS'] = numeric.pointwise(['x[i]','y'],'ret[i] = x[i] '+o+' y;');
            numeric[i] = Function('x','y',
                    'if(typeof x === "object") {\n'+
                    '    if(typeof y === "object") return numeric.'+i+'VV(x,y);\n'+
                    '    return numeric.'+i+'VS(x,y);\n'+
                    '} else if(typeof y === "object") return numeric.'+i+'SV(x,y);\n'+
                    'return x '+o+' y;');
            numeric[o] = numeric[i];
        }
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            o = numeric.ops1[i];
            numeric[i] = numeric.pointwise(['x[i]'],'ret[i] = '+o+'x[i];');
        }
    }
    for(i=0;i<numeric.mathfuns.length;i++) {
        o = numeric.mathfuns[i];
        numeric[o] = numeric.pointwise(['x[i]'],'ret[i] = fun(x[i]);','var fun = Math.'+o+';');
    }
    for(i in numeric.opseq) {
        if(numeric.opseq.hasOwnProperty(i)) {
            numeric[i+'S'] = new Function('x','y',
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i>=0;i--) x[i] '+numeric.opseq[i]+' y;');
            numeric[i+'V'] = new Function('x','y',
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i>=0;i--) x[i] '+numeric.opseq[i]+' y[i];');
            numeric[i] = new Function('x','y',
                    'var s = numeric.dim(x);\n'+
                    'if(typeof y === "number") { numeric._biforeach(x,y,s,0,numeric.'+i+'S); return x; }\n'+
                    'numeric._biforeach(x,y,s,0,numeric.'+i+'V);\n'+
                    'return x;');
            numeric[numeric.opseq[i]] = numeric[i];
        }
    }
}());

numeric.nclone = function(x) {}
numeric.nclone = numeric.pointwise(['x[i]'],'ret[i] = x[i];');

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs;
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: inv() only works on square matrices'); }
    var n = s[0], ret = numeric.identity(n),i,j,k,A = numeric.nclone(x),Aj,Ai,Ij,Ii,alpha,temp,k0,k1,k2,k3;
    var P = numeric.linspace(0,n-1), Q = numeric.rep([n],0);
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(abs(A[i][j]) > abs(A[k][j])) { k = i; } }
        if(k!==j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            temp = ret[k]; ret[k] = ret[j]; ret[j] = temp;
            temp = P[k]; P[k] = P[j]; P[j] = temp;
        }
        Aj = A[j];
        Ij = ret[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            Ii = ret[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-3;k+=4) {
                k1 = k+1; k2 = k+2; k3 = k+3;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
                Ai[k2] -= Aj[k2]*alpha;
                Ai[k3] -= Aj[k3]*alpha;
            }
            while(k<n) { Ai[k] -= Aj[k]*alpha; k++; }
            for(k=j;k>=3;k-=4) {
                k0 = P[k-3];
                k1 = P[k-2]; k2 = P[k-1]; k3 = P[k];
                Ii[k0] -= Ij[k0]*alpha;
                Ii[k1] -= Ij[k1]*alpha;
                Ii[k2] -= Ij[k2]*alpha;
                Ii[k3] -= Ij[k3]*alpha;
            }
            while(k>=0) { Ii[P[k]] -= Ij[P[k]]*alpha; k--; }
        }
    }
    for(j=n-1;j>0;j--) {
        Aj = A[j];
        Ij = ret[j];
        for(i=0;i<j;i++) {
            Ii = ret[i];
            alpha = A[i][j]/Aj[j];
            for(k=0;k<n-3;k+=4) {
                k1 = k+1; k2 = k+2; k3 = k+3;
                Ii[k] -= Ij[k]*alpha;
                Ii[k1] -= Ij[k1]*alpha;
                Ii[k2] -= Ij[k2]*alpha;
                Ii[k3] -= Ij[k3]*alpha;
            }
            while(k<n) { Ii[k] -= Ij[k]*alpha; k++; }
        }
    }
    for(i=0;i<n;i++) {
        alpha = A[i][i];
        Ii = ret[i];
        for(j=0;j<n;j++) { Ii[j] /= alpha; }
    }
    return ret;
}

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.nclone(x),Aj,Ai,alpha,temp,k1,k2,k3;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-3;k+=4) {
                k1 = k+1; k2 = k+2; k3 = k+3;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
                Ai[k2] -= Aj[k2]*alpha;
                Ai[k3] -= Aj[k3]*alpha;
            }
            while(k<n) { Ai[k] -= Aj[k]*alpha; k++; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
}

numeric.transpose = function transpose(x) {
    var s = numeric.dim(x);
    if(s.length !== 2) { throw new Error('numeric: transpose() can only be used on matrices'); }
    var i,j,j1,j2,j3,m = s[0],n = s[1], ret=new Array(n),Ai;
    for(j=0;j<n;j++) ret[j] = new Array(m);
    for(i=0;i<m;i++) {
        Ai = x[i];
        for(j=n-1;j>=3;j-=4) {
            j1 = j-1; j2 = j-2; j3 = j-3;
            ret[j][i] = Ai[j];
            ret[j1][i] = Ai[j1];
            ret[j2][i] = Ai[j2];
            ret[j3][i] = Ai[j3];
        }
        while(j>=0) { ret[j][i] = Ai[j]; j--; }
    }
    return ret;
}

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=new Array(n), rnd, me = numeric._random;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=3;i-=4) {
            ret[i] = rnd();
            ret[i-1] = rnd();
            ret[i-2] = rnd();
            ret[i-3] = rnd();
        }
        while(i>=0) { ret[i--] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = me(s,k+1);
    return ret;
}
numeric.random = function random(s) { return numeric._random(s,0); }

numeric.norm2Squared = function norm2Squared(x) {}
numeric.norm2Squared = numeric.mapreduce('accum += xi*xi;','0');

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); }

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.round(b-a)+1;
    var i,ret = new Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = new Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
}

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
}

numeric.tensor = function tensor(x,y) {
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = new Array(m), Ai, i,j,xi,j1,j2,j3;
    for(i=m-1;i>=0;i--) {
        Ai = new Array(n);
        xi = x[i];
        for(j=n-1;j>=3;j-=4) {
            j1 = j-1; j2 = j-2; j3 = j-3;
            Ai[j] = xi * y[j];
            Ai[j1] = xi * y[j1];
            Ai[j2] = xi * y[j2];
            Ai[j3] = xi * y[j3];
        }
        while(j>=0) { Ai[j] = xi * y[j]; j--; }
        A[i] = Ai;
    }
    return A;
}

function house(x) {
    var v = numeric.nclone(x);
    var alpha = x[0]/Math.abs(x[0])*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    var i,n=v.length;
    for(i=0;i<n;i++) v[i] /= foo;
    return v;
}

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.nclone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = new Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        v = house(x);
        B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
        B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
        B = new Array(m-j-1);
        for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
    }
    return {H:A, Q:Q};
}

numeric.cdot = function cdot(A,B) {
    if(typeof A.y === "undefined") {
        if(typeof B.y === "undefined") return { x: numeric.dot(A.x,B.x) };
        return { x: numeric.dot(A.x,B.x), y: numeric.dot(A.x, B.y)};
    }
    if(typeof B.y === "undefined") return { x: numeric.dot(A.x,B.x), y: numeric.dot(A.y,B.x) };
    return {x: numeric.subeq(numeric.dot(A.x,B.x),numeric.dot(A.y,B.y)),
            y: numeric.addeq(numeric.dot(A.x,B.y),numeric.dot(A.y,B.x))};
}

numeric.csub = function csub(A,B) {
    if(typeof A.y === "undefined") {
        if(typeof B.y === "undefined") return { x: numeric.sub(A.x,B.x) };
        return { x: numeric.sub(A.x,B.x), y: numeric.neg(B.y)};
    }
    if(typeof(B.y === "undefined")) return { x: numeric.sub(A.x,B.x), y: A.y };
    return {x: numeric.sub(A.x,B.x), y: numeric.sub(A.y,B.y) };
}

numeric.cnorm2 = function(A) {
    if(typeof A.y === "undefined") { return numeric.norm2(A.x); }
    return Math.sqrt(numeric.norm2Squared(A.x)+numeric.norm2Squared(A.y));
}

numeric.cinv = function cinv(A) {
    if(typeof A.y === "undefined") { return { x: numeric.inv(A.x) }; }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.nclone(A.x), Ay = numeric.nclone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return {x:Rx, y:Ry};
}


numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.nclone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = 3e-16;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = new Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = new Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            if(Math.abs(s1-d) < Math.abs(s2-d)) { s2 = s1; }
            Hloc[0][0] -= s2;
            Hloc[1][1] -= s2;
            Hloc[2][2] -= s2;
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.mul(numeric.identity(3),det));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            J = Math.min(m-1,j+3);
            x = new Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = new Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
}


numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); }
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
}

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
}


;

