// pages/composeFile.js
var config = require('../../utils/config.js');

var Base64 = require('../../lib/base64.js').Base64;
var util = require('../../utils/util.js');
var cos = require('../../utils/util.js').getCOSInstance();



var ctx =null;

Page({
   
  /**
   * 页面的初始数据
   */
  data: {
    arrx:[],
    arry:[],
    arrz:[],
    showView:true,
    windowH:300,
    windowW: 300,
    ShowWatermerView:false,
    ShowFetchView:false,
    ShowComposeView:false,
    ImgUrl: "",
    WatermarImgUrl:"",
    FetchWatermerURL:"",
    ComposeImageURL:"",
    canvasw:30,
    canvash:30,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var app = getApp();
    var temp = false;
    this.setData({
      ImgUrl: options.ImgUrl,
      windowH: app.globalData.WINDOW_HEIGHT,
      windowW: app.globalData.WINDOW_WIDTH,
    })

  },
  onHide:function(){
   this.setData({
     ShowComposeView: false,
     ShowWatermerView: false,
     ShowFetchView: false,
   })
  },
  onShow: function () {
    
    var that = this;
    //检测盲水印是否存在
    util.showLoading("检测盲水印...");
    cos.headObject({
      Bucket: config.Bucket, /* 必须 */
      Region: config.Region,    /* 必须 */
      Key: config.WatermerKey,
    }, function (err, data) {
      util.hideLoading();
      if (err) {
        that.setData({
          ShowComposeView:true,
          ShowWatermerView:true,
          ShowFetchView:false,
          
        })
      } else{
        that.handleDetectWatermer();
      }
    })
  },

  /**
   * 检测图片有没有盲水印
   */
  handleDetectWatermer:function(){
    util.showLoading("检测盲水印...");
    var that = this;
    that.setData({
      ShowWatermerView: false,
      WatermarImgUrl: config.CosHost + config.WatermerKey

    })
    var oringeFilekey = util.getUrlRelativePath(this.data.ImgUrl);
    var rule = `{"rules":[{"fileid":"/FetchImage/extract-${oringeFilekey}","rule":"watermark/4/type/2/image/${Base64.encode(config.CiWatermerHttpHost)}"}]}`;
    this.fetchWatermerResult(rule,function(res){
      if (res.statusCode == 200) {
        var watermarkStatus = util.parseExtractBlindWatermarkResponse(res.data).ProcessResults.WatermarkStatus;
        //认为有盲水印
        if (watermarkStatus > 80) {
          that.setData({
            ShowComposeView: false,
            ShowWatermerView: false,
            ShowFetchView: true,

            ComposeImageURL: that.data.ImgUrl
          })
        } else {
          that.setData({
            ShowComposeView: true,
            ShowWatermerView: false,
            ShowFetchView: false,
            WatermarImgUrl: config.CosHost + config.WatermerKey
          })
        }

      }
    })
    
  },
  
  onHandleEmbedWatermarkEvent: function (watermarKey) {
    util.showLoading("合成中");
    var that  =this;
    var oringeFilekey = util.getUrlRelativePath(this.data.ImgUrl);
    var watermarkUrl = config.CiWatermerHttpHost;
    var header = {};
    var result;
    //合成之后和源文件同名，覆盖原文件
    var pathname = '/' + oringeFilekey;
    var operations = `{"rules":[{"fileid":"${oringeFilekey}","rule":"watermark/3/type/2/image/${Base64.encode(watermarkUrl)}"}]}`
    var url = config.CiV5Host + '/' + oringeFilekey + '?image_process';
    header['Pic-Operations'] = operations;
    header['content-type'] ='image/png';
    util.getAuthorization({
      Method: 'POST', Pathname:pathname
    }, function (AuthData){
      header["Authorization"] = AuthData.Authorization;
      header["x-cos-security-token"]= AuthData.XCosSecurityToken,
      util.post(url,header).then((res)=>{
          util.showToast("合成成功", true);
          result = 'https://' + util.parseEmbedBlindWatermarkResponse(res.data).ProcessResults.Location;
          that.setData({
            ComposeImageURL: result,
            ShowComposeView: false,
            ShowFetchView:true,
            ShowWatermerView:false
          })
      })
    })
   
  },
  

  onHandleShowAddWaterViewEvent:function(){
    wx.navigateTo({
      //第一个不能忘 navigateTo:fail url "pages/fileDetail/pages/composeFile/composeFile" is not in app.json
      url: "/pages/watermerFile/watermerFile"

    })  
  },

  onHandleFetchWatermarEvent:function(){
    util.showLoading("提取中...");
    var that = this;
    var oringeFilekey = util.getUrlRelativePath(this.data.ImgUrl);
    var rule = `{"rules":[{"fileid":"/FetchImage/extract-${oringeFilekey}","rule":"watermark/4/type/2/image/${Base64.encode(config.CiWatermerHttpHost)}"}]}`;
    this.fetchWatermerResult(rule,function (res){
      var watermarkStatus = util.parseExtractBlindWatermarkResponse(res.data).ProcessResults.WatermarkStatus;
      //认为有盲水印
      if (watermarkStatus > 80) {
        util.showToast("提取成功", true);
        var result = 'https://' + util.parseExtractBlindWatermarkResponse(res.data).ProcessResults.Location;
        that.setData({
          FetchWatermerURL: result,
          showView: false,

        })
      } 
    },function(err){
      util.showToast("提取失败", false);
    })
    
  },
  
  fetchWatermerResult: function(rule,callback){
    var that = this;
    var oringeFilekey = util.getUrlRelativePath(this.data.ImgUrl);
    var composeKey = '/' + oringeFilekey;
    var header = {};
    var result; 
    var operations = rule;


    var pathname = composeKey;
    console.log(operations);
    header['Pic-Operations'] = operations;
    header['content-type'] = 'image/png';
    var url = config.CiV5Host + composeKey + '?image_process';
    util.getAuthorization({
      Method: 'POST', Pathname: pathname
    }, function (AuthData) {
      header["Authorization"] = AuthData.Authorization;
      header["x-cos-security-token"] = AuthData.XCosSecurityToken,
        util.post(url, header).then((res) => {
          util.hideLoading();
          callback(res);
        }).catch(res => {
          util.hideLoading();
          throw res;
        })

    })


  }

})

