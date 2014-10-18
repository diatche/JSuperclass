/**
 * Created by diatche on 4/10/14.
 */

/**
 * @module Class
 */

//noinspection ThisExpressionReferencesGlobalObjectJS
(function(global) {
    'use strict';

    var jsuper = require("jsuper");

    var sealed = {
            enumerable: false,
            writable: false,
            configurable: false
        },
        initMethodNames = ["constructor", "initializer", "initialize", "init"];

    //noinspection JSUnusedGlobalSymbols
    /**
     * @namespace
     * @this {Function}
     */
    var SealedClassMethods = {
        /**
         * @param {...(Object|Function)} source A list of objects and or functions to use as the source for the subclass' methods.
         * @returns {Function}
         */
        subclass: function subclass(source) {
            var constructor = getConstructor.apply(this, arguments);

            // Apply inheritance
            if (this !== SealedClassMethods) {
                constructor = inheritClass(constructor, this);
            } else {
                addBuiltInMethodsIfNeeded(constructor);
            }

            // Add specified methods
            for (var i = 0, len = arguments.length; i < len; i++) {
                switch (typeof arguments[i]) {
                    case "object":
                    case "function":
                        constructor.addInstanceMethods(/** @lends constructor */ arguments[i]);
                        break;
                }
            }

            return constructor;
        },

        /**
         * Defines instance methods on the class.
         * @param {(Object|Function)} source
         * @returns {Function} The receiver.
         */
        addInstanceMethods: function addInstanceMethods(source) {
            //noinspection JSUnresolvedVariable
            jsuper(define(this.prototype, source));
            return this;
        },

        /**
         * Defines class methods on the receiver.
         * @param {(Object|Function)} source
         * @returns {(Object|Function)} The receiver.
         */
        addClassMethods: function addClassMethods(source) {
            return define(this, source);
        }
    };
    /** @borrows SealedClassMethods.subclass as extend */
    SealedClassMethods.extend = SealedClassMethods.subclass;
    /** @borrows SealedClassMethods.addInstanceMethods as addMethods */
    SealedClassMethods.addMethods = SealedClassMethods.addInstanceMethods;

    /**
     * The base class.
     * @class Class
     * @alias module:Class
     * @mixes {SealedClassMethods}
     */
    var Class = SealedClassMethods.subclass();

    /** @borrows define as define */
    Class.define = define;
    /**
     * Applies inheritance and defines Class methods on both constructors as required.
     * @param {Function} sub Subclass constructor.
     * @param {Function} sup Superclass constructor.
     * @returns {Function} The subclass.
     */
    Class.inherit = inheritClass;

    /**
     * Creates a subclass from the specified prototype (or constructor) with the supplied methods. This supports PrototypeJS style sub-classing.
     * @example Class.create(new Class(), {foo: bar});
     * @param {(Object|Function)} object A prototype or constructor
     * @param {...(Object|Function)} [source] Methods to add.
     * @returns {Function} The subclass.
     */
    Class.create = function(object, source) {
        if (typeof object !== "function") {
            object = object.constructor;
        }
        var i, c = arguments.length, sourceArgs = new Array(c-1);
        for (i = 1; i < c; i++) {
            sourceArgs[i-1] = arguments[i];
        }
        var constructor = getConstructor.apply(this, sourceArgs);
        constructor = Class.inherit(constructor, object);
        for (i = 1; i < c; i++) {
            constructor.addInstanceMethods(arguments[i]);
        }
        return constructor;
    };

    global.Class = Class;
    module.exports = Class;

    function inheritClass(sub, sup) {
        // Define $super in constructor if needed
        sub = jsuper(sub, sup);

        // Apply prototype inheritance
        inherits(sub, sup);

        addBuiltInMethodsIfNeeded(sub, sup);
        addBuiltInMethodsIfNeeded(sup);

        sup._addSubclass(sub);

        return sub;
    }

    function addBuiltInMethodsIfNeeded(constructor, sup) {
        if (constructor.__JSuperclassDefined) {
            return;
        }

        var subclasses = [],
            p = constructor.prototype;

        //noinspection JSUnusedGlobalSymbols
        define(constructor, /** @lends constructor */ {
            /**
             * The inherited class.
             * @type {Function}
             */
            superclass: sup || null,

            /**
             * Classes which inherit from this class.
             * @returns {Array}
             */
            get subclasses() {
                return subclasses;
            },

            /**
             * @param {Function} c
             * @private
             */
            _addSubclass: function (c) {
                subclasses.push(c);
            }
        }, sealed);

        // Add built-in methods
        define(p, /** @lends p */ {
            /**
             * The receiver's class object.
             * @type {Function}
             */
            class: constructor
        }, sealed);

        define(constructor, /** @lends constructor */ {
            /**
             * The receiver.
             * @type {Function}
             */
            class: constructor
        }, sealed);
        define(constructor, /** @lends constructor */ SealedClassMethods, sealed);

        constructor.__JSuperclassDefined = true;
    }

    /**
     * Return the custom constructor if present, otherwise the default constructor.
     * @param {...(Object|Function)} source
     * @returns {Function}
     */
    function getConstructor(source) {
        /**
         * Default constructor.
         * @constructor
         */
        function $class() {
            return this;
        }

        var i,
            len = arguments.length,
            constructor = $class,
            obj = {},
            nativeConstructor = obj.constructor;

        // Check for custom constructor
        for (i = 0; i < len; i++) {
            switch (typeof arguments[i]) {
                case "object":
                case "function":
                    define(obj, arguments[i]);
                    break;
            }
        }
        initMethodNames.forEach(function (initName) {
            if (initName === "constructor" && obj.constructor === nativeConstructor) {
                return;
            }
            if (typeof obj[initName] === "function") {
                constructor = obj[initName];
            }
        });

        return constructor;
    }

    /**
     * Copies properties to the object with options.
     * @param {Object} obj The object to which the properties will be copied.
     * @param {(Object|Function)} source Properties to copy from.
     * @param {Object} [opts] Property description options to apply to all properties.
     * @returns {Object} The same object.
     */
    function define(obj, source, opts) {
        if (typeof source === "function") {
            if (opts) {
                var temp = {};
                source.apply(temp);
                define(obj, temp, opts);
            } else {
                source.apply(obj);
            }
        } else if (typeof source === "object") {
            var desc;
            Object.getOwnPropertyNames(source).forEach(function(prop) {
                desc = Object.getOwnPropertyDescriptor(source, prop);
                if (opts) {
                    define(desc, opts);
                    if (!("value" in desc)) {
                        delete desc.writable;
                    }
                }
                Object.defineProperty(obj, prop, desc);
            });
        }
        return obj;
    }

    /* Source: inherits */
    function inherits(sub, sup) {
        sub.super_ = sup;
        sub.prototype = Object.create(sup.prototype, {
            constructor: {
                value: sub,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    }
})(global || this);