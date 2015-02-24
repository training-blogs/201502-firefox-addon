self.on('message', function onMessage(annotations) {
    annotations.forEach(function(annotation) {
        if (annotation.url == document.location.toString()) {
            createAnchor(annotation);
        }
    });

    $('.annotated')
        .css('border', 'solid 3px yellow')
        .bind('mouseenter', function(event) {
            self.port.emit('show', $(this).attr('annotation'));
            event.stopPropagation();
            event.preventDefault();
        }).bind('mouseleave', function() {
            self.port.emit('hide');
        });
});

function createAnchor(annotation) {
    var annotationAnchorAncestor = $('#' + annotation.ancestorId);
    var annotationAnchor = $(annotationAnchorAncestor).parent().find(':contains(' + annotation.anchorText + ')').last();
    $(annotationAnchor)
        .addClass('annotated')
        .attr('annotation', annotation.annotationText);
}