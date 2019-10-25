/* global tvDisplay */

tvDisplay.tvContent = (function() {
    "use strict";

    return {
      init: function(contentJSON) {

        const remoteURL = tvDisplay.getContentProperty(contentJSON, "remoteURL") || "";

        const socialIconEles = tvDisplay.contentContainer.getElementsByClassName("social-icon");

        for (let iconIndex = 0, iconLength = socialIconEles.length; iconIndex < iconLength; iconIndex += 1) {

          const iconEle = socialIconEles[iconIndex];
          iconEle.src = remoteURL + "content/cityweb-stayConnected/" + iconEle.getAttribute("data-src");
        }

      }
    };

}());
