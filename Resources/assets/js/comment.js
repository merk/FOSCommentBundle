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

    var Comment = function (container, transport) {
        this.container   = container;
        this.identifier  = container.data('thread-id');
        this.baseUrl     = container.data('base-url');
        this.newPosition = container.data('new-position') || 'top';

        if ('undefined' === typeof transport) {
            transport = new window.fos.comment_transports.jquery();
        }
        this.transport = transport;

        this.initialiseListeners();
    };

    Comment.prototype = {
        /**
         * Initialises listeners on the container.
         */
        initialiseListeners: function() {
            this.container.on('click', '.fos_comment_comment_reply_show_form', $.proxy(this._handleReplyButton, this));
            this.container.on('click', '.fos_comment_comment_reply_cancel', $.proxy(this._handleCancelButton, this));
            this.container.on('submit', '.fos_comment_comment_new_form', $.proxy(this._handleNewSubmit, this));

            //this.container.on('submit', '.fos_comment_comment_edit_form', $.proxy(this._handleEditSubmit, this));
            //this.container.on('click', '.fos_comment_comment_edit_show_form', $.proxy(this.showEdit, this));
            //this.container.on('click', '.fos_comment_comment_edit_cancel', $.proxy(this.hideEdit, this));

            //this.container.on('click', '.fos_comment_comment_vote', $.proxy(this.vote, this));
            // this.container.on('click', '.fos_comment_thread_commentable_action', $.proxy(this.lockThread, this)); -- not really what we're after

        },

        /**
         * Load thread comments.
         */
        loadComments: function () {
            var event = this._trigger(this, 'fos_comment_before_load_thread', {
                permalink: encodeURIComponent(window.location.href)
            });

            this.transport.get(
                this.baseUrl + '/' + encodeURIComponent(this.identifier) + '/comments',
                event.params,
                $.proxy(this._insertComments, this),
                $.proxy(this._raiseError, this)
            );
        },

        /**
         * Handles a new comment form submission. This function is called
         * from an onsubmit event.
         */
        _handleNewSubmit: function (e) {
            e.preventDefault();

            var form             = $(e.target),
                commentContainer = form.parents('.fos_comment_comment_group:first').find('.fos_comment_comments:first'),
                event            = this._trigger(form, 'fos_comment_submitting_new_form', {
                    action: form.attr('action'),
                    commentContainer: commentContainer,
                    data: this._serializeObject(form)
                });

            var self = this;
            this.transport.post(
                event.params.action,
                event.params.data,
                function (data) {
                    self._insertComment(data, event.params.commentContainer);
                    self._closeForm(form);
                },
                function (data, status) {
                    self._formError(data, status, form.parent());
                }
            );
        },

        /**
         * Handles reply button events
         */
        _handleReplyButton: function (e) {
            e.preventDefault();

            var button  = $(e.target),
                comment = button.parents('[data-depth]'),
                event   = this._trigger(comment, 'fos_comment_show_reply', {
                    parentId: button.data('parentId'),
                    url: button.data('url'),
                    replacementCallback: function (data) {
                        button.after(data);
                    }
                });

            this.transport.get(
                event.params.url,
                { parentId: event.params.parentId },
                function (data) {
                    $('.fos_comment_comment_form_holder:not(.fos_comment_comment_form_root)').remove();

                    comment.addClass('fos_comment_replying');
                    event.params.replacementCallback(data);
                },
                $.proxy(this._raiseError, this)
            );
        },

        _handleCancelButton: function (e) {
            e.preventDefault();

            var button = $(e.target);

            this._closeForm(button.parents('.fos_comment_comment_new_form'));
        },

        /**
         * Performs the insertion of comments loaded by AJAX, handling
         * event dispatching.
         *
         * @param data HTML string representing the comment thread
         */
        _insertComments: function (data) {
            var event = this._trigger(this, 'fos_comment_loading_thread', {
                data: data
            });

            this.container.trigger(event);
            this.container.html(event.params.data);
            this._trigger(this, 'fos_comment_loaded_thread');
        },

        /**
         * Inserts new comment html in the commentContainer depending
         * on the configured insertion place.
         *
         * @param commentHtml
         * @param commentContainer
         * @param form
         */
        _insertComment: function(commentHtml, commentContainer) {
            var depth = commentContainer.parents('.fos_comment_comment_group').data('depth'),
                event = this._trigger(commentContainer, 'fos_comment_adding_comment', {
                    commentHtml: commentHtml,
                    depth: depth || 0,
                    position: this.newPosition
                }),
                comment = $(event.params.commentHtml);

            if ('bottom' === event.params.position) {
                commentContainer.append(comment);
            } else {
                commentContainer.prepend(comment);
            }

            this._trigger(comment, 'fos_comment_added_comment');
        },

        /**
         * Triggers an event.
         *
         * @param on
         * @param eventName
         */
        _trigger: function(on, eventName, additionalParams) {
            var event = $.Event(eventName);
            event.thread = this;
            event.params = additionalParams;

            $(on).trigger(event);

            return event;
        },

        /**
         * Resets or removes forms from the dom depending on if the form
         * is the root form or not.
         *
         * @param form
         */
        _closeForm: function(form) {
            if (form.is('[data-parent=""]')) {
                form.reset();

                return;
            }

            // FOSCommentBundle's reply forms are wrapped in a div
            form.parent().remove();
        },

        /**
         * Raises an error event.
         *
         * @param responseText
         * @param status
         */
        _raiseError: function(responseText, status) {
            this._trigger(this, 'fos_comment_error', {
                text: responseText,
                status: status
            });
        },

        /**
         * When a form submission comes back bad, we replace the form itself.
         *
         * @param responseText
         * @param status
         * @param formContainer
         * @private
         */
        _formError: function(responseText, status, formContainer) {
            if (400 === status) {
                formContainer.after(responseText);
                formContainer.remove();

                return;
            }

            this._raiseError(responseText, status);
        },

        /**
         * easyXdm doesn't seem to pick up 'normal' serialized forms yet in the
         * data property, so use this for now.
         * http://stackoverflow.com/questions/1184624/serialize-form-to-json-with-jquery#1186309
         */
        _serializeObject: function(obj)
        {
            var o = {};
            var a = $(obj).serializeArray();
            $.each(a, function() {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        }
    };

    window.fos = window.fos || {};
    window.fos.Comment = Comment;
}(window.jQuery);
