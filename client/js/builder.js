(function(ns) {
    'use strict';

    ns.builder = {};

    var loadedStories;
    var loadedSteps;

    // cached elements
    var storyList = $('#story-list');
    var createStory = $('#create-story');
    var editStory = $('#edit-story');
    var createStepForm = $('.create-story-step');
    var currentSteps = $('.current-steps');

    ns.builder.init = function builderInit() {
        storyList.on('click', '.edit-story', function initEdit(e) {
            e.preventDefault();
            var id = Number($(this).attr('href').substr(1));
            var story = loadedStories.filter(function findStory(data) {
                return (data.id === id);
            })[0];
            if (story) {
                ns.views.hide();
                ns.builder.initStoryEdit(story);
            } else {
                ns.showMessage('Unable to edit story, I don\'t know that one...');
            }
        });

        createStory.find('form').submit(function doCreate(e) {
            e.preventDefault();
            ns.builder.createStory( $(this).find(':text').val(), function createDone(data) {
                if (data) {
                    ns.views.hide();
                    createStory.find(':text').val('');
                    ns.builder.initStoryEdit(data);
                }
            } );
        });

        $('.show-create-step').click(function toggleCreateForm() {
            createStepForm.toggle();
        });
    };

    ns.builder.loadStoryList = function loadStoryList() {
        $.ajax({
            url: '/stories',
            type: 'get',
            dataType: 'json',
            success: function loadStorySuccess(data) {
                loadedStories = data;
                renderStoryList(data);
            },
            error: function loadStoryError(xhr) {
                console.error(xhr);
                ns.showMessage('Unable to retrieve story list from server.');
            }
        });
    };

    function renderStoryList(stories) {
        storyList.show();

        if (Array.isArray(stories)) {
            storyList.find('li').remove();
            stories.forEach(function renderStory(story) {
                storyList.find('ul')
                    .append('<li>')
                    .find('li:last-child')
                        .append(story.title)
                        .append(
                            $('<a>').attr('href', '#' + story.id).addClass('edit-story').text('edit')
                        );
            });
        }
    }

    ns.builder.showStoryCreate = function showStoryCreate() {
        createStory.show();
    };

    ns.builder.createStory = function createStory(title, cb) {
        cb = cb || function(){};

        $.ajax({
            url: '/stories',
            type: 'post',
            dataType: 'json',
            success: cb,
            error: function createError(xhr) {
                var errData;
                console.error(xhr);
                if (xhr.status === 400) {
                    ns.showMessage('Problem creating story:', xhr.responseText);
                } else {
                    ns.showMessage('Unable to create story, sorry!');
                }
                cb(null);
            }
        });
    };

    ns.builder.initStoryEdit = function initStoryEdit(data) {
        editStory.show();
        console.log('editing story', data);
        editStory.find('.story-name').text(data.title);
        loadStorySteps(data);
    };

    function loadStorySteps(story) {
        $.ajax({
            url: '/stories/' + story.id + '/steps',
            type: 'GET',
            dataType: 'json',
            success: function stepsLoaded(data) {
                loadedSteps = data;
                renderSteps(loadedSteps, story);
            },
            error: function stepLoadError(xhr) {
                console.error(xhr);
                ns.showMessage('Sorry, I was not able to load the steps for this story!');
            }
        });
    }

    function renderSteps(steps, story) {
        currentSteps.find('li').remove();
        steps.forEach(function renderStep(step) {
            var newStep = $('<li>');
            newStep
                .append( '<h4>Step ID: <span class="step-id">' + step.id + '</span></h4>' )
                .append('<form>')
                .find('form')
                    .addClass('edit-story-step')
                    .append( '<input type="hidden" class="story-id" value="' + story.id + '">' )
                    .append(
                        $('<fieldset>')
                            .append('<h4>Step Text</h4>')
                            .append('<textarea class="step-text">' + step.body + '</textarea>')
                    )
                    .append(
                        $('<fieldset>')
                            .append('<label for="step-option-a">Option A Text</label>')
                            .append('<input type="text" class="step-option-a" value="' + (step.option_a_text || '') + '">')
                            .append('<label for="step-option-a-next">Option A Next Step</label>')
                            .append('<input type="text" class="step-option-a-next" value="' + (step.option_a_step_id || '') + '">')
                    )
                    .append(
                        $('<fieldset>')
                            .append('<label for="step-option-b">Option B Text</label>')
                            .append('<input type="text" class="step-option-b" value="' + (step.option_b_text || '') + '">')
                            .append('<label for="step-option-a-next">Option B Next Step</label>')
                            .append('<input type="text" class="step-option-b-next" value="' + (step.option_b_step_id || '') + '">')
                    )
                    .append( $('<fieldset>').append('<input type="submit" value="Update">') );

            currentSteps.append(newStep);
        });
    }


    window.cyoa = ns;
})(window.cyoa || {});
