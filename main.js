var myApp, mainView, $$;
var view;
var widthSymbol = 17,heightSymbol = 17;

require([
    "dojo/on",

    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/MapImageLayer",
    "esri/widgets/Locate",
    "esri/geometry/Point",
    "esri/layers/FeatureLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/widgets/Popup",
    "js/widget/CompleteInfos",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "js/config",
    "dojo/dom-construct",
    "dojo/domReady!"
],
    function (on, Map, MapView, Graphic, GraphicsLayer, MapImageLayer,
        Locate, Point, FeatureLayer, SimpleMarkerSymbol, Popup, CompleteInfos, Legend, Expand, mapconfigs,
        domConstruct
    ) {
        // Initialize your app
        myApp = new Framework7();

        // Export selectors engine
        $$ = Dom7;

        // Add view
        mainView = myApp.addView('.view-main', {
            // Because we use fixed-through navbar we can enable dynamic navbar
            dynamicNavbar: true
        });
        const initBaseMap = () => {
            map = new Map({
                basemap: "osm",

            });

        }
        initBaseMap();
        // Create a MapView instance (for 2D viewing) and set its map property to
        // the map instance we just created
        view = new MapView({
            map: map,
            container: "viewDiv",
            zoom: 13, // Sets the zoom level based on level of detail (LOD)
            center: [106.6586167, 10.775109],
            spatialReference: 102100,

        });
        view.ui.remove('zoom');
        var url = mapconfigs.layers[0].url;
        var displayFields = [
            {
                fieldName: 'IDSUCO',
                label: 'Mã sự cố'
            },
            {
                fieldName: 'VITRI',
                label: 'Địa chỉ'
            },
            {
                fieldName: 'NGUYENNHAN',
                label: 'Nguyên nhân'
            },
            {
                fieldName: 'NGAYCAPNHAT',
                label: 'Ngày cập nhật'
            },
            {
                fieldName: 'GhiChu',
                label: 'Ghi chú'
            }
        ];

        var table = domConstruct.create('table', {
            class: "table",
        });
        var tbody = domConstruct.create('tbody');
        table.appendChild(tbody);
        for (const field of displayFields) {
            let tr = domConstruct.create('tr');
            tbody.appendChild(tr);
            var td1 = domConstruct.create('td', {
                innerHTML: field.label,
                class: 'label'
            });
            tr.appendChild(td1);

            var td2 = domConstruct.create('td', {
                innerHTML: `{` + field.fieldName + `}`,
            });
            if (field.fieldName == 'NGAYCAPNHAT')
                td2.innerHTML = `{${field.fieldName}:${'DateFormat'}}`;
            tr.appendChild(td2);
        }
        var content = table.outerHTML;
        var template = { // autocasts as new PopupTemplate()
            title: "Sự cố",
            content: content
        }
        var layerSuco = new FeatureLayer(url,
            {
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"],
                popupTemplate: template
            });
           


        map.add(layerSuco);

        var locateBtn = new Locate({
            viewModel: { // autocasts as new LocateViewModel()
                view: view,  // assigns the locate widget to a view
                graphic: null
            }
        });

        // Add the locate widget to the top left corner of the view
        view.ui.add(locateBtn, {
            position: "top-left"
        });
        view.on('click', evt => {
            view.popup.dockEnabled = false;
        })
        var layer = new GraphicsLayer();
        map.add(layer);
        var completeInfos = new CompleteInfos(view, layer, layerSuco);
        view.whenLayerView(layerSuco)
            .then(function (layerView) {
                var renderer = layerSuco.renderer;
                renderer.defaultSymbol.width = widthSymbol;
                renderer.defaultSymbol.height = heightSymbol;
                var uniqueValueInfos = renderer.uniqueValueInfos;
                for (const uniqueValueInfo in uniqueValueInfos) {
                    uniqueValueInfos[uniqueValueInfo].symbol.width = widthSymbol;
                    uniqueValueInfos[uniqueValueInfo].symbol.height = heightSymbol;
                }
                renderer.uniqueValueInfos = uniqueValueInfos;
                layerSuco.renderer = renderer;
                var legend = new Legend({
                    view: view,
                    layerInfos: [{
                        layer: layerSuco,
                        title: "Điểm sự cố"
                    }]
                });
                var legendExpand = new Expand({
                    expandIconClass: "esri-icon-menu",
                    expandTooltip:"Chú thích",
                    view: view,
                    content: legend
                });
                view.ui.add(legendExpand, "top-right");
                
            })
            .otherwise(function (error) {
            });

        // - Two groups
        $$('.ac-3').on('click', function () {
            var option = [
                {
                    text: 'Phản ánh sự cố',
                    label: true
                },
                {
                    text: 'Lấy vị trí hiện tại',
                    onClick: function () {
                        locateBtn.locate().then((response) => {
                            var coords = response.coords;
                            completeInfos.addGraphics(coords);
                        });

                    }
                },
                {
                    text: 'Chọn vị trí',
                    onClick: function () {
                        on.once(view, 'click', evt => {
                            evt.stopPropagation();
                            // mainView.router.loadContent('form.html');
                            var coords = evt.mapPoint;

                            completeInfos.addGraphics(coords);
                        })
                    }
                }
            ];
            var cencel = [
                {
                    text: 'Hủy',
                    color: 'red'
                }
            ];
            var groups = [option, cencel];
            myApp.actions(groups);
        });


    });