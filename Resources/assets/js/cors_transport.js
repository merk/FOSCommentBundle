/**
 * This file is part of the FOSCommentBundle package.
 *
 * (c) FriendsOfSymfony <http://friendsofsymfony.github.com/>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

!function () {
    "use strict";

    /**
     * A transport using easyXDM.
     *
     * @param easyXDM Global EasyXDM object
     * @param remoteUrl the remote cors url
     */
    var corsTransport = function (easyXDM, remoteUrl) {
        this.xhr = new easyXDM.noConflict('FOS_COMMENT').Rpc({ remote: remoteUrl }, { remote: { request: {} } });
    };

    corsTransport.prototype = {
        request: function(method, url, data, success, error) {
            // wrap the callbacks to match the callback parameters of jQuery
            var wrappedSuccessCallback = function(response){
                if('undefined' !== typeof success) {
                    success(response.data, response.status);
                }
            };
            var wrappedErrorCallback = function(response){
                if('undefined' !== typeof error) {
                    error(response.data.data, response.data.status);
                }
            };

            // todo: is there a better way to do this?
            this.xhr.request({
                url: url,
                method: method,
                data: data
            }, wrappedSuccessCallback, wrappedErrorCallback);
        },

        post: function(url, data, success, error) {
            this.request('POST', url, data, success, error);
        },

        get: function(url, data, success, error) {
            // make data serialization equals to that of jquery
            var params = jQuery.param(data);
            url += '' != params ? '?' + params : '';

            this.request('GET', url, undefined, success, error);
        }
    };

    window.fos = window.fos || {};
    window.fos.comment_transports = window.fos.comment_transports || {};
    window.fos.comment_transports.cors = corsTransport;
}();
