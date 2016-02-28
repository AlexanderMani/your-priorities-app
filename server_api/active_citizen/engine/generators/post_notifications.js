var models = require("../../../models");
var auth = require('../../authorization');
var log = require('../../utils/logger');
var toJson = require('../../utils/to_json');
var async = require('async');
var getModelAndUsersByType = require('notification_utils').getModelAndUsersByType;
var addNotificationsForUsers = require('notification_utils').addNotificationsForUsers;

var generateNotificationsForNewIdea = function (activity, uniqueUserIds, callback) {

  // Notifications for all new posts in community
  getModelAndUsersByType(models.Community, activity.Community.id, "all_community", function(error, community) {
    if (error) {
      callback(error);
    } else {
      addNotificationsForUsers(activity, community.Users, "notification.post.new", uniqueUserIds, callback);
    }
  });

  // Notifications for all new posts in group
  getModelAndUsersByType(models.Group, activity.Group.id, "all_group", function(error, community) {
    if (error) {
      callback(error);
    } else {
      addNotificationsForUsers(activity, community.Users, "notification.post.new", uniqueUserIds, callback);
    }
  });

  // TODO: Add AcWatching community and group users
};

var generateNotificationsForEndorsements = function (activity, user, callback) {
  // Notifications for endorsement on posts I've created
  model.Post({
    where: { id: activity.object.postId },
    include: [
      {
        model: models.User,
        required: true,
        where: {
          "notifications_settings.my_posts.method": {
            $gt: 0
          }
        }
      }
    ]
  }).then( function(post) {
    if (post) {
      models.AcNotification.find({
        where: {
          user_id: user.id,
          type: 'notification.post.endorsement',
          created_at: {
            $lt: new Date(),
            $gt: new Date(new Date() - 6 * 60 * 60 * 1000)
          }
        }
      }).then(function(notification) {
        if (notification) {
          notification.addAcActivities(activity).then(function (results) {
            if (results) {
              callback();
            } else {
              callback("Notification Error Can't add activity");
            }
          });
        } else {
          models.AcNotification.createNotificationFromActivity(user, activity, notification_type, 50, function (error) {
            callback(error);
          });
        }
      });
    } else {
      callback('Not found or muted');
    }
  }).catch(error, function() {
    callback(error);
  });

  // TODO: Add AcWatching users
};

exports = function (activity, callback) {

  // Make sure not to create duplicate notifications to the same user
  var uniqueUserIds = {};

  if (activity.type=='activity.post.new') {
    generateNotificationsForNewIdea(activity, uniqueUserIds, callback);
  } else if (activity.type=='activity.post.endorsement.new' || activity.type=='activity.post.opposition.new') {
    generateNotificationsForEndorsements(activity, uniqueUserIds, callback)
  }
};
