var Promise = require('bluebird');
var cheerio = require('cheerio');
var Spider = require('./Spider');
var Image = require('./common/image');

module.exports = function (url){
  var spider = new Spider(url);
  return new Promise((resolve, reject) => {
    spider.getHTML(url).then((content) => {
      var detail = {
        url: url
      };
      var $ = cheerio.load(content);
      // get productId from page javascript variables
      detail.productId = spider.getValue('productId');
      // get productId from url
      if (!detail.productId) {
        try {
          detail.productId = url.split('?').shift().split('/').pop().split('.').shift();
        } catch (e) {
          detail.productId = undefined;
        }
      }
      // get name
      $('.detail-wrap h1.product-name').each((key, ele) => {
        if (!ele || !ele.children || !ele.children[0] || !ele.children[0].data) return;
        detail.name = ele.children[0].data;
      });
      // get picture
      detail.gallery = [];
      $('ul.image-thumb-list li span.img-thumb-item img').each((key, ele) => {
        if (!ele || !ele.attribs || !ele.attribs.src) return;
        detail.gallery.push({
          alt: ele.attribs.alt || '',
          // src: ele.attribs.src.replace('_50x50.jpg', '') || ''
          src: Image.getOriginalUrl(ele.attribs.src)
        });
      });
      // get variants
      detail.variants = [];
      $('ul.sku-attr-list li.item-sku-image a img').each((key, ele) => {
        if (!ele || !ele.attribs || !ele.attribs.src) return;
        detail.variants.push({
          alt: ele.attribs.title || '',
          // src: ele.attribs.src.replace('_50x50.jpg', '') || ''
          src: Image.getOriginalUrl(ele.attribs.src)
        });
      });
      //get property
      detail.property = [];
      // get property title
      $("ul.product-property-list li.property-item .propery-title").each((key, ele) => {
        if (!detail.property[key]) detail.property[key] = {};
        if (!ele || !ele.children || !ele.children[0] || !ele.children[0].data) {
          detail.property[key].title = "";
        } else {
          detail.property[key].title = ele.children[0].data;
        }
      });
      // get property description
      $("ul.product-property-list li.property-item .propery-des").each((key, ele) => {
        if (!detail.property[key]) detail.property[key] = {};
        if (!ele || !ele.children || !ele.children[0] || !ele.children[0].data) {
          detail.property[key].des = "";
        } else {
          detail.property[key].des = ele.children[0].data;
        }
      });

      // get order count
      let orderCount = parseInt($('#j-order-num').text().replace(' orders'), 10);
      if (isNaN(orderCount)) {
        detail.orderCount = 0;
      } else {
        detail.orderCount = orderCount;
      }

      // get feedback detail
      detail.feedback = {};
      detail.feedback.count = parseInt($("#j-product-tabbed-pane li[data-trigger='feedback'] a").text().replace("Feedback (", ""), 10);
      detail.feedback.stars = {};
      $("#j-product-rate-balloon ul li").each((index, ele) => {
        detail.feedback.stars[5 - index] = parseInt($(ele).find('.r-num').text(), 10);
      })
      detail.feedback.voteCount = parseInt($('#j-customer-reviews-trigger .rantings-num').text().replace('(', ''), 10);
      detail.feedback.rating = parseFloat($('#j-customer-reviews-trigger .percent-num').text());
      return resolve(detail);
    }, reject);
  });
};
