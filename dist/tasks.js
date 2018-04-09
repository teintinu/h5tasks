"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lDebug;
var Tasks = {
    reset: function () {
        rootTasks = [];
        events.error = [];
    },
    get list() {
        return __spread(rootTasks);
    },
    get debug() {
        return lDebug;
    },
    set debug(value) {
        lDebug = value;
    },
    declare: function (opts) {
        var j = internalTask(opts);
        rootTasks.push(j);
        return j;
    },
    off: {
        error: function (callback) {
            var i = events.error.indexOf(callback);
            if (i > -1) {
                events.error.splice(i, 1);
            }
        },
    },
    on: {
        error: function (callback) {
            var i = events.error.indexOf(callback);
            if (i === -1) {
                events.error.push(callback);
            }
        },
    },
    asap: function (callback) {
        setTimeout(callback, 1);
    },
    delay: function (tm) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        return setTimeout(function () { return resolve(); }, tm);
                    })];
            });
        });
    },
    error: function (task, msg) {
        var err = new Error(msg);
        if (task) {
            task.was.rejected(err);
        }
        return err;
    },
};
exports.default = Tasks;
var rootTasks = [];
var events = {
    error: [],
};
function dispatch(event) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    events[event].forEach(function (callback) {
        return Tasks.asap(function () { return callback.apply(void 0, __spread(args)); });
    });
}
function dispatch_error(err) {
    dispatch("error", err);
}
function internalTask(opts) {
    /*
      0 - declared
      1 - running
      2 - success
      3 - error
    */
    var lState = 0;
    var sReason;
    var lProgress;
    var lStartedAt;
    var tryResolve;
    var tryReject;
    var lChildren = [];
    var lPromise;
    lPromise = new Promise(function (promResolve, promReject) {
        lStartedAt = new Date();
        tryResolve = function (res, noAsyncDeps) {
            if (lState > 1) {
                return;
            }
            if (typeof res === "object" && res instanceof Promise) {
                res.then(tryResolve, tryReject);
                return;
            }
            var rChildrenSuccess = 0;
            var rReason;
            var rChildrenPending = [];
            try {
                for (var lChildren_1 = __values(lChildren), lChildren_1_1 = lChildren_1.next(); !lChildren_1_1.done; lChildren_1_1 = lChildren_1.next()) {
                    var c = lChildren_1_1.value;
                    if (c.success) {
                        rChildrenSuccess++;
                    }
                    else if (c.failed) {
                        rReason = rReason || c.reason;
                    }
                    else {
                        rChildrenPending.push(c);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (lChildren_1_1 && !lChildren_1_1.done && (_a = lChildren_1.return)) _a.call(lChildren_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // if (lDebug)
            //     log(self, JSON.stringify({
            //         l: _children.length,
            //         _childrenSuccess,
            //         _childrenFailed,
            //         _childrenPending
            //     }))
            if (rChildrenPending.length === 0) {
                if (rReason) {
                    tryReject(rReason);
                }
                else if (lState !== 3) {
                    if (opts.asyncDependencies && !noAsyncDeps) {
                        opts.asyncDependencies.call(self, res)
                            .then(function () { return tryResolve(res, true); }, tryReject);
                    }
                    else {
                        lState = 2;
                        promResolve(res);
                    }
                }
            }
            else {
                Promise.all(rChildrenPending)
                    .then(function () { return tryResolve(res); }, tryReject);
            }
            var e_1, _a;
        };
        tryReject = function (reason) {
            if (lState === 3) {
                return;
            }
            lState = 3;
            sReason = reason;
            promReject(sReason);
            dispatch_error(sReason);
        };
        if (opts.resolver) {
            Tasks.asap(function () {
                if (opts.resolver) {
                    try {
                        self.was.started();
                        var res = opts.resolver.call(self);
                        self.was.successed(res);
                    }
                    catch (e) {
                        self.was.rejected(e);
                    }
                }
            });
        }
    });
    var self = lPromise;
    Object.defineProperties(self, {
        parent: {
            get: function () {
                return opts.parent;
            },
        },
        children: {
            get: function () {
                return __spread(lChildren);
            },
        },
        name: {
            get: function () {
                return opts.name;
            },
        },
        fullname: {
            get: function () {
                if (opts.parent) {
                    return [opts.parent.fullname, opts.name].join("/");
                }
                return opts.name;
            },
        },
        progress: {
            get: function () {
                return lProgress;
            },
            set: function (value) {
                lProgress = value;
            },
        },
        ETF: {
            get: function () {
                return new Date(new Date().getTime() + 1);
            },
        },
        running: {
            get: function () {
                return lState === 1;
            },
        },
        pending: {
            get: function () {
                return lState < 2;
            },
        },
        success: {
            get: function () {
                return lState === 2;
            },
        },
        failed: {
            get: function () {
                return lState === 3;
            },
        },
        reason: {
            get: function () {
                return sReason;
            },
        },
    });
    self.declare = function self_declare(cOpts) {
        var chield = internalTask({
            name: cOpts.name,
            parent: self,
            resolver: cOpts.resolver,
        });
        lChildren.push(chield);
        return chield;
    };
    self.was = {
        started: function () {
            if (lState !== 0) {
                throw new Error("Can' restart");
            }
            lState = 1;
            if (opts.parent && (!opts.parent.running)) {
                opts.parent.was.started();
            }
            if (lDebug) {
                lDebug(self, "started");
            }
        },
        successed: function (res) {
            if (lState === 3) {
                throw new Error("was failed");
            }
            if (typeof res === "object" && res instanceof Promise) {
                res.then(self.was.successed, self.was.rejected);
            }
            else {
                tryResolve(res);
                if (lDebug) {
                    lDebug(self, "successed", JSON.stringify(res));
                }
            }
        },
        rejected: function (reason) {
            tryReject(reason);
            if (lDebug) {
                lDebug(self, "rejected", reason);
            }
        },
    };
    self.error = function (msg) { return Tasks.error(self, msg); };
    if (lDebug) {
        lDebug(self, "declared");
    }
    return self;
}
//# sourceMappingURL=tasks.js.map