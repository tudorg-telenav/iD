iD.ui.MapData = function(context) {
    var key = 'F',
        features = context.features().keys(),
        fills = ['wireframe', 'partial', 'full'],
        fillDefault = context.storage('area-fill') || 'partial',
        fillSelected = fillDefault;

    function map_data(selection) {

        function showsFeature(d) {
            return context.features().enabled(d);
        }

        function autoHiddenFeature(d) {
            return context.features().autoHidden(d);
        }

        function clickFeature(d) {
            context.features().toggle(d);
            update();
        }

        function showsFill(d) {
            return fillSelected === d;
        }

        function setFill(d) {
            _.each(fills, function(opt) {
                context.surface().classed('fill-' + opt, Boolean(opt === d));
            });

            fillSelected = d;
            if (d !== 'wireframe') {
                fillDefault = d;
                context.storage('area-fill', d);
            }
            update();
        }

        function clickGpx() {
            context.background().toggleGpxLayer();
            update();
        }

        function clickMapillary() {
            context.background().toggleMapillaryLayer();
            update();
        }

        function clickTelenavTR() {
            context.background().toggleTelenavLayerTR();
            update();
        }

        function clickTelenavMR() {
            context.background().toggleTelenavLayerMR();
            update();
        }

        function clickTelenavDOF() {
            context.background().toggleTelenavLayerDOF();
            update();
        }

        function clickTelenav() {
            context.background().toggleTelenavLayer();
            update();
        }

        function drawList(selection, data, type, name, change, active) {
            var items = selection.selectAll('li')
                .data(data);

            //enter
            var enter = items.enter()
                .append('li')
                .attr('class', 'layer')
                .call(bootstrap.tooltip()
                    .html(true)
                    .title(function(d) {
                        var tip = t(name + '.' + d + '.tooltip'),
                            key = (d === 'wireframe' ? 'W' : null);

                        if (name === 'feature' && autoHiddenFeature(d)) {
                            tip += '<div>' + t('map_data.autohidden') + '</div>';
                        }
                        return iD.ui.tooltipHtml(tip, key);
                    })
                    .placement('top')
                );

            var label = enter.append('label');

            label.append('input')
                .attr('type', type)
                .attr('name', name)
                .on('change', change);

            label.append('span')
                .text(function(d) { return t(name + '.' + d + '.description'); });

            //update
            items
                .classed('active', active)
                .selectAll('input')
                .property('checked', active)
                .property('indeterminate', function(d) {
                    return (name === 'feature' && autoHiddenFeature(d));
                });

            //exit
            items.exit()
                .remove();
        }

        function update() {
            featureList.call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
            fillList.call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);

            var hasGpx = context.background().hasGpxLayer(),
                showsGpx = context.background().showsGpxLayer(),
                showsMapillary = context.background().showsMapillaryLayer(),
                showsTelenavTR = context.background().showsTelenavLayerTR(),
                showsTelenavMR = context.background().showsTelenavLayerMR(),
                showsTelenavDOF = context.background().showsTelenavLayerDOF();
                showsTelenav = context.background().showsTelenavLayer();

            gpxLayerItem
                .classed('active', showsGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);

            mapillaryLayerItem
                .classed('active', showsMapillary)
                .selectAll('input')
                .property('checked', showsMapillary);

            telenavLayerItemTR
                .classed('active', showsTelenavTR)
                .selectAll('input')
                .property('checked', showsTelenavTR);

            telenavLayerItemMR
                .classed('active', showsTelenavMR)
                .selectAll('input')
                .property('checked', showsTelenavMR);

            telenavLayerItemDOF
                .classed('active', showsTelenavDOF)
                .selectAll('input')
                .property('checked', showsTelenavDOF);

            telenavLayerItem
                .classed('active', showsTelenav)
                .selectAll('input')
                .property('checked', showsTelenav);
        }

        function hidePanel() { setVisible(false); }

        function togglePanel() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function toggleWireframe() {
            if (d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
            setFill((fillSelected === 'wireframe' ? fillDefault : 'wireframe'));
            context.map().pan([0,0]);  // trigger a redraw
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection.on('mousedown.map_data-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    content.style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    content.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.map_data-inside', null);
                }
            }
        }


        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('map_data.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', togglePanel)
                .call(iD.svg.Icon('#icon-data', 'light'))
                .call(tooltip),
            shown = false;

        content.append('h4')
            .text(t('map_data.title'));


        // data layers
        content.append('a')
            .text(t('map_data.data_layers'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                layerContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var layerContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'block');

        // mapillary
        var mapillaryLayerItem = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        var label = mapillaryLayerItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('mapillary.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickMapillary);

        label.append('span')
            .text(t('mapillary.title'));

        // telenav
        var telenavLayerItemTR = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        label = telenavLayerItemTR.append('label')
            .call(bootstrap.tooltip()
                .title(t('telenav_tr.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickTelenavTR);

        label.append('span')
            .text(t('telenav_tr.title'));

        var telenavLayerItemMR = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        label = telenavLayerItemMR.append('label')
            .call(bootstrap.tooltip()
                .title(t('telenav_mr.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickTelenavMR);

        label.append('span')
            .text(t('telenav_mr.title'));

        var telenavLayerItemDOF = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        label = telenavLayerItemDOF.append('label')
            .call(bootstrap.tooltip()
                .title(t('telenav_dof.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickTelenavDOF);

        label.append('span')
            .text(t('telenav_dof.title'));

        var telenavLayerItem = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        label = telenavLayerItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('telenav.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickTelenav);

        label.append('span')
            .text(t('telenav.title'));

        // gpx
        var gpxLayerItem = layerContainer.append('ul')
            .style('display', iD.detect().filedrop ? 'block' : 'none')
            .attr('class', 'layer-list')
            .append('li')
            .classed('layer-toggle-gpx', true);

        gpxLayerItem.append('button')
            .attr('class', 'layer-extent')
            .call(bootstrap.tooltip()
                .title(t('gpx.zoom'))
                .placement('left'))
            .on('click', function() {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.background().zoomToGpxLayer();
            })
            .call(iD.svg.Icon('#icon-search'));

        gpxLayerItem.append('button')
            .attr('class', 'layer-browse')
            .call(bootstrap.tooltip()
                .title(t('gpx.browse'))
                .placement('left'))
            .on('click', function() {
                d3.select(document.createElement('input'))
                    .attr('type', 'file')
                    .on('change', function() {
                        context.background().gpxLayerFiles(d3.event.target.files);
                    })
                    .node().click();
            })
            .call(iD.svg.Icon('#icon-geolocate'));

        label = gpxLayerItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('gpx.drag_drop'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .property('disabled', true)
            .on('change', clickGpx);

        label.append('span')
            .text(t('gpx.local_layer'));


        // area fills
        content.append('a')
            .text(t('map_data.fill_area'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                fillContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var fillContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'none');

        var fillList = fillContainer.append('ul')
            .attr('class', 'layer-list');


        // feature filters
        content.append('a')
            .text(t('map_data.map_features'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                featureContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var featureContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'none');

        var featureList = featureContainer.append('ul')
            .attr('class', 'layer-list');


        context.features()
            .on('change.map_data-update', update);

        setFill(fillDefault);

        var keybinding = d3.keybinding('features')
            .on(key, togglePanel)
            .on('W', toggleWireframe)
            .on('B', hidePanel)
            .on('H', hidePanel);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.map_data-outside', hidePanel);
        context.container().on('mousedown.map_data-outside', hidePanel);
    }

    return map_data;
};
