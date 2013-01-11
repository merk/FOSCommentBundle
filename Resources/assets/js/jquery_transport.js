/**
 * This file is part of the FOSCommentBundle package.
 *
 * (c) FriendsOfSymfony <http://friendsofsymfony.github.com/>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

!function ($) {
    "use strict";

    var jQueryTransport = function () {

    };

    jQueryTransport.prototype = {
        post: function(url, data, success, error, complete) {
            // Wrap the error callback to match return data between jQuery and easyXDM
            var wrappedErrorCallback = function(response){
                if('undefined' !== typeof error) {
                    error(response.responseText, response.status);
                }
            };
            var wrappedCompleteCallback = function(response){
                if('undefined' !== typeof complete) {
                    complete(response.responseText, response.status);
                }
            };
            $.post(url, data, success).error(wrappedErrorCallback).complete(wrappedCompleteCallback);
        },

        get: function(url, data, success, error) {
            // Wrap the error callback to match return data between jQuery and easyXDM
            var wrappedErrorCallback = function(response){
                if('undefined' !== typeof error) {
                    error(response.responseText, response.status);
                }
            };
            $.get(url, data, success).error(wrappedErrorCallback);
        },

        patch: function(url, data, success, error) {
            var wrappedErrorCallback = function(response) {
                if ('undefined' !== typeof error) {
                    error(response.responseText, response.status);
                }
            };
            $.ajax({
                type: 'PATCH',
                url: url,
                data: data,
                success: success,
                error: error
            });
        }
    };

    window.fos = window.fos || {};
    window.fos.comment_transports = window.fos.comment_transports || {};
    window.fos.comment_transports.jquery = jQueryTransport;
}(window.jQuery);