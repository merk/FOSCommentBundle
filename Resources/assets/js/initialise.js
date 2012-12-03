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

    $(function () {
        $('[data-thread-id]').each(function () {
            var threadDom = $(this),
                thread = new window.fos.Comment(threadDom);

            threadDom.data('thread', thread);
            thread.loadComments();
        });
    });

}(window.jQuery);