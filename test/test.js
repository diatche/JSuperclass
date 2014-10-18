/**
 * Created by diatche on 9/10/14.
 */

(function() {
    /*global $super */

    /*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit */

    'use strict';

    var Class = require("../index.js"),
        should = require("should");

    describe('$super', function() {
        it('should throw an error when used outside of a class method', function() {
            $super.should.throw();
        });
    });

    describe('Class', function() {
        describe('#init()', function() {
            it('should return an instance of Class', function() {
                should(new Class()).be.instanceOf(Class);
            });
        });

        describe('.extend()', function() {
            var counters = {
                Subclass0: 0,
                Subclass1: 0,
                Subclass2: 0,
                Subclass3: 0
            };
            var Subclass0 = Class.extend({
                init: function _Subclass0() {
                    this.should.be.instanceOf(Subclass0);
                    counters.Subclass0++;
                }
            });

            var Subclass1 = Class.extend({
                init: function _Subclass1() {
                    this.should.be.instanceOf(Subclass1);
                    if ($super() === this) {
                        counters.Subclass1++;
                    }
                    return this;
                }
            });
            var Subclass2 = Class.extend({
                init: function _Subclass2($super) {
                    this.should.be.instanceOf(Subclass2);
                    if ($super() === this) {
                        counters.Subclass2++;
                    }
                    return this;
                }
            });
            var Subclass3 = Class.extend(function () {
                var _foo = "foo";
                this.init = function _Subclass3() {
                    this.should.be.instanceOf(Subclass3);
                    counters.Subclass3++;
                };
                this.foo = function () {
                    return _foo;
                };
            });

            it('should return an instance of Function', function () {
                Subclass0.should.be.instanceOf(Function);
                Subclass1.should.be.instanceOf(Function);
                Subclass2.should.be.instanceOf(Function);
                Subclass3.should.be.instanceOf(Function);
            });

            it('should should return different subclasses', function () {
                Subclass0.should.not.equal(Subclass1);
                Subclass1.should.not.equal(Subclass2);
                Subclass2.should.not.equal(Subclass3);
                Subclass3.should.not.equal(Subclass0);
            });

            describe('#init()', function () {
                it('should call init() and return an instance of subclass', function () {
                    counters.Subclass0 = 0;
                    counters.Subclass1 = 0;
                    counters.Subclass2 = 0;
                    counters.Subclass3 = 0;
                    should(new Subclass0()).be.instanceOf(Subclass0);
                    should(new Subclass1()).be.instanceOf(Subclass1);
                    should(new Subclass2()).be.instanceOf(Subclass2);
                    should(new Subclass3()).be.instanceOf(Subclass3);
                    should(new Subclass0()).be.instanceOf(Subclass0);
                    should(new Subclass1()).be.instanceOf(Subclass1);
                    should(new Subclass2()).be.instanceOf(Subclass2);
                    should(new Subclass3()).be.instanceOf(Subclass3);
                    counters.Subclass0.should.be.exactly(2);
                    counters.Subclass1.should.be.exactly(2);
                    counters.Subclass2.should.be.exactly(2);
                    counters.Subclass3.should.be.exactly(2);
                });

                it('should return an instance of Class', function () {
                    should(new Subclass0()).be.instanceOf(Class);
                });

                it('with global $super should call superclass init method', function () {
                    counters.Subclass1 = 0;
                    var obj = new Subclass1();
                    counters.Subclass1.should.be.exactly(1);
                });

                it('with $super argument should call superclass init method', function () {
                    counters.Subclass2 = 0;
                    var obj = new Subclass2();
                    counters.Subclass2.should.be.exactly(1);
                });

                it('with function source should retain scope', function () {
                    should(new Subclass3().foo()).be.exactly("foo");
                });
            });

            describe('#class', function () {
                should((new Subclass0()).class).equal(Subclass0);
            });

        });

        describe('.extend().extend()...', function() {
                var a = 1,
                    b = 1,
                    c = 1;
                var _TestClass1 = Class.extend({
                    init: function TestClass1() {
                        this.should.be.instanceOf(_TestClass1);
                        if ($super() === this) {
                            a--;
                        }
                        return this;
                    },

                    get foo() {
                        return "a";
                    }
                });
                var _TestClass2 = _TestClass1.extend({
                    init: function TestClass2() {
                        this.should.be.instanceOf(_TestClass2);
                        if ($super() === this) {
                            b--;
                        }
                        return this;
                    },

                    get foo() {
                        return $super.foo + "b";
                    }
                });
                var _TestClass3 = _TestClass2.extend({
                    init: function TestClass3() {
                        this.should.be.instanceOf(_TestClass3);
                        if ($super() === this) {
                            c--;
                        }
                        return this;
                    },

                    get foo() {
                        return $super.foo + "c" + $super.$super.foo;
                    }
                });

                describe('#init()', function () {
                    it('should return an object which is an instance of all subclasses with all init() methods called', function () {
                        var o = new _TestClass3();
                        o.should.be.instanceOf(_TestClass3);
                        o.should.be.instanceOf(_TestClass2);
                        o.should.be.instanceOf(_TestClass1);
                        (a + b + c).should.be.exactly(0);
                    });

                    it('should define $super properties', function() {
                        (new _TestClass3()).foo.should.be.exactly("abca");
                    });
                });
        });

        describe('#create()', function() {
            it('should return an instance of subclass', function() {
                var Subclass = Class.create(new Class(), {foo: "bar"});
                var obj = new Subclass();
                should(obj).be.instanceOf(Class);
                should(obj).be.instanceOf(Subclass);
            });
        });

        /*
        it('should retain scope in asychronous calls', function(done) {
            function receive(value) {
                should(value).be.exactly(1);
                done();
            }
            var Subclass = Class.extend({
                _foo: "",
                foo: function() {
                    receive(this._foo);
                    return this._foo;
                }
            });
            var obj1 = new Subclass();
            obj1._foo = 1;
            var obj2 = new Subclass();
            obj2._foo = 2;
            setTimeout(obj1.foo.bind(obj1), 4);
        });
        */
    });
})();