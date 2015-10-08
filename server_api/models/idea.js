var async = require("async");

"use strict";

// https://www.npmjs.org/package/enum for state of ideas

module.exports = function(sequelize, DataTypes) {
  var Idea = sequelize.define("Idea", {
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    description: DataTypes.TEXT,
    user_id: DataTypes.INTEGER,
    position: DataTypes.INTEGER,
    counter_endorsements_up: { type: DataTypes.INTEGER, defaultValue: 0 },
    counter_endorsements_down: { type: DataTypes.INTEGER, defaultValue: 0 },
    counter_points: { type: DataTypes.INTEGER, defaultValue: 0 },
    counter_comments: { type: DataTypes.INTEGER, defaultValue: 0 },
    counter_all_activities: { type: DataTypes.INTEGER, defaultValue: 0 },
    counter_main_activities: { type: DataTypes.INTEGER, defaultValue: 0 },
    impressions_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    location: DataTypes.JSONB,
    cover_media_type: DataTypes.STRING,
    deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    legacy_idea_id: DataTypes.INTEGER
  }, {

    defaultScope: {
      where: {
        deleted: false
      }
    },

    underscored: true,

    timestamps: true,

    tableName: 'ideas',

    classMethods: {
      associate: function(models) {
        Idea.hasMany(models.Point);
        Idea.hasMany(models.Endorsement);
        Idea.hasMany(models.IdeaRevision);
        Idea.belongsTo(models.Category);
        Idea.belongsTo(models.User);
        Idea.belongsTo(models.Group, {foreignKey: "group_id"});
        Idea.belongsToMany(models.Image, { as: 'IdeaImages', through: 'IdeaImage' });
        Idea.belongsToMany(models.Image, { as: 'IdeaHeaderImages', through: 'IdeaHeaderImage' });
        Idea.belongsToMany(models.Image, { as: 'IdeaUserImages', through: 'IdeaUserImage' });
      },

      getSearchVector: function() {
        return 'IdeaText';
      },

      addFullTextIndex: function() {

        if(sequelize.options.dialect !== 'postgres') {
          console.log('Not creating search index, must be using POSTGRES to do this');
          return;
        }

        console.log("Adding full text index");

        var searchFields = ['name', 'description'];
        var Idea = this;

        var vectorName = Idea.getSearchVector();
        sequelize
            .query('ALTER TABLE "' + Idea.tableName + '" ADD COLUMN "' + vectorName + '" TSVECTOR')
            .then(function() {
              return sequelize
                  .query('UPDATE "' + Idea.tableName + '" SET "' + vectorName + '" = to_tsvector(\'english\', ' + searchFields.join(' || \' \' || ') + ')')
                  .error(console.log);
            }).then(function() {
              return sequelize
                  .query('CREATE INDEX post_search_idx ON "' + Idea.tableName + '" USING gin("' + vectorName + '");')
                  .error(console.log);
            }).then(function() {
              return sequelize
                  .query('CREATE TRIGGER post_vector_update BEFORE INSERT OR UPDATE ON "' + Idea.tableName + '" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger("' + vectorName + '", \'pg_catalog.english\', ' + searchFields.join(', ') + ')')
                  .error(console.log);
            }).error(console.log);

      },

      search: function(query, groupId, modelCategory) {
        console.log("In search for " + query);

        if(sequelize.options.dialect !== 'postgres') {
          console.log('Search is only implemented on POSTGRES database');
          return;
        }

        var Idea = this;

        query = sequelize.getQueryInterface().escape(query);
        console.log(query);

        var where = '"'+Idea.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ')';

        return Idea.findAll({
          order: "created_at DESC",
          where: [where, []],
          limit: 100,
          include: [ modelCategory ]
        });
      }
    },

    instanceMethods: {

      updateAllExternalCounters: function(req, direction, done) {
        async.parallel([
          function(callback) {
            sequelize.models.Group.find({
              where: {id: this.group_id}
            }).then(function (group) {
              if (direction=='up')
                group.increment('counter_ideas');
              else if (direction=='down')
                group.decrement('counter_ideas');
              sequelize.models.Community.find({
                where: {id: group.community_id}
              }).then(function (community) {
                if (direction=='up')
                  community.increment('counter_ideas');
                else if (direction=='down')
                  community.decrement('counter_ideas');
                callback();
              }.bind(this));
            }.bind(this))
          }.bind(this),
          function(callback) {
            if (req.ypDomain) {
              if (direction=='up')
                req.ypDomain.increment('counter_ideas');
              else if (direction=='down')
                req.ypDomain.decrement('counter_ideas');
              callback();
            } else {
              callback();
            }
          }.bind(this)
        ], function(err) {
          done(err);
        });
      },

      setupHeaderImage: function(body, done) {
        if (body.uploadedHeaderImageId) {
          sequelize.models.Image.find({
            where: {id: body.uploadedHeaderImageId}
          }).then(function (image) {
            if (image)
              this.addIdeaHeaderImage(image);
            done();
          }.bind(this));
        } else done();
      },

      setupImages: function(body, done) {
        async.parallel([
          function(callback) {
            this.setupHeaderImage(body, function (err) {
              if (err) return callback(err);
              callback();
            });
          }.bind(this)
        ], function(err) {
          done(err);
        });
      },

      setupAfterSave: function(req, res, done) {
        var idea = this;
        var thisRevision = sequelize.models.IdeaRevision.build({
          name: idea.name,
          description: idea.description,
          group_id: idea.groupId,
          user_id: req.user.id,
          this_id: idea.id
        });
        thisRevision.save().then(function() {
          var point = sequelize.models.Point.build({
            group_id: idea.groupId,
            idea_id: idea.id,
            content: req.body.pointFor,
            value: 1,
            user_id: req.user.id
          });
          point.save().then(function() {
            var pointRevision = sequelize.models.PointRevision.build({
              group_id: point.groupId,
              idea_id: idea.id,
              content: point.content,
              user_id: req.user.id,
              point_id: point.id
            });
            pointRevision.save().then(function() {
              done();
            });
          });
        });
      }
    }
  });

  return Idea;
};
