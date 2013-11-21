(function ($) {
    'use strict';

    $.app = {
        addBtn: $('.add-btn'),
        cancelBtn: $('.cancel-btn'),
        saveBtn: $('.save-btn'),
        addPanel: $('.add-panel'),
        textareaPanel: $('.add-panel-textarea'),
        taskList: $('.task-list'),
        currentTask: '',
        currentTaskId: null,
        editTaskId: null,
        lastTaskId: null,

        init: function () {
            this.changeTaskListHeight();

            document.addEventListener("deviceready", this.onDeviceReady, false);

            this.addBtn.on('click', this.showAddPanel);
            this.cancelBtn.on('click', this.hideAddPanel);
            this.saveBtn.on('click', this.saveTask);
            this.taskList.on('swipeleft swiperight', 'li', this.deleteTask);
            this.taskList.on('click', 'li', this.editTask);
            this.taskList.on('click', '.task-undo', this.undoTask);
        },
        changeTaskListHeight: function() {
            $.app.taskList.css('height', window.innerHeight - 90 + 'px');
        },
        onDeviceReady: function () {
            var db = $.app.openDB();
            db.transaction($.app.populateDB, $.app.errorCB, $.app.successCB);
        },
        openDB: function() {
            return window.openDatabase("Database", "1.0", "DEMO", 200000);
        },
        populateDB: function (tx) {
            //tx.executeSql('DROP TABLE IF EXISTS DEMO');
            tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (id INTEGER PRIMARY KEY, task)');
        },
        errorCB: function (err) {
            alert("Error processing SQL: " + err.code);
        },
        successCB: function () {
            var db = $.app.openDB();
            db.transaction($.app.queryDB, $.app.errorCB);
        },
        queryDB: function (tx) {
            tx.executeSql('SELECT * FROM DEMO ORDER BY id DESC', [], $.app.querySuccess, $.app.errorCB);
        },
        querySuccess: function (tx, results) {
            var len = results.rows.length;

            for (var i = 0; i < len; i++) {
                $.app.taskList.append("<li id='" + results.rows.item(i).id + "'><span class='task'>" + results.rows.item(i).task + "</span></li>");
            }

            $.app.lastTaskId = ($.app.taskList.children().length > 0) ? $($.app.taskList.children()[0]).attr('id') : 0;
        },
        insertTaskToDB: function (tx) {
            tx.executeSql('INSERT INTO DEMO (task) VALUES ("' + $.app.currentTask + '")');
        },
        updateTaskToDB: function (tx) {
            tx.executeSql('UPDATE DEMO SET task = "' + $.app.currentTask + '" WHERE id = "'+ $.app.editTaskId +'"');
        },
        showAddPanel: function () {
            $.app.textareaPanel.val('');

            $.app.taskList.addClass('is-hidden');
            $.app.addBtn.addClass('is-active');
            $.app.addPanel.addClass('is-active')
                          .removeClass('edit');

            $.app.textareaPanel.focus();
        },
        hideAddPanel: function () {
            $.app.addBtn.removeClass('is-active');
            $.app.addPanel.removeClass('is-active');
            $.app.taskList.removeClass('is-hidden');

            $.app.textareaPanel.focusout();
        },
        saveTask: function () {
            $.app.currentTask = $.app.textareaPanel.val();

            if ($.app.currentTask !== '') {
                var db = $.app.openDB();

                if ($.app.addPanel.hasClass('edit')) {
                    var id = $.app.editTaskId,
                        taskItem = $.app.taskList.find('#' + id),
                        task = taskItem.find('.task');

                    taskItem.addClass('is-active');
                    task.text($.app.currentTask);

                    db.transaction($.app.updateTaskToDB, $.app.errorCB);
                } else {
                    var id = ++$.app.lastTaskId;
                    $.app.taskList.prepend("<li class='is-active' id='" + id + "'><span class='task'>" + $.app.currentTask + "</span></li>");

                    db.transaction($.app.insertTaskToDB, $.app.errorCB);
                }
            }
            
            setTimeout(function () {
                $.app.taskList.find('li.is-active').removeClass('is-active');
            }, 2750);

            $.app.hideAddPanel();
        },
        deleteTask: function (event) {
            var taskItem = $(event.currentTarget),
                dir = event.type === "swipeleft" ? "left" : "right";

            taskItem.addClass(dir).addClass('swipe');
            
            setTimeout(function () {
                taskItem.append('<span class="task-undo">UNDO</span>');
            }, 250);

            setTimeout(function () {
                if (!taskItem.hasClass('undo')) {
                    taskItem.remove();

                    $.app.currentTaskId = taskItem.attr('id');
                    var db = $.app.openDB();
                    db.transaction($.app.deleteTaskFromDB, $.app.errorCB);
                }
            }, 1500);
        },
        deleteTaskFromDB: function (tx) {
            tx.executeSql('DELETE FROM DEMO WHERE id = "' + $.app.currentTaskId + '"');
        },
        undoTask: function (event) {
            var taskItem = $(event.currentTarget).parent();

            taskItem.attr('class', 'swipe undo')
                    .find('.task-undo').remove();

            setTimeout(function () {
                taskItem.attr('class', '');
            }, 1000);
        },
        editTask: function (event) {
            var taskItem = $(event.currentTarget);
            
            if (!taskItem.hasClass('swipe')) {
                $.app.showAddPanel();
                $.app.textareaPanel.val(taskItem.find('.task').text());
                $.app.addPanel.addClass('edit');
                $.app.editTaskId = taskItem.attr('id');
            }
        }
    };

    $.app.init();

})(window.jQuery);