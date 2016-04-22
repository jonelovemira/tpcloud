define(['Software', 'SoftwareView', 'SoftwareController'], 
    function (Software, SoftwareView, SoftwareController) {
    var sc = new SoftwareController();
    var sv = new SoftwareView();
    var s = new Software();
    sc.view = sv;
    sc.model = s;
    sv.model = s;

    sc.getUpdateInfos();
    sc.initHandler();
})