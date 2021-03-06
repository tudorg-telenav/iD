iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer()
            .projection(context.projection),
        gpxLayer = iD.GpxLayer(context, dispatch)
            .projection(context.projection),
        mapillaryLayer = iD.MapillaryLayer(context),
        telenavLayerTR = iD.TelenavLayerTR(context),
        telenavLayerMR = iD.TelenavLayerMR(context),
        telenavLayerDOF = iD.TelenavLayerDOF(context),
        telenavLayer = iD.TelenavLayer(context),
        overlayLayers = [];

    var backgroundSources;

    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }

    function updateImagery() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
            q = iD.util.stringQs(location.hash.substring(1));

        var id = b.id;
        if (id === 'custom') {
            id = 'custom:' + b.template;
        }

        if (id) {
            q.background = id;
        } else {
            delete q.background;
        }

        if (o) {
            q.overlays = o;
        } else {
            delete q.overlays;
        }

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [b.imageryUsed()];

        overlayLayers.forEach(function (d) {
            var source = d.source();
            if (!source.isLocatorOverlay()) {
                imageryUsed.push(source.imageryUsed());
            }
        });

        if (background.showsGpxLayer()) {
            imageryUsed.push('Local GPX');
        }

        context.history().imageryUsed(imageryUsed);
    }

    function background(selection) {
        var base = selection.selectAll('.background-layer')
            .data([0]);

        base.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer background-layer');

        base.call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) { return d.source().name(); });

        overlays.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer layer-overlay');

        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();

        var gpx = selection.selectAll('.layer-gpx')
            .data([0]);

        gpx.enter().insert('div')
            .attr('class', 'layer-layer layer-gpx');

        gpx.call(gpxLayer);

        var mapillary = selection.selectAll('.layer-mapillary')
            .data([0]);

        mapillary.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary');

        mapillary.call(mapillaryLayer);

        var telenavTR = selection.selectAll('.layer-telenav-tr')
            .data([0]);

        telenavTR.enter().insert('div')
            .attr('class', 'layer-layer layer-telenav-tr');

        telenavTR.call(telenavLayerTR);

        var telenavMR = selection.selectAll('.layer-telenav-mr')
            .data([0]);

        telenavMR.enter().insert('div')
            .attr('class', 'layer-layer layer-telenav-mr');

        telenavMR.call(telenavLayerMR);

        var telenavDOF = selection.selectAll('.layer-telenav-dof')
            .data([0]);

        telenavDOF.enter().insert('div')
            .attr('class', 'layer-layer layer-telenav-dof');

        telenavDOF.call(telenavLayerDOF);

        var telenav = selection.selectAll('.layer-telenav')
            .data([0]);

        telenav.enter().insert('div')
            .attr('class', 'layer-layer layer-telenav');

        telenav.call(telenavLayer);
    }

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        gpxLayer.dimensions(_);
        mapillaryLayer.dimensions(_);
        telenavLayerTR.dimensions(_);
        telenavLayerMR.dimensions(_);
        telenavLayerDOF.dimensions(_);
        telenavLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        baseLayer.source(d);
        dispatch.change();
        updateImagery();

        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enable();
    };

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    background.gpxLayerFiles = function(fileList) {
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
            iD.ui.MapInMap.gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
            background.zoomToGpxLayer();
            dispatch.change();
        };

        reader.readAsText(f);
    };

    background.zoomToGpxLayer = function() {
        if (background.hasGpxLayer()) {
            var map = context.map(),
                viewport = map.trimmedExtent().polygon(),
                coords = _.reduce(gpxLayer.geojson().features, function(coords, feature) {
                    var c = feature.geometry.coordinates;
                    return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
                }, []);

            if (!iD.geo.polygonIntersectsPolygon(viewport, coords, true)) {
                var extent = iD.geo.Extent(d3.geo.bounds(gpxLayer.geojson()));
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }
        }
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enable(!gpxLayer.enable());
        iD.ui.MapInMap.gpxLayer.enable(!iD.ui.MapInMap.gpxLayer.enable());
        dispatch.change();
    };

    background.showsMapillaryLayer = function() {
        return mapillaryLayer.enable();
    };

    background.toggleMapillaryLayer = function() {
        mapillaryLayer.enable(!mapillaryLayer.enable());
        dispatch.change();
    };

    background.showsTelenavLayerTR = function() {
        return telenavLayerTR.enable();
    };

    background.toggleTelenavLayerTR = function() {
        telenavLayerTR.enable(!telenavLayerTR.enable());
        dispatch.change();
    };

    background.showsTelenavLayerMR = function() {
        return telenavLayerMR.enable();
    };

    background.toggleTelenavLayerMR = function() {
        telenavLayerMR.enable(!telenavLayerMR.enable());
        dispatch.change();
    };

    background.showsTelenavLayerDOF = function() {
        return telenavLayerDOF.enable();
    };

    background.toggleTelenavLayerDOF = function() {
        telenavLayerDOF.enable(!telenavLayerDOF.enable());
        dispatch.change();
    };

    background.showsTelenavLayer = function() {
        return telenavLayer.enable();
    };

    background.toggleTelenavLayer = function() {
        telenavLayer.enable(!telenavLayer.enable());
        dispatch.change();
    };

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.id === 'custom' && baseLayer.source().id === 'custom') ||
            overlayLayers.some(function(l) { return l.source() === d; });
    };

    background.overlayLayerSources = function() {
        return overlayLayers.map(function (l) { return l.source(); });
    };

    background.toggleOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (layer.source() === d) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.change();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.change();
        return background;
    };

    background.load = function(imagery) {
        function parseMap(qmap) {
            if (!qmap) return false;
            var args = qmap.split('/').map(Number);
            if (args.length < 3 || args.some(isNaN)) return false;
            return iD.geo.Extent([args[1], args[2]]);
        }

        var q = iD.util.stringQs(location.hash.substring(1)),
            chosen = q.background || q.layer,
            extent = parseMap(q.map),
            best;

        backgroundSources = imagery.map(function(source) {
            if (source.type === 'bing') {
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

        if (!chosen && extent) {
            best = _.find(this.sources(extent), function(s) { return s.best(); });
        }

        if (chosen && chosen.indexOf('custom:') === 0) {
            background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
        } else {
            background.baseLayerSource(findSource(chosen) || best || findSource('Bing') || backgroundSources[1]);
        }

        var locator = _.find(backgroundSources, function(d) {
            return d.overlay && d.default;
        });

        if (locator) {
            background.toggleOverlayLayer(locator);
        }

        var overlays = (q.overlays || '').split(',');
        overlays.forEach(function(overlay) {
            overlay = findSource(overlay);
            if (overlay) background.toggleOverlayLayer(overlay);
        });

        var gpx = q.gpx;
        if (gpx) {
            d3.text(gpx, function(err, gpxTxt) {
                if (!err) {
                    gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
                    iD.ui.MapInMap.gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
                    dispatch.change();
                }
            });
        }
    };

    return d3.rebind(background, dispatch, 'on');
};
