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
var Tasks = {
    debug: false,
    reset: function () {
        _tasks = [];
        _on.error = [];
    },
    get list() {
        return __spread(_tasks);
    },
    declare: function (opts) {
        var j = internalTask(opts);
        _tasks.push(j);
        return j;
    },
    on: {
        error: function (callback) {
            var i = _on.error.indexOf(callback);
            if (i === -1) {
                _on.error.push(callback);
            }
        },
    },
    off: {
        error: function (callback) {
            var i = _on.error.indexOf(callback);
            if (i > -1) {
                _on.error.splice(i, 1);
            }
        },
    },
    log: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        log.apply(void 0, __spread([null, message], args));
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
};
exports.default = Tasks;
var _tasks = [];
var _on = {
    error: [],
};
function dispatch(event) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    _on[event].forEach(function (callback) {
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
    var _state = 0;
    var _reason;
    var _progress;
    var _startedAt;
    var _tryResolve;
    var _tryReject;
    var _children = [];
    var _promise;
    var self = {
        get parent() {
            return opts.parent;
        },
        get children() {
            return __spread(_children);
        },
        get name() {
            return opts.name;
        },
        get fullname() {
            if (opts.parent) {
                return [opts.parent.fullname, opts.name].join("/");
            }
            return opts.name;
        },
        get progress() {
            return _progress;
        },
        set progress(value) {
            _progress = value;
        },
        get ETF() {
            return new Date(new Date().getTime() + 1);
        },
        get running() {
            return _state === 1;
        },
        get pending() {
            return _state < 2;
        },
        get success() {
            return _state === 2;
        },
        get failed() {
            return _state === 3;
        },
        get reason() {
            return _reason;
        },
        get promise() {
            return _promise;
        },
        log: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            log.apply(void 0, __spread([self, message], args));
        },
        declare: function (opts) {
            var chield = internalTask({
                parent: self,
                name: opts.name,
                resolver: opts.resolver,
            });
            _children.push(chield);
            return chield;
        },
        was: {
            started: function () {
                if (_state !== 0) {
                    throw new Error("Can' restart");
                }
                _state = 1;
                if (opts.parent && (!opts.parent.running)) {
                    opts.parent.was.started();
                }
                if (Tasks.debug) {
                    log(self, "started");
                }
            },
            successed: function (res) {
                if (_state === 3) {
                    throw new Error("was failed");
                }
                if (typeof res === "object" && res instanceof Promise) {
                    res.then(self.was.successed, self.was.rejected);
                }
                else {
                    _tryResolve(res);
                    if (Tasks.debug) {
                        log(self, "successed", JSON.stringify(res));
                    }
                }
            },
            rejected: function (reason) {
                _tryReject(reason);
                if (Tasks.debug) {
                    log(self, "rejected", reason);
                }
            },
        },
        then: function (onfulfilled, onrejected) {
            return _promise.then(onfulfilled, onrejected);
        },
    };
    if (Tasks.debug) {
        log(self, "declared");
    }
    _promise = new Promise(function (promResolve, promReject) {
        _tryResolve = function (res, noAsyncDeps) {
            if (_state > 1) {
                return;
            }
            if (typeof res === "object" && res instanceof Promise) {
                res.then(_tryResolve, _tryReject);
                return;
            }
            var _childrenSuccess = 0;
            var _reason;
            var _childrenPending = [];
            try {
                for (var _children_1 = __values(_children), _children_1_1 = _children_1.next(); !_children_1_1.done; _children_1_1 = _children_1.next()) {
                    var c = _children_1_1.value;
                    if (c.success) {
                        _childrenSuccess++;
                    }
                    else if (c.failed) {
                        _reason = _reason || c.reason;
                    }
                    else {
                        _childrenPending.push(c.promise);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_children_1_1 && !_children_1_1.done && (_a = _children_1.return)) _a.call(_children_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // if (Tasks.debug)
            //     log(self, JSON.stringify({ l: _children.length, _childrenSuccess, _childrenFailed, _childrenPending }))
            if (_childrenPending.length === 0) {
                if (_reason) {
                    _tryReject(_reason);
                }
                else if (_state !== 3) {
                    if (opts.asyncDependencies && !noAsyncDeps) {
                        opts.asyncDependencies.call(self, res)
                            .then(function () { return _tryResolve(res, true); }, _tryReject);
                    }
                    else {
                        _state = 2;
                        promResolve(res);
                    }
                }
            }
            else {
                Promise.all(_childrenPending)
                    .then(function () { return _tryResolve(res); }, _tryReject);
            }
            var e_1, _a;
        };
        _tryReject = function (reason) {
            if (_state === 3) {
                return;
            }
            _state = 3;
            _reason = reason;
            promReject(_reason);
            dispatch_error(_reason);
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
    return self;
}
function log(task, msg) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (task) {
        console.log(__spread([task.fullname, msg], args).join(" "));
    }
    else {
        //tslint:disable:no-console
        console.log(__spread([msg], args).join(" "));
    }
}
//# sourceMappingURL=tasks.js.map