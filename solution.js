var map = null; //map 全局变量初始化
var pitch = 60;
var bearing = 0; //旋转速度
var paused = false; //控制地图旋转
var policeInfoData = [];
var policeInfoMeshList = [];
var policeInfoMarkerList = [];
var threeLayerAll = null;

$(function () {
    initMap();
    getPoliceData();//获取派出所数据
});

function initMap() {

    map = new maptalks.Map("map", {
        center: [116.98, 36.67],
        minZoom: 8,
        maxZoom: 15,
        zoom: 14,
        pitch: 60,
        fogColor: [0, 0, 0],
        attribution: true,
        zoomControl: false,
        // overviewControl: true, // add overview control
        spatialReference: {
            projection: 'baidu'
        },
        baseLayer: new maptalks.TileLayer('tile', {
            'urlTemplate': 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
            'subdomains': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            'cssFilter': 'invert(100%) grayscale(100%)',
            'attribution': ''
        })
    });


    var noZoomLevel = new maptalks.control.Zoom({
        'position': {
            'top': '200',
            'right': '20'
        },
        'slider': true,
        'zoomLevel': true
    });
    map.addControl(noZoomLevel);


    threeLayer = new maptalks.ThreeLayer('t', {
        forceRenderOnMoving: true,
        forceRenderOnZooming: true,
        forceRenderOnRotating: true
    });

    changeView()
}

function changeView() {
    bearing = bearing + 0.05;
    //map需要为全局变量否则不转动
    map.setBearing(bearing);
    if (!paused) {
        requestAnimationFrame(changeView);
    }
}

function reset(map) {
    requestAnimationFrame(function () {
        paused = false;
        pitch = 60;
        bearing = 0;
        map.setPitch(pitch);
        map.setBearing(bearing);
        //map.setCenter([113.734038, 34.77829]);
    });
}


/**
 * @Description:  渲染三D 柱状图
 * @author guochao yang
 * @date 2019/4/15
 */
function renderThreeObj(policeObj) {

    var policeObj = policeObj || {num: 0, location: [], policeName: ""};
    threeLayer.prepareToDraw = function (gl, scene, camera) {
        scene.add(new THREE.AmbientLight(0xffffff));
        // var light = new THREE.DirectionalLight(0xffffff);
        // light.position.set(0, -10, 10).normalize();
        // scene.add(light);
        createZhuti(scene);

    };

    threeLayer.addTo(map);
}

/**
 * @Description: 渲染柱体
 * @author guochao yang
 * @date 2019/4/16
*/
function createZhuti(scene) {
    policeInfoData.forEach(function (g,index) {
        var heightPerLevel = 10 * g.num;//建筑物的高度
        var jw = g.location;
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        if(g.status) {
            var airtextureTop = new THREE.TextureLoader().load("./images/blueTop.png");//顶部图
            var airtextureWrap = new THREE.TextureLoader().load("./images/blueZhu3.png");//柱图 正确
            var airtextureWrap2 = new THREE.TextureLoader().load("./images/blueZhu2.png");//柱图 正确
            var airtextureWrap3 = new THREE.TextureLoader().load("./images/blueZhu.png");//柱图 正确
            var airtextureWrap4 = new THREE.TextureLoader().load("./images/blueZhu4.png");//柱图

        } else {
            var airtextureTop = new THREE.TextureLoader().load("./images/yellowTop.png");//顶部图
            var airtextureWrap = new THREE.TextureLoader().load("./images/yellowZhu3.png");//柱图
            var airtextureWrap2 = new THREE.TextureLoader().load("./images/yellowZhu4.png");//柱图
            var airtextureWrap3 = new THREE.TextureLoader().load("./images/yellowZhu.png");//柱图 正确
            var airtextureWrap4 = new THREE.TextureLoader().load("./images/yellowZhu2.png");//柱图 正确
        }


        var airmaterialTop = new THREE.MeshBasicMaterial({map: airtextureTop,color:"transparent"});
        var airmaterialWrap = new THREE.MeshBasicMaterial({map: airtextureWrap,color:"transparent"});
        var airmaterialWrap2 = new THREE.MeshBasicMaterial({map: airtextureWrap2,color:"transparent"});
        var airmaterialWrap3 = new THREE.MeshBasicMaterial({map: airtextureWrap3,color:"transparent"});
        var airmaterialWrap4 = new THREE.MeshBasicMaterial({map: airtextureWrap4,color:"transparent"});

        var airmaterials = [airmaterialWrap2,airmaterialWrap,airmaterialWrap3,airmaterialWrap4,airmaterialTop,airmaterialTop];
        var mesh = new THREE.Mesh(geometry, airmaterials);
        var v = threeLayer.coordinateToVector3(new maptalks.Coordinate(jw[0], jw[1]));

        mesh.position.x = v.x;
        mesh.position.y = v.y;
        mesh.position.z = v.z;
        mesh.scale.z = heightPerLevel;
        scene.add(mesh);
        policeInfoMeshList.push(mesh);
    });
}


/**
 * @Description: 渲染柱状图上的mark
 * @author guochao yang
 * @date 2019/4/15
 */
function renderMarks() {

    var layer = new maptalks.VectorLayer('vector', {
        enableAltitude: true,
        // draw altitude
        drawAltitude: {
            lineWidth: 30,
            lineColor: 'transparent'
        }
    }).addTo(map);


    var markers = [];

    policeInfoData.forEach(function (elem) {
        var num = elem.num;
        var height = 10 * num;
        var label = elem.policeName;
        var jwArr = elem.location;
        var fontColor = elem.status ? "#4093FF" : "#FFD788";

        markers.push(new maptalks.Marker(jwArr, {
            properties: {
                altitude: height * 160
            },
            symbol: {
                'textName': num * 100 + "%",
                "textFill": fontColor,
                'textSize': 20,
                'textFaceName': 'sans-serif',
                'textVerticalAlignment': 'top',
                'textAlign': 'center',
                'textDx': 0,
                'textDy': 0,
            }
        }));


        var text = new maptalks.Marker(
            jwArr,
            {
                'properties': {
                    'name': label
                },
                'symbol': {
                    'textFaceName': 'sans-serif',
                    'textName': '{name}',          //value from name in geometry's properties
                    'textWeight': 'normal', //'bold', 'bolder'
                    'textStyle': 'normal', //'italic', 'oblique'
                    'textSize': 18,
                    'textFont': "",     //same as CanvasRenderingContext2D.font, override textName, textWeight and textStyle
                    'textFill': 'rgba(200, 231, 242, 0.6)',
                    'textOpacity': 1,
                    'textHaloFill': '',
                    'textHaloRadius': 0,
                    'textWrapWidth': null,
                    'textWrapCharacter': '',
                    'textLineSpacing': 0,
                    'textDx': 0,
                    'textDy': 60,
                    'textHorizontalAlignment': 'auto', //left | middle | right | auto
                    'textVerticalAlignment': 'bottom',   // top | middle | bottom | auto
                    'textAlign': 'center' //left | right | center | auto
                }
            }
        ).addTo(layer);
    });
    layer.addGeometry(markers);
    // console.log(layer);
    // map.setPitch(60);

}


function getPoliceData() {
    $.get("./json/police.json", function (data) {
        if (data.resultCode == 0) {
            policeInfoData = [];
            policeInfoData = data.data.policeLocation;
            renderThreeObj();//渲染柱形图
            renderMarks();
        }
    })
}

$("#resetBtn").click(function (){
    policeInfoMeshList.forEach(function (elem,index){
        elem.scale.z = Math.random().toFixed(1)*10;
        policeInfoData[index].num = elem.scale.z;
    });
});

