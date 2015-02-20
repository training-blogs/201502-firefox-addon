var textArea = document.getElementById('annotation-box');

textArea.onkeyup = function(event) {
    if (event.keyCode == 13) {
        self.postMessage(textArea.value);
        textArea.value = '';
    }
};

self.on('message', function() {
    textArea.value = '';
    textArea.focus();
});