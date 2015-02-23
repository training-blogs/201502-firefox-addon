var widgets = require('sdk/widget');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var panels = require('sdk/panel');
var simpleStorage = require('sdk/simple-storage');
var notifications = require("sdk/notifications");

var annotatorIsOn = false;

var selectors = [];

function activateSelectors() {
    selectors.forEach(function(selector) {
        selector.postMessage(annotatorIsOn);
    });
}

function toggleActivation() {
    annotatorIsOn = !annotatorIsOn;
    activateSelectors();
    return annotatorIsOn;
}

function detachWorker(worker, workerArray) {
    var index = workerArray.indexOf(worker);
    if (index != -1) {
        workerArray.splice(index, 1);
    }
}

exports.main = function() {
    var widget = widgets.Widget({
        id: 'toggle-switch',
        label: 'Annotator',
        contentURL: data.url('widget/pencil-off.png'),
        contentScriptWhen: 'ready',
        contentScriptFile: data.url('widget/widget.js')
    });

    widget.port.on('left-click', function() {
        console.log('activate/deactivate');
        widget.contentURL = toggleActivation() ? data.url('widget/pencil-on.png') : data.url('widget/pencil-off.png');
    });

    widget.port.on('right-click', function() {
        notifications.notify({
            title: 'test notif title',
            text: 'test notif text'
        });
        console.log('show annotation list');
        annotationList.show();
    });
};

var selector = pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'ready',
    contentScriptFile: [data.url('jquery-1.11.2.js'), data.url('selector.js')],
    onAttach: function(worker) {
        worker.postMessage(annotatorIsOn);
        selectors.push(worker);
        worker.port.on('show', function(data) {
            annotationEditor.annotationAnchor = data;
            annotationEditor.show();
        });
        worker.on('detach', function() {
            detachWorker(this, selectors);
        });
    }
});

var annotationEditor = panels.Panel({
    width: 220,
    height: 220,
    contentURL: data.url('editor/annotation-editor.html'),
    contentScriptFile: data.url('editor/annotation-editor.js'),
    onMessage: function(annotationText) {
        if (annotationText) {
            handleNewAnnotation(annotationText, this.annotationAnchor);
        }
        annotationEditor.hide();
    },
    onShow: function() {
        this.postMessage('focus');
    }
});

if (!simpleStorage.storage.annotations) {
    simpleStorage.storage.annotations = [];
}

function handleNewAnnotation(annotationText, anchor) {
    var newAnnotation = new Annotation(annotationText, anchor);
    simpleStorage.storage.annotations.push(newAnnotation);
}

function Annotation(annotationText, anchor) {
    this.annotationText = annotationText;
    this.url = anchor[0];
    this.ancestorId = anchor[1];
    this.anchorText = anchor[2];
}

var annotationList = panels.Panel({
    width: 420,
    height: 200,
    contentURL: data.url('list/annotation-list.html'),
    contentScriptFile: [data.url('jquery-1.11.2.js'), data.url('list/annotation-list.js')],
    contentScriptWhen: 'ready',
    onShow: function() {
        this.postMessage(simpleStorage.storage.annotations);
    },
    onMessage: function(message) {
        require('sdk/tabs').open(message);
    }
});

simpleStorage.on("OverQuota", function() {
    notifications.notify({
        title: 'Storage space exceeded',
        text: 'Removing recent annotations'
    });
    while (simpleStorage.quotaUsage > 1) {
        simpleStorage.storage.annotations.pop();
    }
});